import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import CategoryIcon from '@/components/ui/CategoryIcon';
import DateField from '@/components/ui/DateField';
import Screen from '@/components/ui/Screen';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import { fonts, layout, radius, space, useTheme } from '@/constants/theme';
import { useLocalization } from '@/context/LocalizationContext';
import { createTransaction, deleteTransaction, fetchCategories, fetchTransaction, updateTransaction } from '@/lib/api';
import { invalidateTransactions, keys } from '@/lib/queryClient';
import { confirmAction, showMessage, showSuccess } from '@/utils/dialogs';
import { errorKey } from '@/utils/errors';
import { formatAmountInput, parseAmount } from '@/utils/money';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, Check, Settings2, StickyNote, Trash2 } from '@/components/ui/icons';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

export default function AddTransactionForm({ transactionId }: { transactionId?: string }) {
    const router = useRouter();
    const { t, locale, currencies, currencyCode, getCurrencySymbol } = useLocalization();
    const { colors } = useTheme();

    const isEditing = transactionId !== undefined;
    const amountInputRef = useRef<TextInput>(null);

    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [noteError, setNoteError] = useState<string | null>(null);
    const [txCurrency, setTxCurrency] = useState(currencyCode);
    const [date, setDate] = useState(new Date());
    const [saving, setSaving] = useState(false);

    const { data: allCategories = [] } = useQuery({ queryKey: keys.categories, queryFn: fetchCategories });
    const categories = allCategories.filter(c => c.type === type);

    const { data: existing, isFetched } = useQuery({
        queryKey: keys.transaction(transactionId ?? ''),
        queryFn: () => fetchTransaction(transactionId!),
        enabled: isEditing,
    });

    useEffect(() => {
        if (!isEditing || !isFetched) return;
        if (!existing) {
            showMessage(t('error'), t('transaction_not_found'));
            router.back();
            return;
        }
        setAmount(formatAmountInput(existing.amount, locale));
        setNote(existing.note);
        setType(existing.type);
        setSelectedCategory(existing.category);
        setTxCurrency(existing.currency);
        setDate(new Date(existing.date));
    }, [existing, isFetched]);

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

        const input = {
            amount: Math.round(parsedAmount * 100) / 100,
            type,
            category: selectedCategory,
            date: date.getTime(),
            note: note.trim(),
            currency: txCurrency,
        };

        setSaving(true);
        try {
            if (isEditing) {
                await updateTransaction(transactionId!, input);
                await invalidateTransactions();
                router.back();
            } else {
                await createTransaction(input);
                await invalidateTransactions();
                resetForm();
                showSuccess(t('transaction_saved'));
                router.navigate('/(tabs)');
            }
        } catch (error) {
            console.error(error);
            showMessage(t('error'), t(errorKey(error)));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        confirmAction(t('delete_transaction_title'), t('delete_transaction_message'), t('delete'), t('cancel'), async () => {
            try {
                await deleteTransaction(transactionId!);
                await invalidateTransactions();
                showSuccess(t('transaction_deleted'));
                router.back();
            } catch (error) {
                showMessage(t('error'), t(errorKey(error)));
            }
        });
    };

    const canSave = !!amount && !!selectedCategory && !saving;

    return (
        <Screen
            title={isEditing ? t('edit_transaction') : t('new_transaction')}
            backTo={isEditing ? '/(tabs)' : undefined}
            width={layout.formWidth + 80}
            footer={
                <>
                    {isEditing && <Button label={t('delete')} icon={Trash2} variant="dangerSoft" size="lg" onPress={handleDelete} />}
                    <Button label={t('save')} icon={Check} size="lg" onPress={handleSave} disabled={!canSave} loading={saving} style={{ flex: 1 }} />
                </>
            }
        >
            <SegmentedControl<'expense' | 'income'>
                value={type}
                onChange={handleTypeChange}
                accessibilityLabel={t('type')}
                options={[
                    { value: 'expense', label: t('expense'), icon: ArrowUpRight, tone: 'expense' },
                    { value: 'income', label: t('income'), icon: ArrowDownLeft, tone: 'income' },
                ]}
            />

            {/* Amount */}
            <Card style={styles.amountCard}>
                <Text variant="overline" tone="muted">{t('amount')}</Text>
                <View style={styles.amountRow}>
                    <TextInput
                        ref={amountInputRef}
                        autoFocus={!isEditing && Platform.OS !== 'web'}
                        accessibilityLabel={t('amount')}
                        style={[
                            styles.amountInput,
                            { color: type === 'income' ? colors.income : colors.text },
                            Platform.OS === 'web' && ({ outlineStyle: 'none' } as object),
                        ]}
                        placeholder="0,00"
                        placeholderTextColor={colors.borderStrong}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        returnKeyType="done"
                        value={amount}
                        onChangeText={(text) => setAmount(text.replace(/[^0-9.,]/g, ''))}
                        maxLength={10}
                    />
                    <Text variant="title" tone="muted">{getCurrencySymbol(txCurrency)}</Text>
                </View>
                <View style={styles.currencyRow} accessibilityRole="radiogroup" accessibilityLabel={t('currency')}>
                    {currencies.map(c => {
                        const active = txCurrency === c.code;
                        return (
                            <Pressable
                                key={c.code}
                                onPress={() => setTxCurrency(c.code)}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: active }}
                                style={[styles.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySoft : 'transparent' }]}
                            >
                                <Text variant="label" tone={active ? 'primary' : 'secondary'}>{c.flag} {c.code}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </Card>

            {/* Categories */}
            <View style={{ gap: space.sm }}>
                <View style={styles.sectionTitle}>
                    <Text variant="heading" style={{ flex: 1 }}>{t('category')}</Text>
                    <Button label={t('manage')} icon={Settings2} variant="ghost" size="sm" onPress={() => router.push('/categories/manage')} />
                </View>
                {categories.length === 0 ? (
                    <Card><Text tone="muted">{t('no_categories')}</Text></Card>
                ) : (
                    <View style={styles.categoryGrid} accessibilityRole="radiogroup" accessibilityLabel={t('category')}>
                        {categories.map((cat) => {
                            const selected = selectedCategory === cat.name;
                            return (
                                <Pressable
                                    key={cat.id}
                                    onPress={() => {
                                        setSelectedCategory(cat.name);
                                        Keyboard.dismiss();
                                    }}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: selected }}
                                    accessibilityLabel={cat.name}
                                    style={(state) => {
                                        const { hovered } = state as typeof state & { hovered?: boolean };
                                        return [
                                            styles.categoryTile,
                                            {
                                                backgroundColor: selected ? colors.primarySoft : hovered ? colors.surfaceHover : colors.surface,
                                                borderColor: selected ? colors.primary : colors.border,
                                            },
                                        ];
                                    }}
                                >
                                    <CategoryIcon icon={cat.icon} color={cat.color} size={36} />
                                    <Text variant="label" tone={selected ? 'primary' : 'default'} numberOfLines={1} style={{ flex: 1 }}>{cat.name}</Text>
                                    {selected && <Check size={16} color={colors.primaryText} strokeWidth={2.6} />}
                                </Pressable>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Details */}
            <View style={{ gap: space.md }}>
                <Text variant="heading">{t('details')}</Text>
                <TextField
                    label={t('note')}
                    icon={StickyNote}
                    placeholder={t('note_placeholder')}
                    value={note}
                    error={noteError}
                    onChangeText={(text) => {
                        setNote(text);
                        if (text.trim()) setNoteError(null);
                    }}
                    returnKeyType="done"
                    maxLength={200}
                />
                <DateField label={t('date')} value={date} onChange={setDate} />
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    amountCard: { gap: space.sm, paddingVertical: space.xl },
    amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
    amountInput: {
        flex: 1,
        minWidth: 0,
        fontSize: 44,
        lineHeight: 52,
        fontFamily: fonts.bold,
        letterSpacing: -1,
        padding: 0,
        fontVariant: ['tabular-nums'],
    },
    currencyRow: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
    chip: { paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
    sectionTitle: { flexDirection: 'row', alignItems: 'center' },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    categoryTile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        flexGrow: 1,
        flexBasis: 150,
        maxWidth: '100%',
        padding: space.sm,
        paddingRight: space.md,
        borderRadius: radius.md,
        borderWidth: 1,
    },
});
