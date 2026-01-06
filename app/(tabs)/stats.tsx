import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import { useIsFocused } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StatsScreen() {
    const db = useSQLiteContext();
    const isFocused = useIsFocused();
    const { t, currency } = useLocalization();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [chartData, setChartData] = useState<{ labels: string[], datasets: { data: number[] }[] } | null>(null);
    const [savingsSuggestion, setSavingsSuggestion] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isFocused) {
            loadStats();
        }
    }, [isFocused]);

    const loadStats = async () => {
        try {
            setLoading(true);
            const now = new Date();

            // 1. Savings Suggestion (Income vs Expense this month)
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const transactionsThisMonth = await db.getAllAsync(`
                SELECT type, amount FROM transactions 
                WHERE date >= ? 
            `, [startOfMonth.getTime()]);

            let income = 0;
            let expense = 0;
            // @ts-ignore
            transactionsThisMonth.forEach((t: any) => {
                if (t.type === 'income') income += t.amount;
                else expense += t.amount;
            });

            const potentialSavings = income - expense;
            if (potentialSavings > 0) {
                setSavingsSuggestion(t('savings_message', { amount: `${currency}${potentialSavings.toFixed(2)}` }));
            } else {
                // Alternate message if no savings
                setSavingsSuggestion(t('savings_message', { amount: `${currency}0.00` }));
            }

            // 2. Chart Data (Last 6 Months Expenses)
            // We need to calculate this manually because SQLite in Expo can be tricky with dates
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(now.getMonth() - 5);
            sixMonthsAgo.setDate(1);
            sixMonthsAgo.setHours(0, 0, 0, 0);

            const allExpenses = await db.getAllAsync(`
                SELECT amount, date FROM transactions 
                WHERE type = 'expense' AND date >= ?
                ORDER BY date ASC
            `, [sixMonthsAgo.getTime()]);

            // Aggregate by month
            const monthlyData: { [key: string]: number } = {};
            const monthLabels: string[] = [];

            // Initialize last 6 months with 0
            for (let i = 0; i < 6; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
                const key = `${d.getFullYear()}-${d.getMonth()}`;
                // Short month name
                const monthName = d.toLocaleString('default', { month: 'short' });
                // We use 'en-US' default for labels to keep it short or could use locale
                // actually toLocaleString might depend on device. Let's use simple array or explicit locale if needed.
                // For safety in JS engine:
                const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                monthLabels.push(mNames[d.getMonth()]);
                monthlyData[key] = 0;
            }

            // @ts-ignore
            allExpenses.forEach((t: any) => {
                const d = new Date(t.date);
                const key = `${d.getFullYear()}-${d.getMonth()}`;
                // Only add if it falls in our window (query mostly handles this)
                if (monthlyData[key] !== undefined) {
                    monthlyData[key] += t.amount;
                }
            });

            const dataPoints = Object.values(monthlyData);

            // Check if we have any data at all to show
            if (dataPoints.some(v => v > 0)) {
                setChartData({
                    labels: monthLabels,
                    datasets: [{ data: dataPoints }]
                });
            } else {
                setChartData(null);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>{t('transactions')}</Text>
                </View>

                {/* Savings Card - Modern Style */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
                    <Text style={[styles.cardTitle, { color: colors.primary }]}>{t('savings_suggestion')}</Text>
                    <Text style={[styles.cardBody, { color: colors.text }]}>{savingsSuggestion}</Text>
                </View>

                {/* Chart */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Expense Trend</Text>
                {chartData ? (
                    <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
                        <LineChart
                            data={chartData}
                            width={Dimensions.get('window').width - 72} // -40 padding -32 card padding
                            height={220}
                            yAxisLabel={currency}
                            yAxisSuffix=""
                            yAxisInterval={1}
                            chartConfig={{
                                backgroundColor: colors.surface,
                                backgroundGradientFrom: colors.surface,
                                backgroundGradientTo: colors.surface,
                                decimalPlaces: 0,
                                color: (opacity = 1) => colors.primary,
                                labelColor: (opacity = 1) => colors.textSecondary,
                                style: {
                                    borderRadius: 16
                                },
                                propsForDots: {
                                    r: "5",
                                    strokeWidth: "2",
                                    stroke: colors.background
                                }
                            }}
                            bezier
                            withInnerLines={false}
                            withOuterLines={false}
                            style={{
                                marginVertical: 8,
                                borderRadius: 16
                            }}
                        />
                    </View>
                ) : (
                    <View style={[styles.chartContainer, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
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
    },
    header: {
        marginBottom: 32,
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
    }
});
