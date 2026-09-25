import DateField from '@/components/ui/DateField';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import { confirmAction, showMessage } from '@/utils/dialogs';
import { parseAmount } from '@/utils/money';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Category = { id: number; name: string; type: string; icon: string | null; color: string | null };

export default function AddTransactionForm({ transactionId }: { transactionId?: number }) {
    const db = useSQLiteContext();
    const router = useRouter();
    const { t, currencies, currencyCode, getCurrencyFlag } = useLocalization();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const isEditing = transactionId !== undefined;
    const amountInputRef = useRef<TextInput>(null);

    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [noteError, setNoteError] = useState<string | null>(null);
    const [txCurrency, setTxCurrency] = useState(currencyCode);
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [date, setDate] = useState(new Date());

    const loadCategories = useCallback(async () => {
        const result = await db.getAllAsync<Category>('SELECT * FROM categories WHERE type = ? ORDER BY name', [type]);
        setCategories(result);
    }, [db, type]);

    // Reload on focus as categories may have been edited in the meantime.
    useFocusEffect(useCallback(() => { loadCategories(); }, [loadCategories]));

    useEffect(() => {
        if (!isEditing) return;
        (async () => {
            const tx = await db.getFirstAsync<any>('SELECT * FROM transactions WHERE id = ?', [transactionId!]);
            if (!tx) {
                showMessage(t('error'), t('transaction_not_found'));
                router.back();
                return;
            }
            setAmount(String(tx.amount));
            setNote(tx.note ?? '');
            setType(tx.type);
            setSelectedCategory(tx.category);
            setTxCurrency(tx.currency || currencyCode);
            setDate(new Date(tx.date));
        })();
    }, [transactionId]);

    // A new transaction follows the default currency from Profile.
    useEffect(() => {
        if (!isEditing) setTxCurrency(currencyCode);
    }, [currencyCode]);

    const resetForm = () => {
        setAmount('');
        setNote('');
        setSelectedCategory(null);
        setNoteError(null);
        setDate(new Date());
        setTxCurrency(currencyCode);
    };

    const handleTypeChange = (next: 'income' | 'expense') => {
        if (next === type) return;
        setType(next);
        setSelectedCategory(null);
    };

    const handleSave = async () => {
        const parsedAmount = parseAmount(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            showMessage(t('error'), t('invalid_amount'));
            return;
        }
        if (!selectedCategory) {
            showMessage(t('error'), t('select_category_error'));
            return;
        }
        if (!note.trim()) {
            setNoteError(t('note_required'));
            return;
        }

        try {
            if (isEditing) {
                await db.runAsync(
                    'UPDATE transactions SET amount = ?, type = ?, category = ?, note = ?, date = ?, currency = ? WHERE id = ?',
                    [parsedAmount, type, selectedCategory, note.trim(), date.getTime(), txCurrency, transactionId!]
                );
                router.back();
            } else {
                await db.runAsync(
                    'INSERT INTO transactions (amount, type, category, date, note, currency) VALUES (?, ?, ?, ?, ?, ?)',
                    [parsedAmount, type, selectedCategory, date.getTime(), note.trim(), txCurrency]
                );
                resetForm();
                router.navigate('/(tabs)');
            }
        } catch (error) {
            console.error(error);
            showMessage(t('error'), t('save_failed'));
        }
    };

    const handleDelete = () => {
        confirmAction(t('delete_transaction_title'), t('delete_transaction_message'), t('delete'), t('cancel'), async () => {
            await db.runAsync('DELETE FROM transactions WHERE id = ?', [transactionId!]);
            router.back();
        });
    };

    const canSave = !!amount && !!selectedCategory;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView
                contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.headerControl}>
                    <View style={styles.titleRow}>
                        {/* The edit screen shows the title in its own header. */}
                        <Text style={[styles.formTitle, { color: colors.text }]}>
                            {isEditing ? '' : t('new_transaction')}
                        </Text>
                        <DateField value={date} onChange={setDate} />
                    </View>

                    <View style={styles.typeSwitcherContainer}>
                        {(['expense', 'income'] as const).map((option, i) => {
                            const active = type === option;
                            const activeColor = option === 'expense' ? colors.error : colors.success;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    onPress={() => handleTypeChange(option)}
                                    style={[
                                        styles.typeButton,
                                        i === 0 && { marginRight: 16 },
                                        active ? { backgroundColor: activeColor } : { borderWidth: 1, borderColor: colors.border },
                                    ]}
                                >
                                    <Ionicons
                                        name={option === 'expense' ? 'arrow-down-circle' : 'arrow-up-circle'}
                                        size={24}
                                        color={active ? '#FFF' : colors.textSecondary}
                                    />
                                    <Text style={[styles.typeBtnText, { color: active ? '#FFF' : colors.textSecondary }]}>{t(option)}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Amount Input */}
                <View style={styles.amountContainer}>
                    <TouchableOpacity
                        style={[styles.currencyBadge, { backgroundColor: colors.secondary }]}
                        onPress={() => setShowCurrencyPicker(v => !v)}
                    >
                        <Text style={{ fontSize: 24, marginRight: 4 }}>{getCurrencyFlag(txCurrency)}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>{txCurrency}</Text>
                    </TouchableOpacity>

                    <TextInput
                        ref={amountInputRef}
                        autoFocus={!isEditing && Platform.OS !== 'web'}
                        style={[styles.amountInput, { color: colors.text }]}
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        returnKeyType="done"
                        value={amount}
                        onChangeText={(text) => setAmount(text.replace(/[^0-9.,]/g, ''))}
                        maxLength={10}
                    />
                </View>

                {showCurrencyPicker && (
                    <View style={styles.currencySelector}>
                        {currencies.map(c => {
                            const active = txCurrency === c.code;
                            return (
                                <TouchableOpacity
                                    key={c.code}
                                    style={[styles.currencyOption, { backgroundColor: active ? colors.tint : colors.secondary }]}
                                    onPress={() => {
                                        setTxCurrency(c.code);
                                        setShowCurrencyPicker(false);
                                    }}
                                >
                                    <Text style={[styles.currencyOptionText, { color: active ? '#FFF' : colors.text }]}>{c.code} ({c.symbol})</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Note Input */}
                <View style={[
                    styles.inputGroup,
                    { backgroundColor: colors.surface },
                    noteError ? { backgroundColor: colors.error + '10', borderWidth: 1, borderColor: colors.error } : null,
                ]}>
                    <Ionicons name="create-outline" size={20} color={noteError ? colors.error : colors.textSecondary} style={{ marginRight: 10 }} />
                    <TextInput
                        style={[styles.textInput, { color: colors.text }]}
                        placeholder={t('note_placeholder')}
                        placeholderTextColor={noteError ? colors.error : colors.textSecondary}
                        value={note}
                        onChangeText={(text) => {
                            setNote(text);
                            if (text.trim()) setNoteError(null);
                        }}
                        returnKeyType="done"
                        maxLength={200}
                    />
                </View>
                {noteError && (
                    <Text style={[styles.errorText, { color: colors.error }]}>{noteError}</Text>
                )}

                {/* Categories */}
                <View style={styles.categorySection}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('category')}</Text>
                    {categories.length === 0 ? (
                        <Text style={{ color: colors.textSecondary }}>{t('no_categories')}</Text>
                    ) : (
                        <View style={styles.categoryGrid}>
                            {categories.map((cat) => {
                                const isSelected = selectedCategory === cat.name;
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={styles.categoryItem}
                                        onPress={() => {
                                            setSelectedCategory(cat.name);
                                            Keyboard.dismiss();
                                        }}
                                    >
                                        <View style={[
                                            styles.iconCircle,
                                            { backgroundColor: cat.color || colors.tint, opacity: selectedCategory && !isSelected ? 0.45 : 1 },
                                            isSelected && { borderWidth: 3, borderColor: colors.text },
                                        ]}>
                                            <Ionicons name={(cat.icon as any) || 'ellipse'} size={24} color="#FFF" />
                                        </View>
                                        <Text
                                            numberOfLines={1}
                                            style={[styles.categoryText, { color: colors.text, fontWeight: isSelected ? '700' : '400' }]}
                                        >
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.primary, opacity: canSave ? 1 : 0.5 }]}
                        onPress={handleSave}
                        disabled={!canSave}
                    >
                        <Text style={styles.saveButtonText}>{t('save')}</Text>
                    </TouchableOpacity>
                    {isEditing && (
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={18} color={colors.error} style={{ marginRight: 6 }} />
                            <Text style={{ color: colors.error, fontWeight: '600', fontSize: 16 }}>{t('delete')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        width: '100%',
        maxWidth: 640,
        alignSelf: 'center',
    },
    headerControl: {
        marginBottom: 30,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '700',
        flexShrink: 1,
    },
    typeSwitcherContainer: {
        flexDirection: 'row',
        width: '100%',
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
    },
    typeBtnText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    currencyBadge: {
        marginRight: 10,
        borderRadius: 8,
        padding: 6,
        alignItems: 'center',
    },
    amountInput: {
        fontSize: 56,
        fontWeight: 'bold',
        fontFamily: 'SpaceMono',
        minWidth: 50,
        maxWidth: '75%',
        textAlign: 'center',
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 30,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    errorText: {
        marginLeft: 16,
        marginTop: -20,
        marginBottom: 20,
        fontSize: 12,
    },
    categorySection: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 16,
        letterSpacing: 1,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    categoryItem: {
        alignItems: 'center',
        padding: 6,
        width: '25%',
        marginBottom: 8,
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    categoryText: {
        fontSize: 11,
        textAlign: 'center',
    },
    footer: {
        flex: 1,
        justifyContent: 'flex-end',
        marginBottom: 20,
    },
    saveButton: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    deleteButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 8,
    },
    currencySelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: -16,
        marginBottom: 24,
    },
    currencyOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    currencyOptionText: {
        fontWeight: '600',
    },
});
