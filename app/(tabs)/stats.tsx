import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import { fetchTransactions } from '@/lib/api';
import { keys } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { addMonths, differenceInCalendarMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StatsScreen() {
    const { t, currency, currencyCode, dateLocale, formatMoney } = useLocalization();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { width } = useWindowDimensions();
    const chartWidth = Math.min(width, 640) - 80; // screen padding 48 + card padding 32

    const now = new Date();
    const firstMonth = startOfMonth(subMonths(now, 5));
    const lastDay = endOfMonth(now);
    const { data: transactions = [] } = useQuery({
        queryKey: keys.transactionsRange(firstMonth, lastDay),
        queryFn: () => fetchTransactions(firstMonth, lastDay),
    });

    // Only the default currency is considered; amounts in other currencies are not convertible here.
    const { monthNet, chartData } = useMemo(() => {
        const months = Array.from({ length: 6 }, (_, i) => addMonths(firstMonth, i));
        const expenses = months.map(() => 0);
        let income = 0;
        let expense = 0;
        for (const tx of transactions) {
            if (tx.currency !== currencyCode) continue;
            const index = differenceInCalendarMonths(new Date(tx.date), firstMonth);
            if (tx.type === 'expense' && index >= 0 && index < 6) expenses[index] += tx.amount;
            if (index === 5) {
                if (tx.type === 'income') income += tx.amount;
                else expense += tx.amount;
            }
        }
        return {
            monthNet: income - expense,
            chartData: expenses.some(v => v > 0) ? {
                labels: months.map(m => format(m, 'LLL', { locale: dateLocale })),
                datasets: [{ data: expenses }],
            } : null,
        };
    }, [transactions, currencyCode, dateLocale, firstMonth.getTime()]);

    return (
        <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>{t('stats_title')}</Text>
                    <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{t('amounts_in', { currency: currencyCode })}</Text>
                </View>

                <View style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: monthNet >= 0 ? colors.primary : colors.error }]}>
                    <Text style={[styles.cardTitle, { color: monthNet >= 0 ? colors.primary : colors.error }]}>{t('savings_suggestion')}</Text>
                    <Text style={[styles.cardBody, { color: colors.text }]}>
                        {monthNet >= 0
                            ? t('savings_message', { amount: formatMoney(monthNet) })
                            : t('savings_negative', { amount: formatMoney(-monthNet) })}
                    </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('expense_trend')}</Text>
                {chartData ? (
                    <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
                        <LineChart
                            data={chartData}
                            width={chartWidth}
                            height={220}
                            yAxisLabel={currencyCode === 'PLN' ? '' : currency}
                            yAxisSuffix={currencyCode === 'PLN' ? ' zł' : ''}
                            yAxisInterval={1}
                            fromZero
                            chartConfig={{
                                backgroundColor: colors.surface,
                                backgroundGradientFrom: colors.surface,
                                backgroundGradientTo: colors.surface,
                                decimalPlaces: 0,
                                color: () => colors.primary,
                                labelColor: () => colors.textSecondary,
                                propsForDots: {
                                    r: '5',
                                    strokeWidth: '2',
                                    stroke: colors.background,
                                },
                            }}
                            bezier
                            withInnerLines={false}
                            withOuterLines={false}
                            style={{ marginVertical: 8, borderRadius: 16 }}
                        />
                    </View>
                ) : (
                    <View style={[styles.chartContainer, styles.emptyChart, { backgroundColor: colors.surface }]}>
                        <Text style={{ color: colors.textSecondary }}>{t('no_transactions')}</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        width: '100%',
        maxWidth: 640,
        alignSelf: 'center',
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        fontFamily: 'SpaceMono',
        letterSpacing: -1,
    },
    card: {
        padding: 24,
        borderRadius: 24,
        marginBottom: 32,
        borderLeftWidth: 4,
        // Premium Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    cardBody: {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    chartContainer: {
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    emptyChart: {
        height: 120,
        justifyContent: 'center',
    },
});
