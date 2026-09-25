import DateField from '@/components/ui/DateField';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import { confirmAction, showMessage } from '@/utils/dialogs';
import { parseAmount } from '@/utils/money';
import { processRecurringTransactions } from '@/utils/recurringService';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format, startOfDay } from 'date-fns';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RecurringRow = {
    id: number;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    frequency: 'weekly' | 'monthly';
    next_due_date: number;
    note: string | null;
    currency: string | null;
};

export default function ManageRecurring() {
    const db = useSQLiteContext();
    const { t, currencies, currencyCode, dateLocale, formatMoney } = useLocalization();
    const colors = Colors[useColorScheme() ?? 'light'];

    const [recurringItems, setRecurringItems] = useState<RecurringRow[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isModalVisible, setModalVisible] = useState(false);

    // Form State
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [txCurrency, setTxCurrency] = useState(currencyCode);
    const [startDate, setStartDate] = useState(new Date());
    const [noteError, setNoteError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setRecurringItems(await db.getAllAsync<RecurringRow>('SELECT * FROM recurring_transactions ORDER BY next_due_date'));
        setCategories(await db.getAllAsync('SELECT * FROM categories ORDER BY name'));
    };

    const openModal = () => {
        setAmount('');
        setNote('');
        setSelectedCategory(null);
        setNoteError(null);
        setTxCurrency(currencyCode);
        setStartDate(new Date());
        setModalVisible(true);
    };

    const handleAdd = async () => {
        const parsedAmount = parseAmount(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0 || !selectedCategory) {
            showMessage(t('error'), t('fill_required'));
            return;
        }
        if (!note.trim()) {
            setNoteError(t('note_required'));
            return;
        }

        try {
            const first = startOfDay(startDate).getTime();
            await db.runAsync(
                'INSERT INTO recurring_transactions (amount, type, category, frequency, next_due_date, start_date, note, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [parsedAmount, type, selectedCategory, frequency, first, first, note.trim(), txCurrency]
            );
            // Books the first occurrence right away when it is due today or in the past.
            await processRecurringTransactions(db);
            setModalVisible(false);
            loadData();
        } catch (error) {
            console.error(error);
            showMessage(t('error'), t('save_failed'));
        }
    };

    const handleDelete = (id: number) => {
        confirmAction(t('delete_recurring_title'), t('delete_recurring_message'), t('delete'), t('cancel'), async () => {
            await db.runAsync('DELETE FROM recurring_transactions WHERE id = ?', [id]);
            loadData();
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScreenHeader title={t('recurring')} />
            <View style={styles.body}>
                <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={openModal}>
                    <Text style={styles.addButtonText}>+ {t('new_recurring')}</Text>
                </TouchableOpacity>

                <FlatList
                    data={recurringItems}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>{t('no_recurring')}</Text>}
                    renderItem={({ item }) => (
                        <View style={[styles.card, { backgroundColor: colors.surface }]}>
                            <View style={styles.cardLeft}>
                                <Text style={[styles.itemCategory, { color: colors.text }]}>{item.note || item.category}</Text>
                                <Text style={[styles.itemNote, { color: colors.textSecondary }]}>
                                    {item.category} • {t(item.frequency)}
                                </Text>
                                <Text style={[styles.itemNote, { color: colors.textSecondary }]}>
                                    {t('next_due', { date: format(new Date(item.next_due_date), 'd MMM yyyy', { locale: dateLocale }) })}
                                </Text>
                            </View>
                            <View style={styles.cardRight}>
                                <Text style={[styles.itemAmount, { color: item.type === 'income' ? colors.success : colors.text }]}>
                                    {item.type === 'income' ? '+' : '-'}{formatMoney(item.amount, item.currency)}
                                </Text>
                                <TouchableOpacity onPress={() => handleDelete(item.id)} accessibilityLabel={t('delete')}>
                                    <Ionicons name="trash-outline" size={20} color={colors.error} style={{ marginTop: 8 }} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    contentContainerStyle={styles.list}
                />
            </View>

            <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
                <ScrollView
                    style={{ backgroundColor: colors.background }}
                    contentContainerStyle={styles.modalContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{t('new_recurring')}</Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('amount')}</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="0.00"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="decimal-pad"
                            inputMode="decimal"
                            value={amount}
                            onChangeText={(text) => setAmount(text.replace(/[^0-9.,]/g, ''))}
                        />
                        <View style={[styles.row, { marginTop: 8 }]}>
                            {currencies.map(c => (
                                <TouchableOpacity
                                    key={c.code}
                                    style={[styles.currencyPill, { backgroundColor: txCurrency === c.code ? colors.tint : colors.secondary }]}
                                    onPress={() => setTxCurrency(c.code)}
                                >
                                    <Text style={{ color: txCurrency === c.code ? '#FFF' : colors.text, fontWeight: 'bold' }}>{c.flag} {c.code}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('type')}</Text>
                        <View style={styles.row}>
                            {(['expense', 'income'] as const).map(option => {
                                const active = type === option;
                                const activeColor = option === 'expense' ? colors.error : colors.success;
                                return (
                                    <TouchableOpacity
                                        key={option}
                                        onPress={() => {
                                            setType(option);
                                            setSelectedCategory(null);
                                        }}
                                        style={[styles.segment, active ? { backgroundColor: activeColor, borderColor: activeColor } : { borderColor: colors.border }]}
                                    >
                                        <Ionicons name={option === 'expense' ? 'arrow-down' : 'arrow-up'} size={16} color={active ? '#FFF' : colors.textSecondary} />
                                        <Text style={[styles.segmentText, { color: active ? '#FFF' : colors.textSecondary }]}>{t(option)}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('frequency')}</Text>
                        <View style={styles.row}>
                            {(['monthly', 'weekly'] as const).map(option => {
                                const active = frequency === option;
                                return (
                                    <TouchableOpacity
                                        key={option}
                                        onPress={() => setFrequency(option)}
                                        style={[styles.segment, active ? { backgroundColor: colors.tint, borderColor: colors.tint } : { borderColor: colors.border }]}
                                    >
                                        <Text style={[styles.segmentText, { color: active ? '#FFF' : colors.textSecondary }]}>{t(option)}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={[styles.inputGroup, styles.dateRow]}>
                        <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>{t('first_date')}</Text>
                        <DateField value={startDate} onChange={setStartDate} />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('category')}</Text>
                        <View style={styles.pillWrap}>
                            {categories.filter(c => c.type === type).map(cat => {
                                const active = selectedCategory === cat.name;
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => setSelectedCategory(cat.name)}
                                        style={[styles.catPill, { borderColor: colors.border }, active && { backgroundColor: colors.tint, borderColor: colors.tint }]}
                                    >
                                        <Text style={{ color: active ? '#FFF' : colors.text }}>{cat.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('note')}</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { color: colors.text, borderColor: noteError ? colors.error : colors.border },
                                noteError ? { backgroundColor: colors.error + '10' } : null,
                            ]}
                            placeholder={t('recurring_note_placeholder')}
                            placeholderTextColor={colors.textSecondary}
                            value={note}
                            maxLength={200}
                            onChangeText={(text) => {
                                setNote(text);
                                if (text.trim()) setNoteError(null);
                            }}
                        />
                        {noteError && <Text style={{ color: colors.error, marginTop: 4, fontSize: 12 }}>{noteError}</Text>}
                    </View>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButton}>
                            <Text style={{ color: colors.text }}>{t('cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleAdd} style={[styles.modalButton, { backgroundColor: colors.primary }]}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{t('save')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    body: { flex: 1, paddingHorizontal: 20, width: '100%', maxWidth: 640, alignSelf: 'center' },
    addButton: { padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
    addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    list: { paddingBottom: 40 },
    empty: { textAlign: 'center', marginTop: 24 },
    card: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 16, marginBottom: 12 },
    cardLeft: { flex: 1 },
    cardRight: { alignItems: 'flex-end' },
    itemCategory: { fontSize: 16, fontWeight: '600' },
    itemNote: { fontSize: 12, marginTop: 4 },
    itemAmount: { fontSize: 16, fontWeight: 'bold', fontFamily: 'SpaceMono' },

    modalContainer: { flexGrow: 1, padding: 24, paddingTop: 40, width: '100%', maxWidth: 640, alignSelf: 'center' },
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    input: { padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 18 },
    row: { flexDirection: 'row', gap: 8 },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    currencyPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    segment: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
    segmentText: { fontWeight: '600', marginLeft: 4, fontSize: 14 },
    pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, marginBottom: 40 },
    modalButton: { padding: 16, borderRadius: 16, width: '45%', alignItems: 'center' },
});
