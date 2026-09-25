import { radius, space, useTheme } from '@/constants/theme';
import { useLocalization } from '@/context/LocalizationContext';
import type { Transaction } from '@/lib/api';
import { ArrowDownLeft, ArrowUpRight, type LucideIcon } from '@/components/ui/icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Skeleton from './Skeleton';
import Text from './Text';

type Totals = { income: number; expense: number };

type Props = { transactions: Transaction[]; loading?: boolean };

/** Month summary in the default currency; other currencies are listed separately, never converted. */
export default function BalanceCard({ transactions, loading }: Props) {
    const { colors } = useTheme();
    const { t, currencyCode, formatMoney } = useLocalization();

    const totals = useMemo(() => {
        const result: Record<string, Totals> = {};
        for (const tx of transactions) {
            result[tx.currency] ??= { income: 0, expense: 0 };
            result[tx.currency][tx.type] += tx.amount;
        }
        return result;
    }, [transactions]);

    const { income, expense } = totals[currencyCode] ?? { income: 0, expense: 0 };
    const balance = income - expense;
    const otherCurrencies = Object.entries(totals).filter(([code]) => code !== currencyCode);

    return (
        <View style={[styles.card, { backgroundColor: colors.primary }]}>
            <Text variant="label" style={styles.muted}>{t('total_balance')}</Text>
            {loading ? (
                <Skeleton width={180} height={40} style={styles.skeleton} />
            ) : (
                <Text variant="display" tabular style={styles.white} numberOfLines={1} adjustsFontSizeToFit accessibilityLabel={`${t('total_balance')}: ${formatMoney(balance)}`}>
                    {formatMoney(balance)}
                </Text>
            )}
            {otherCurrencies.length > 0 && (
                <Text variant="caption" style={styles.muted}>
                    {t('other_currencies')}: {otherCurrencies.map(([code, v]) => formatMoney(v.income - v.expense, code)).join(' · ')}
                </Text>
            )}

            <View style={styles.stats}>
                <Stat icon={ArrowDownLeft} label={t('income')} value={formatMoney(income)} />
                <View style={styles.separator} />
                <Stat icon={ArrowUpRight} label={t('expense')} value={formatMoney(expense)} />
            </View>
        </View>
    );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
    return (
        <View style={styles.stat}>
            <View style={styles.statIcon}>
                <Icon size={16} color="#FFFFFF" strokeWidth={2.4} />
            </View>
            <View style={{ flexShrink: 1 }}>
                <Text variant="caption" style={styles.muted}>{label}</Text>
                <Text variant="bodyStrong" tabular style={styles.white} numberOfLines={1}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { borderRadius: radius.xl, padding: space.xl, gap: space.xs },
    white: { color: '#FFFFFF' },
    muted: { color: 'rgba(255,255,255,0.9)' },
    skeleton: { opacity: 0.3, marginVertical: 2 },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: space.lg,
        padding: space.md,
        borderRadius: radius.lg,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
    statIcon: { width: 32, height: 32, borderRadius: radius.sm + 2, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
    separator: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: space.md },
});
