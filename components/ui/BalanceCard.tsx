import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import { useMonthTransactions } from '@/lib/useMonthTransactions';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Totals = { income: number; expense: number };

interface BalanceCardProps {
    selectedDate: Date;
    onPressIncome?: () => void;
    onPressExpense?: () => void;
    activeFilter?: 'all' | 'income' | 'expense';
}

export default function BalanceCard({ selectedDate, onPressIncome, onPressExpense, activeFilter = 'all' }: BalanceCardProps) {
    const { t, currency, currencyCode, formatMoney } = useLocalization();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const { data: transactions = [] } = useMonthTransactions(selectedDate);

    // Totals per currency; amounts in different currencies are never added together.
    const totals = useMemo(() => {
        const result: Record<string, Totals> = {};
        for (const tx of transactions) {
            result[tx.currency] ??= { income: 0, expense: 0 };
            result[tx.currency][tx.type] += tx.amount;
        }
        return result;
    }, [transactions]);

    const { income, expense } = totals[currencyCode] ?? { income: 0, expense: 0 };
    const otherCurrencies = Object.entries(totals).filter(([code]) => code !== currencyCode);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('total_balance')}</Text>
                <View style={styles.balanceContainer}>
                    {currencyCode !== 'PLN' && <Text style={[styles.currency, { color: colors.text }]}>{currency}</Text>}
                    <Text style={[styles.balance, { color: colors.text }]} adjustsFontSizeToFit numberOfLines={1}>
                        {(income - expense).toFixed(2)}
                    </Text>
                    {currencyCode === 'PLN' && <Text style={[styles.currency, { color: colors.text, marginLeft: 6 }]}>{currency}</Text>}
                </View>
                {otherCurrencies.length > 0 && (
                    <Text style={[styles.other, { color: colors.textSecondary }]}>
                        {t('other_currencies')}: {otherCurrencies.map(([code, v]) => formatMoney(v.income - v.expense, code)).join(' · ')}
                    </Text>
                )}
            </View>

            {/* Income / Expense Split Cards */}
            <View style={styles.row}>
                <TouchableOpacity
                    onPress={onPressIncome}
                    style={[
                        styles.statsCard,
                        { backgroundColor: colors.surface },
                        activeFilter === 'income' && { borderColor: colors.success, borderWidth: 2 }
                    ]}
                >
                    <View style={[styles.icon, { backgroundColor: colors.success + '20' }]}>
                        <FontAwesome name="arrow-up" size={14} color={colors.success} />
                    </View>
                    <View style={{ flexShrink: 1 }}>
                        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{t('income')}</Text>
                        <Text style={[styles.subValue, { color: colors.text }]}>{formatMoney(income)}</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onPressExpense}
                    style={[
                        styles.statsCard,
                        { backgroundColor: colors.surface },
                        activeFilter === 'expense' && { borderColor: colors.error, borderWidth: 2 }
                    ]}
                >
                    <View style={[styles.icon, { backgroundColor: colors.error + '20' }]}>
                        <FontAwesome name="arrow-down" size={14} color={colors.error} />
                    </View>
                    <View style={{ flexShrink: 1 }}>
                        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{t('expense')}</Text>
                        <Text style={[styles.subValue, { color: colors.text }]}>{formatMoney(expense)}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    currency: {
        fontSize: 24,
        fontWeight: '500',
        marginTop: 6,
        marginRight: 4,
        fontFamily: 'SpaceMono',
    },
    other: {
        fontSize: 13,
        marginTop: 8,
        textAlign: 'center',
    },
    balance: {
        fontSize: 48,
        fontWeight: 'bold',
        fontFamily: 'SpaceMono',
        letterSpacing: -1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    statsCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 24,
        gap: 10,
        borderWidth: 2,
        borderColor: 'transparent',
        // Soft Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },
    icon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    subValue: {
        fontSize: 15,
        fontWeight: '700',
        fontFamily: 'SpaceMono',
    },
});
