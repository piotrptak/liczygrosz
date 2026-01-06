import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function AddTransactionForm() {
    const db = useSQLiteContext();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t, currency, countryFlag, currencies, locale, currencyCode, getCurrencyFlag } = useLocalization();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const isEditing = !!params.id;
    const amountInputRef = useRef<TextInput>(null);

    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ amount?: string; category?: string; note?: string }>({});

    // Default currency to context default code
    const [txCurrency, setTxCurrency] = useState(currencyCode);
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);

    // Date State
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Replace useEffect for loading categories with useFocusEffect
    useFocusEffect(
        useCallback(() => {
            loadCategories();
        }, [type]) // Reload when type changes or screen focuses
    );

    useEffect(() => {
        if (isEditing) {
            setAmount(params.amount?.toString() || '');
            setNote(params.note?.toString() || '');
            setType(params.type as 'income' | 'expense' || 'expense');
            setSelectedCategory(params.category?.toString() || null);
            if (params.currency) setTxCurrency(params.currency.toString());
            if (params.date) {
                setDate(new Date(parseInt(params.date.toString())));
            }
        } else {
            // New Transaction: Sync with Profile Currency if user hasn't started editing
            // Or just always reset to default when opening fresh?
            // Params.id dependency handles fresh opens if unique key / unmount. 
            // But if screen stays mounted and focus returns, we might want this.
            // For now: Just ensure initial load on mount respects it, 
            // AND watch currencyCode changes while on screen (if global context updates)
            if (!amount) { // Only override if form is somewhat fresh?
                setTxCurrency(currencyCode);
            }

            // Auto-focus amount on new transaction
            setTimeout(() => {
                amountInputRef.current?.focus();
            }, 100);
        }
    }, [params.id, currencyCode]); // Added currencyCode dependency

    // ...

    const loadCategories = async () => {
        const result = await db.getAllAsync('SELECT * FROM categories WHERE type = ?', [type]);
        setCategories(result);
    };

    const handleSave = async () => {
        const parsedAmount = parseFloat(amount.replace(',', '.')); // Handle commas if user types them

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        if (!selectedCategory) {
            Alert.alert('Error', 'Please select a category');
            return;
        }

        if (!selectedCategory) {
            Alert.alert('Error', 'Please select a category');
            return;
        }

        if (!note.trim()) {
            setErrors({ note: t('note_required') || 'Note is mandatory' });
            return;
        }
        setErrors({}); // Clear errors

        try {
            if (isEditing) {
                await db.runAsync(
                    'UPDATE transactions SET amount = ?, type = ?, category = ?, note = ?, date = ?, currency = ? WHERE id = ?',
                    [parsedAmount, type, selectedCategory, note, date.getTime(), txCurrency, Number(params.id)]
                );
            } else {
                await db.runAsync(
                    'INSERT INTO transactions (amount, type, category, date, note, currency) VALUES (?, ?, ?, ?, ?, ?)',
                    [parsedAmount, type, selectedCategory, date.getTime(), note, txCurrency]
                );
            }
            router.replace('/(tabs)');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save transaction');
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

    const renderIcon = (iconName: any, isSelected: boolean) => {
        return <Ionicons name={iconName || 'ellipse'} size={24} color={isSelected ? '#FFF' : colors.text} />;
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>

                    {/* Top Row: Type Switcher & Date */}
                    {/* Top Row: Date & Type Switcher */
                        /* Date moved to own row or top right? Actually, let's keep it clean. */
                    }
                    <View style={styles.headerControl}>
                        {/* Date Badge - moved to top right absolute or just above */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
                                {isEditing ? t('edit_transaction') : t('new_transaction')}
                            </Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBadge}>
                                <Ionicons name="calendar" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                                <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>
                                    {date.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.typeSwitcherContainer}>
                            <TouchableOpacity
                                onPress={() => setType('expense')}
                                style={[
                                    styles.typeButton,
                                    type === 'expense' ? { backgroundColor: colors.error, borderWidth: 0 } : { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }
                                ]}
                            >
                                <Ionicons name="arrow-down-circle" size={24} color={type === 'expense' ? '#FFF' : colors.textSecondary} />
                                <Text style={[styles.typeBtnText, { color: type === 'expense' ? '#FFF' : colors.textSecondary }]}>{t('expense')}</Text>
                            </TouchableOpacity>

                            <View style={{ width: 16 }} />

                            <TouchableOpacity
                                onPress={() => setType('income')}
                                style={[
                                    styles.typeButton,
                                    type === 'income' ? { backgroundColor: colors.success, borderWidth: 0 } : { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }
                                ]}
                            >
                                <Ionicons name="arrow-up-circle" size={24} color={type === 'income' ? '#FFF' : colors.textSecondary} />
                                <Text style={[styles.typeBtnText, { color: type === 'income' ? '#FFF' : colors.textSecondary }]}>{t('income')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={date}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                        />
                    )}

                    {/* Amount Input */}
                    <View style={styles.amountContainer}>
                        <TouchableOpacity style={styles.currencyBadge} onPress={() => setShowCurrencyModal(true)}>
                            <Text style={{ fontSize: 24, marginRight: 4 }}>{getCurrencyFlag(txCurrency)}</Text>
                            <Text style={{ fontSize: 12, fontWeight: '700' }}>{txCurrency}</Text>
                        </TouchableOpacity>
                        {/* No longer showing currency symbol separately, using badge to show current selection code */}

                        <TextInput
                            ref={amountInputRef}
                            style={[styles.amountInput, { color: colors.text }]}
                            placeholder="0"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="decimal-pad"
                            returnKeyType="done"
                            value={amount}
                            onChangeText={setAmount}
                            maxLength={10}
                        />
                    </View>

                    {/* Currency Modal (Simple Implementation inside component for speed) */}
                    {showCurrencyModal && (
                        <View style={styles.currencySelector}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {currencies.map(c => (
                                    <TouchableOpacity
                                        key={c.code}
                                        style={[styles.currencyOption, txCurrency === c.code && { backgroundColor: colors.tint }]}
                                        onPress={() => {
                                            setTxCurrency(c.code);
                                            setShowCurrencyModal(false);
                                        }}
                                    >
                                        <Text style={[styles.currencyOptionText, txCurrency === c.code && { color: '#FFF' }]}>{c.code} ({c.symbol})</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Note Input */}
                    <View style={[
                        styles.inputGroup,
                        { backgroundColor: colors.surface },
                        errors.note ? { backgroundColor: colors.error + '10', borderWidth: 1, borderColor: colors.error } : {}
                    ]}>
                        <Ionicons name="create-outline" size={20} color={errors.note ? colors.error : colors.textSecondary} style={{ marginRight: 10 }} />
                        <TextInput
                            style={[styles.textInput, { color: colors.text }]}
                            placeholder={t('note') + " (Required)" || "Add a note... (Required)"}
                            placeholderTextColor={errors.note ? colors.error : colors.textSecondary}
                            value={note}
                            onChangeText={(text) => {
                                setNote(text);
                                if (text.trim()) setErrors({});
                            }}
                            returnKeyType="done"
                        />
                    </View>
                    {errors.note && (
                        <Text style={{ color: colors.error, marginLeft: 16, marginTop: -20, marginBottom: 20, fontSize: 12 }}>
                            {errors.note}
                        </Text>
                    )}

                    {/* Categories */}
                    <View style={styles.categorySection}>
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('category') || 'Category'}</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 4 }}
                            style={styles.categoryScroll}
                        >
                            {/* Chunk categories into groups of 2 */
                                Array.from({ length: Math.ceil(categories.length / 2) }).map((_, i) => {
                                    const chunk = categories.slice(i * 2, i * 2 + 2);
                                    return (
                                        <View key={i} style={{ marginRight: 16 }}>
                                            {chunk.map((cat) => {
                                                const isSelected = selectedCategory === cat.name;
                                                const iconBg = cat.color;

                                                return (
                                                    <TouchableOpacity
                                                        key={cat.id}
                                                        style={[
                                                            styles.categoryItem,
                                                            isSelected && { transform: [{ scale: 1.05 }] },
                                                            { marginBottom: 12 } // Add spacing between rows
                                                        ]}
                                                        onPress={() => {
                                                            setSelectedCategory(cat.name);
                                                            Keyboard.dismiss();
                                                        }}
                                                    >
                                                        <View style={[
                                                            styles.iconCircle,
                                                            {
                                                                backgroundColor: iconBg,
                                                                shadowColor: cat.color,
                                                                shadowOpacity: isSelected ? 0.4 : 0.1,
                                                                shadowRadius: isSelected ? 8 : 4
                                                            }
                                                        ]}>
                                                            {renderIcon(cat.icon, true)}
                                                        </View>
                                                        <Text
                                                            numberOfLines={1}
                                                            style={[
                                                                styles.categoryText,
                                                                {
                                                                    color: colors.text,
                                                                    fontWeight: isSelected ? '700' : '400'
                                                                }
                                                            ]}
                                                        >
                                                            {cat.name}
                                                        </Text>
                                                        {isSelected && (
                                                            <View style={{ height: 4, width: 4, borderRadius: 2, backgroundColor: cat.color, marginTop: 4 }} />
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    );
                                })}
                        </ScrollView>
                    </View>

                    {/* Save Button */}
                    <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: 20 }}>
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.primary, opacity: (!amount || !selectedCategory) ? 0.5 : 1 }]}
                            onPress={handleSave}
                            disabled={!amount || !selectedCategory}
                        >
                            <Text style={styles.saveButtonText}>{t('save') || 'Save Transaction'}</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
    },
    headerControl: {
        marginBottom: 30,
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
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    currencyBadge: {
        marginRight: 10,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
        padding: 4,
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '500',
        fontFamily: 'SpaceMono',
        marginRight: 5,
        marginTop: 10,
    },
    amountInput: {
        fontSize: 64,
        fontWeight: 'bold',
        fontFamily: 'SpaceMono',
        minWidth: 50,
        textAlign: 'center',
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 30,
        // Soft Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
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
    categoryScroll: {
        flexGrow: 0,
    },
    categoryItem: {
        alignItems: 'center',
        // marginRight: 16, // Moved to container
        padding: 8,
        borderRadius: 16,
        width: 76,
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryText: {
        fontSize: 11,
        textAlign: 'center',
    },
    saveButton: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    currencySelector: {
        marginBottom: 20,
        alignItems: 'center',
    },
    currencyOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginHorizontal: 4,
    },
    currencyOptionText: {
        fontWeight: '600',
    }
});
