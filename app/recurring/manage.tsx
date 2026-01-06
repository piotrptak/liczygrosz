import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ManageRecurring() {
    const db = useSQLiteContext();
    const router = useRouter();

    const { t, currency: defaultSymbol, currencies, locale, currencyCode } = useLocalization();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [recurringItems, setRecurringItems] = useState<any[]>([]);
    const [isModalVisible, setModalVisible] = useState(false);

    // Form State
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [type, setType] = useState('expense');
    const [frequency, setFrequency] = useState('monthly');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [txCurrency, setTxCurrency] = useState(currencyCode);
    const [errors, setErrors] = useState<{ note?: string }>({});

    useEffect(() => {
        loadData();
    }, []);

    // Sync currency when modal opens or code changes
    useEffect(() => {
        if (isModalVisible) {
            setTxCurrency(currencyCode);
        }
    }, [isModalVisible, currencyCode]);

    const loadData = async () => {
        const items = await db.getAllAsync('SELECT * FROM recurring_transactions');
        setRecurringItems(items);
        const cats = await db.getAllAsync('SELECT * FROM categories');
        setCategories(cats);
    };

    const handleAdd = async () => {
        if (!amount || !selectedCategory) {
            Alert.alert('Error', 'Please fill required fields');
            return;
        }

        if (!note.trim()) {
            setErrors({ note: t('note_required') || 'Note is mandatory' });
            return;
        }
        setErrors({});

        try {
            const now = new Date();
            // We set next_due_date to 13 months from now so it doesn't duplicate
            const futureDate = new Date(now);
            futureDate.setMonth(futureDate.getMonth() + 13);

            await db.withTransactionAsync(async () => {
                // 1. Insert the definition
                await db.runAsync(
                    'INSERT INTO recurring_transactions (amount, type, category, frequency, next_due_date, note, currency) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [parseFloat(amount), type, selectedCategory, frequency, futureDate.getTime(), note, txCurrency]
                );

                // 2. Generate for next 12 months immediately
                for (let i = 0; i < 12; i++) {
                    const txDate = new Date(now);
                    if (frequency === 'weekly') {
                        txDate.setDate(txDate.getDate() + (i * 7));
                    } else {
                        txDate.setMonth(txDate.getMonth() + i);
                    }

                    await db.runAsync(
                        'INSERT INTO transactions (amount, type, category, date, note, currency) VALUES (?, ?, ?, ?, ?, ?)',
                        [parseFloat(amount), type, selectedCategory, txDate.getTime(), `Recurring: ${note}`, txCurrency]
                    );
                }
            });

            setModalVisible(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add recurring item');
        }
    };

    const handleDelete = async (id: number) => {
        Alert.alert('Delete', 'Stop this recurring transaction?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await db.runAsync('DELETE FROM recurring_transactions WHERE id = ?', [id]);
                    loadData();
                }
            }
        ]);
    };

    const resetForm = () => {
        setAmount('');
        setNote('');
        setSelectedCategory(null);
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{t('recurring')}</Text>
            </View>

            <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.addButtonText}>+ {t('new_recurring')}</Text>
            </TouchableOpacity>

            <FlatList
                data={recurringItems}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <View style={styles.cardLeft}>
                            <Text style={[styles.itemCategory, { color: colors.text }]}>{item.category}</Text>
                            <Text style={[styles.itemNote, { color: colors.textSecondary }]}>{item.frequency} • {item.note || 'No note'}</Text>
                        </View>
                        <View style={styles.cardRight}>
                            <Text style={[styles.itemAmount, { color: item.type === 'income' ? colors.success : colors.text }]}>
                                {item.type === 'income' ? '+' : ''}{currencies.find(c => c.code === item.currency)?.symbol || defaultSymbol}{item.amount.toFixed(2)}
                            </Text>
                            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                <Ionicons name="trash-outline" size={20} color={colors.error} style={{ marginTop: 8 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                contentContainerStyle={styles.list}
            />

            <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
                <ScrollView contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{t('new_recurring')}</Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Amount</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border, flex: 2 }]}
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                            />
                            <View style={{ flex: 1 }}>
                                <ScrollView horizontal contentContainerStyle={{ alignItems: 'center' }}>
                                    {currencies.map(c => (
                                        <TouchableOpacity
                                            key={c.code}
                                            style={{ padding: 8, backgroundColor: txCurrency === c.code ? colors.tint : 'transparent', borderRadius: 8, marginRight: 4 }}
                                            onPress={() => setTxCurrency(c.code)}
                                        >
                                            <Text style={{ color: txCurrency === c.code ? '#FFF' : colors.text, fontWeight: 'bold' }}>{c.code}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Type & Frequency</Text>
                        <View style={styles.row}>
                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                <TouchableOpacity
                                    onPress={() => setType('expense')}
                                    style={[
                                        styles.miniTypeBtn,
                                        type === 'expense' ? { backgroundColor: colors.error, borderColor: colors.error } : { borderColor: colors.border }
                                    ]}
                                >
                                    <Ionicons name="arrow-down" size={16} color={type === 'expense' ? '#FFF' : colors.textSecondary} />
                                    <Text style={[styles.miniTypeBtnText, { color: type === 'expense' ? '#FFF' : colors.textSecondary }]}>Exp</Text>
                                </TouchableOpacity>
                                <View style={{ width: 8 }} />
                                <TouchableOpacity
                                    onPress={() => setType('income')}
                                    style={[
                                        styles.miniTypeBtn,
                                        type === 'income' ? { backgroundColor: colors.success, borderColor: colors.success } : { borderColor: colors.border }
                                    ]}
                                >
                                    <Ionicons name="arrow-up" size={16} color={type === 'income' ? '#FFF' : colors.textSecondary} />
                                    <Text style={[styles.miniTypeBtnText, { color: type === 'income' ? '#FFF' : colors.textSecondary }]}>Inc</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity onPress={() => setFrequency(frequency === 'monthly' ? 'weekly' : 'monthly')} style={[styles.pill, { backgroundColor: colors.secondary }]}>
                                <Text style={{ color: colors.text }}>{frequency.toUpperCase()}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                        {(() => {
                            const filteredCats = categories.filter(c => c.type === type);
                            const chunks = [];
                            for (let i = 0; i < filteredCats.length; i += 2) {
                                chunks.push(filteredCats.slice(i, i + 2));
                            }

                            return chunks.map((chunk, i) => (
                                <View key={i} style={{ marginRight: 8 }}>
                                    {chunk.map(cat => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            onPress={() => setSelectedCategory(cat.name)}
                                            style={[
                                                styles.catPill,
                                                selectedCategory === cat.name && { backgroundColor: colors.tint },
                                                { marginBottom: 8 }
                                            ]}
                                        >
                                            <Text style={{ color: selectedCategory === cat.name ? '#FFF' : colors.text }}>{cat.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ));
                        })()}
                    </ScrollView>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Note</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { color: colors.text, borderColor: errors.note ? colors.error : colors.border },
                                errors.note ? { backgroundColor: colors.error + '10' } : {}
                            ]}
                            placeholder="Rent, Netflix, etc."
                            value={note}
                            onChangeText={(t) => {
                                setNote(t);
                                if (t.trim()) setErrors({});
                            }}
                        />
                        {errors.note && (
                            <Text style={{ color: colors.error, marginTop: 4, fontSize: 12 }}>
                                {errors.note}
                            </Text>
                        )}
                    </View>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButton}>
                            <Text style={{ color: colors.text }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleAdd} style={[styles.modalButton, { backgroundColor: colors.primary }]}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backButton: { marginRight: 16 },
    title: { fontSize: 28, fontWeight: 'bold', fontFamily: 'SpaceMono' },
    addButton: { padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
    addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    list: { paddingBottom: 40 },
    card: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 16, marginBottom: 12 },
    cardLeft: { flex: 1 },
    cardRight: { alignItems: 'flex-end' },
    itemCategory: { fontSize: 16, fontWeight: '600' },
    itemNote: { fontSize: 12, marginTop: 4 },
    itemAmount: { fontSize: 16, fontWeight: 'bold', fontFamily: 'SpaceMono' },

    modalContainer: { flexGrow: 1, padding: 24, paddingTop: 40 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    input: { padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 18 },
    row: { flexDirection: 'row', gap: 12 },
    pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, flex: 1, alignItems: 'center' },
    categoryScroll: { maxHeight: 120, marginBottom: 20 },
    catPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#eee', justifyContent: 'center' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40, marginBottom: 40 },
    modalButton: { padding: 16, borderRadius: 16, width: '45%', alignItems: 'center' },
    miniTypeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
    miniTypeBtnText: { fontWeight: '600', marginLeft: 4, fontSize: 13 },
});
