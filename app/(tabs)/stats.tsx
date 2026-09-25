import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import { useIsFocused } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { addMonths, differenceInCalendarMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StatsScreen() {
    const db = useSQLiteContext();
    const isFocused = useIsFocused();
    const { t, currency, currencyCode, dateLocale, formatMoney } = useLocalization();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { width } = useWindowDimensions();
    const chartWidth = Math.min(width, 640) - 80; // screen padding 48 + card padding 32

    const [chartData, setChartData] = useState<{ labels: string[], datasets: { data: number[] }[] } | null>(null);
    const [monthNet, setMonthNet] = useState(0);

    useEffect(() => {
        if (isFocused) {
            loadStats();
        }
    }, [isFocused, currencyCode, dateLocale]);

    // Only the default currency is considered; amounts in other currencies are not convertible here.
    const loadStats = async () => {
        try {
            const now = new Date();

            const monthTotals = await db.getAllAsync<{ type: string; total: number }>(`
                SELECT type, SUM(amount) as total FROM transactions
                WHERE date >= ? AND date <= ? AND COALESCE(currency, ?) = ?
                GROUP BY type
            `, [startOfMonth(now).getTime(), endOfMonth(now).getTime(), currencyCode, currencyCode]);

            const income = monthTotals.find(r => r.type === 'income')?.total ?? 0;
            const expense = monthTotals.find(r => r.type === 'expense')?.total ?? 0;
            setMonthNet(income - expense);

            // Last 6 months of expenses
            const firstMonth = startOfMonth(subMonths(now, 5));
            const expenses = await db.getAllAsync<{ amount: number; date: number }>(`
                SELECT amount, date FROM transactions
                WHERE type = 'expense' AND date >= ? AND date <= ? AND COALESCE(currency, ?) = ?
            `, [firstMonth.getTime(), endOfMonth(now).getTime(), currencyCode, currencyCode]);

            const months = Array.from({ length: 6 }, (_, i) => addMonths(firstMonth, i));
            const dataPoints = months.map(() => 0);
            expenses.forEach(tx => {
                const index = differenceInCalendarMonths(new Date(tx.date), firstMonth);
                if (index >= 0 && index < 6) dataPoints[index] += tx.amount;
            });

            setChartData(dataPoints.some(v => v > 0) ? {
                labels: months.map(m => format(m, 'LLL', { locale: dateLocale })),
                datasets: [{ data: dataPoints }],
            } : null);
        } catch (e) {
            console.error(e);
        }
    };

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
