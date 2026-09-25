import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import CategoryIcon from '@/components/ui/CategoryIcon';
import DateField from '@/components/ui/DateField';
import EmptyState from '@/components/ui/EmptyState';
import IconButton from '@/components/ui/IconButton';
import Screen from '@/components/ui/Screen';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Sheet from '@/components/ui/Sheet';
import Skeleton from '@/components/ui/Skeleton';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import { layout, radius, space, useTheme } from '@/constants/theme';
import { useLocalization } from '@/context/LocalizationContext';
import { createRecurring, deleteRecurring, fetchCategories, fetchRecurring, processRecurring, type TxType } from '@/lib/api';
import { invalidateTransactions, keys, queryClient } from '@/lib/queryClient';
import { confirmAction, showMessage, showSuccess } from '@/utils/dialogs';
import { errorKey } from '@/utils/errors';
import { parseAmount } from '@/utils/money';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, CalendarClock, Check, Coins, Plus, Repeat, StickyNote, Trash2 } from '@/components/ui/icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Frequency = 'weekly' | 'monthly';

export default function ManageRecurring() {
    const { t, currencies, currencyCode, dateLocale, formatMoney } = useLocalization();
    const { colors } = useTheme();

    const { data: items = [], isPending } = useQuery({ queryKey: keys.recurring, queryFn: fetchRecurring });
    const { data: categories = [] } = useQuery({ queryKey: keys.categories, queryFn: fetchCategories });
    const categoryByName = new Map(categories.map(c => [c.name, c]));

    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [amountError, setAmountError] = useState<string | null>(null);
    const [note, setNote] = useState('');
    const [noteError, setNoteError] = useState<string | null>(null);
    const [type, setType] = useState<TxType>('expense');
    const [frequency, setFrequency] = useState<Frequency>('monthly');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [categoryError, setCategoryError] = useState(false);
    const [txCurrency, setTxCurrency] = useState(currencyCode);
    const [startDate, setStartDate] = useState(new Date());
    const [saving, setSaving] = useState(false);

    const refresh = () => queryClient.invalidateQueries({ queryKey: keys.recurring });

    const openSheet = () => {
        setAmount('');
        setAmountError(null);
        setNote('');
        setNoteError(null);
        setSelectedCategory(null);
        setCategoryError(false);
        setTxCurrency(currencyCode);
        setStartDate(new Date());
        setOpen(true);
    };

    const handleAdd = async () => {
        const parsedAmount = parseAmount(amount);
        const amountBad = isNaN(parsedAmount) || parsedAmount <= 0;
        setAmountError(amountBad ? t('invalid_amount') : null);
        setCategoryError(!selectedCategory);
        setNoteError(note.trim() ? null : t('note_required'));
        if (amountBad || !selectedCategory || !note.trim()) return;

        setSaving(true);
        try {
            await createRecurring({
                amount: Math.round(parsedAmount * 100) / 100,
                type,
                category: selectedCategory,
                frequency,
                start_date: startDate,
                note: note.trim(),
                currency: txCurrency,
            });
            // Books the first occurrence right away when it is due today or in the past.
            await processRecurring();
            await invalidateTransactions();
            await refresh();
            setOpen(false);
            showSuccess(t('recurring_added'));
        } catch (e) {
            showMessage(t('error'), t(errorKey(e)));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        confirmAction(t('delete_recurring_title'), t('delete_recurring_message'), t('delete'), t('cancel'), async () => {
            try {
                await deleteRecurring(id);
                await refresh();
            } catch (e) {
                showMessage(t('error'), t(errorKey(e)));
            }
        });
    };

    return (
        <Screen
            title={t('recurring')}
            subtitle={t('recurring_subtitle')}
            backTo="/(tabs)/profile"
            width={layout.formWidth + 80}
            actions={<Button label={t('new')} icon={Plus} size="sm" onPress={openSheet} />}
        >
            {isPending ? (
                <Skeleton height={200} rounded={radius.lg} />
            ) : items.length === 0 ? (
                <Card>
                    <EmptyState icon={Repeat} title={t('no_recurring')} description={t('recurring_empty_description')} actionLabel={t('new_recurring')} actionIcon={Plus} onAction={openSheet} />
                </Card>
            ) : (
                <Card padded={false}>
                    {items.map((item, i) => {
                        const category = categoryByName.get(item.category);
                        const isIncome = item.type === 'income';
                        return (
                            <View key={item.id} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                                <CategoryIcon icon={category?.icon} color={category?.color} />
                                <View style={{ flex: 1, gap: 2 }}>
                                    <Text variant="bodyStrong" numberOfLines={1}>{item.note || item.category}</Text>
                                    <Text variant="caption" tone="muted" numberOfLines={1}>{item.category} · {t(item.frequency)}</Text>
                                    <View style={styles.due}>
                                        <CalendarClock size={12} color={colors.textMuted} />
                                        <Text variant="caption" tone="muted" numberOfLines={1}>
                                            {t('next_due', { date: format(parseISO(item.next_due_date), 'd MMM yyyy', { locale: dateLocale }) })}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.side}>
                                    <Text variant="bodyStrong" tabular tone={isIncome ? 'income' : 'default'}>
                                        {isIncome ? '+' : '−'}{formatMoney(item.amount, item.currency)}
                                    </Text>
                                    <IconButton icon={Trash2} label={`${t('delete')} ${item.note}`} tone="danger" onPress={() => handleDelete(item.id)} size={32} />
                                </View>
                            </View>
                        );
                    })}
                </Card>
            )}

            <Sheet
                visible={open}
                onClose={() => setOpen(false)}
                title={t('new_recurring')}
                footer={
                    <>
                        <Button label={t('cancel')} variant="secondary" onPress={() => setOpen(false)} style={{ flex: 1 }} />
                        <Button label={t('save')} icon={Check} onPress={handleAdd} loading={saving} style={{ flex: 1 }} />
                    </>
                }
            >
                <SegmentedControl<TxType>
                    value={type}
                    onChange={(v) => { setType(v); setSelectedCategory(null); }}
                    options={[
                        { value: 'expense', label: t('expense'), icon: ArrowUpRight, tone: 'expense' },
                        { value: 'income', label: t('income'), icon: ArrowDownLeft, tone: 'income' },
                    ]}
                />

                <View style={{ gap: space.sm }}>
                    <TextField
                        label={t('amount')}
                        icon={Coins}
                        placeholder="0,00"
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        value={amount}
                        error={amountError}
                        onChangeText={(text) => { setAmount(text.replace(/[^0-9.,]/g, '')); setAmountError(null); }}
                    />
                    <View style={styles.chips} accessibilityRole="radiogroup">
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
                </View>

                <View style={{ gap: 6 }}>
                    <Text variant="label" tone="secondary">{t('frequency')}</Text>
                    <SegmentedControl<Frequency>
                        value={frequency}
                        onChange={setFrequency}
                        options={[
                            { value: 'monthly', label: t('monthly') },
                            { value: 'weekly', label: t('weekly') },
                        ]}
                    />
                </View>

                <DateField label={t('first_date')} value={startDate} onChange={setStartDate} />

                <View style={{ gap: 6 }}>
                    <Text variant="label" tone={categoryError ? 'expense' : 'secondary'}>{t('category')}</Text>
                    <View style={styles.chips} accessibilityRole="radiogroup">
                        {categories.filter(c => c.type === type).map(cat => {
                            const active = selectedCategory === cat.name;
                            return (
                                <Pressable
                                    key={cat.id}
                                    onPress={() => { setSelectedCategory(cat.name); setCategoryError(false); }}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: active }}
                                    style={[styles.categoryChip, { borderColor: active ? colors.primary : categoryError ? colors.expense : colors.border, backgroundColor: active ? colors.primarySoft : colors.surface }]}
                                >
                                    <CategoryIcon icon={cat.icon} color={cat.color} size={24} />
                                    <Text variant="label" tone={active ? 'primary' : 'default'}>{cat.name}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                    {categoryError && <Text variant="caption" tone="expense">{t('select_category_error')}</Text>}
                </View>

                <TextField
                    label={t('note')}
                    icon={StickyNote}
                    placeholder={t('recurring_note_placeholder')}
                    value={note}
                    error={noteError}
                    maxLength={200}
                    onChangeText={(text) => { setNote(text); if (text.trim()) setNoteError(null); }}
                />
            </Sheet>
        </Screen>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: space.lg, paddingRight: space.md, paddingVertical: space.md },
    due: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    side: { alignItems: 'flex-end', gap: 2 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    chip: { paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
    categoryChip: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingLeft: 6, paddingRight: space.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
});
