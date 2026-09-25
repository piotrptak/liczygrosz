import Card from '@/components/ui/Card';
import CategoryIcon from '@/components/ui/CategoryIcon';
import EmptyState from '@/components/ui/EmptyState';
import Screen from '@/components/ui/Screen';
import Skeleton from '@/components/ui/Skeleton';
import Text from '@/components/ui/Text';
import { layout, radius, space, useTheme } from '@/constants/theme';
import { useLocalization } from '@/context/LocalizationContext';
import { fetchCategories, fetchTransactions } from '@/lib/api';
import { keys } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { addMonths, differenceInCalendarMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, ChartColumn, Scale, type LucideIcon } from '@/components/ui/icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

const MONTHS = 6;
const CHART_HEIGHT = 160;

export default function StatsScreen() {
    const { colors } = useTheme();
    const { t, currencyCode, dateLocale, formatMoney } = useLocalization();
    const { width } = useWindowDimensions();
    const desktop = width >= layout.desktop;

    const now = new Date();
    const firstMonth = startOfMonth(subMonths(now, MONTHS - 1));
    const lastDay = endOfMonth(now);
    const { data: transactions = [], isPending } = useQuery({
        queryKey: keys.transactionsRange(firstMonth, lastDay),
        queryFn: () => fetchTransactions(firstMonth, lastDay),
    });
    const { data: categories = [] } = useQuery({ queryKey: keys.categories, queryFn: fetchCategories });

    // Index of the month the KPIs and breakdown describe; the latest month by default.
    const [selected, setSelected] = useState(MONTHS - 1);

    // Only the default currency is considered; amounts in other currencies are not convertible here.
    const months = useMemo(() => {
        const data = Array.from({ length: MONTHS }, (_, i) => ({
            date: addMonths(firstMonth, i),
            income: 0,
            expense: 0,
            byCategory: new Map<string, number>(),
        }));
        for (const tx of transactions) {
            if (tx.currency !== currencyCode) continue;
            const month = data[differenceInCalendarMonths(new Date(tx.date), firstMonth)];
            if (!month) continue;
            month[tx.type] += tx.amount;
            if (tx.type === 'expense') month.byCategory.set(tx.category, (month.byCategory.get(tx.category) ?? 0) + tx.amount);
        }
        return data;
    }, [transactions, currencyCode, firstMonth.getTime()]);

    const month = months[selected];
    const net = month.income - month.expense;
    const maxExpense = Math.max(...months.map(m => m.expense), 1);
    const breakdown = [...month.byCategory.entries()].sort((a, b) => b[1] - a[1]);
    const categoryByName = new Map(categories.map(c => [c.name, c]));
    const monthName = format(month.date, 'LLLL yyyy', { locale: dateLocale });

    const kpis = (
        <View style={[styles.kpis, desktop && { flexWrap: 'nowrap' }]}>
            <Kpi icon={ArrowDownLeft} label={t('income')} value={formatMoney(month.income)} tone="income" loading={isPending} />
            <Kpi icon={ArrowUpRight} label={t('expense')} value={formatMoney(month.expense)} tone="expense" loading={isPending} />
            <Kpi icon={Scale} label={t('net_result')} value={formatMoney(net)} tone={net >= 0 ? 'income' : 'expense'} loading={isPending} />
        </View>
    );

    const chart = (
        <Card style={{ gap: space.lg, flex: desktop ? 1 : undefined }}>
            <View style={styles.chartHeader}>
                <View style={{ flex: 1 }}>
                    <Text variant="heading">{t('expense_trend')}</Text>
                    <Text variant="caption" tone="muted">{t('chart_hint')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="caption" tone="muted" style={{ textTransform: 'capitalize' }}>{format(month.date, 'LLLL', { locale: dateLocale })}</Text>
                    <Text variant="heading" tabular>{formatMoney(month.expense)}</Text>
                </View>
            </View>
            {isPending ? (
                <Skeleton height={CHART_HEIGHT + 24} />
            ) : (
                <View style={styles.chart} accessibilityLabel={t('expense_trend')}>
                    {[0.5, 1].map(f => (
                        <View key={f} style={[styles.gridLine, { bottom: 24 + CHART_HEIGHT * f, backgroundColor: colors.chartGrid }]} />
                    ))}
                    {months.map((m, i) => {
                        const active = i === selected;
                        const h = m.expense > 0 ? Math.max(4, (m.expense / maxExpense) * CHART_HEIGHT) : 2;
                        return (
                            <Pressable
                                key={i}
                                onPress={() => setSelected(i)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: active }}
                                accessibilityLabel={`${format(m.date, 'LLLL', { locale: dateLocale })}: ${formatMoney(m.expense)}`}
                                style={styles.barSlot}
                            >
                                <View style={[styles.bar, { height: h, backgroundColor: active ? colors.chartBarActive : colors.chartBar }]} />
                                <Text variant="caption" tone={active ? 'default' : 'muted'} style={styles.barLabel}>
                                    {format(m.date, 'LLL', { locale: dateLocale })}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            )}
        </Card>
    );

    const categoriesCard = (
        <Card padded={false} style={{ flex: desktop ? 1 : undefined }}>
            <View style={styles.cardHeader}>
                <Text variant="heading">{t('by_category')}</Text>
                <Text variant="caption" tone="muted" style={{ textTransform: 'capitalize' }}>{monthName}</Text>
            </View>
            {breakdown.length === 0 ? (
                <EmptyState icon={ChartColumn} title={t('no_expenses_month')} />
            ) : (
                breakdown.map(([name, value], i) => {
                    const category = categoryByName.get(name);
                    const share = value / month.expense;
                    return (
                        <View key={name} style={[styles.catRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                            <CategoryIcon icon={category?.icon} color={category?.color} size={36} />
                            <View style={{ flex: 1, gap: 6 }}>
                                <View style={styles.catTop}>
                                    <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>{name}</Text>
                                    <Text variant="bodyStrong" tabular>{formatMoney(value)}</Text>
                                </View>
                                <View style={styles.catBottom}>
                                    <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
                                        <View style={[styles.fill, { width: `${Math.max(share * 100, 2)}%`, backgroundColor: colors.chartBarActive }]} />
                                    </View>
                                    <Text variant="caption" tone="muted" tabular style={styles.share}>{Math.round(share * 100)}%</Text>
                                </View>
                            </View>
                        </View>
                    );
                })
            )}
        </Card>
    );

    return (
        <Screen title={t('stats_title')} subtitle={t('amounts_in', { currency: currencyCode })}>
            <Text variant="overline" tone="muted" style={{ textTransform: 'uppercase' }}>{monthName}</Text>
            {kpis}
            {desktop ? (
                <View style={styles.row}>{chart}{categoriesCard}</View>
            ) : (
                <>{chart}{categoriesCard}</>
            )}
        </Screen>
    );
}

function Kpi({ icon: Icon, label, value, tone, loading }: { icon: LucideIcon; label: string; value: string; tone: 'income' | 'expense'; loading: boolean }) {
    const { colors } = useTheme();
    return (
        <Card style={styles.kpi}>
            <View style={[styles.kpiIcon, { backgroundColor: tone === 'income' ? colors.incomeSoft : colors.expenseSoft }]}>
                <Icon size={18} color={tone === 'income' ? colors.income : colors.expense} strokeWidth={2.2} />
            </View>
            <Text variant="label" tone="muted">{label}</Text>
            {loading ? <Skeleton width={100} height={24} /> : <Text variant="heading" tabular numberOfLines={1} adjustsFontSizeToFit>{value}</Text>}
        </Card>
    );
}

const styles = StyleSheet.create({
    kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
    kpi: { flexGrow: 1, flexBasis: 160, gap: space.xs },
    kpiIcon: { width: 36, height: 36, borderRadius: radius.sm + 2, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs },
    row: { flexDirection: 'row', gap: space.lg, alignItems: 'flex-start' },
    chartHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
    chart: { flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT + 24, gap: space.sm },
    gridLine: { position: 'absolute', left: 0, right: 0, height: 1 },
    barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
    bar: { width: '64%', maxWidth: 40, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    barLabel: { marginTop: 6, height: 18, textTransform: 'capitalize' },
    cardHeader: { padding: space.lg, paddingBottom: space.sm, gap: 2 },
    catRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
    catTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    catBottom: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 3 },
    share: { width: 36, textAlign: 'right' },
});
