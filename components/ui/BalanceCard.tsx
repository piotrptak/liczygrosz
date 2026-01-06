import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useIsFocused } from '@react-navigation/native';
import { endOfMonth, startOfMonth } from 'date-fns';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface BalanceCardProps {
    selectedDate: Date;
    onPressIncome?: () => void;
    onPressExpense?: () => void;
    activeFilter?: 'all' | 'income' | 'expense';
}

export default function BalanceCard({ selectedDate, onPressIncome, onPressExpense, activeFilter = 'all' }: BalanceCardProps) {
    const db = useSQLiteContext();
    const isFocused = useIsFocused();
    const { t, currency } = useLocalization();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [balance, setBalance] = useState(0);
    const [income, setIncome] = useState(0);
    const [expense, setExpense] = useState(0);

    useEffect(() => {
        if (isFocused) {
            calculateBalance();
        }
    }, [isFocused, selectedDate]);

    const calculateBalance = async () => {
        try {
            const start = startOfMonth(selectedDate).getTime();
            const end = endOfMonth(selectedDate).getTime();

            const result: any[] = await db.getAllAsync(`
                SELECT type, SUM(amount) as total 
                FROM transactions 
                WHERE date >= ? AND date <= ? 
                GROUP BY type
            `, [start, end]);

            let inc = 0;
            let exp = 0;
            result.forEach(row => {
                if (row.type === 'income') inc = row.total;
                if (row.type === 'expense') exp = row.total;
            });
            setIncome(inc);
            setExpense(exp);
            setBalance(inc - exp);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <View style={styles.container}>
            {/* Main Balance Display */}
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                    if (activeFilter !== 'all') {
                        // Reset filter if clicking header, optional but nice UX
                        if (onPressIncome && onPressExpense) {
                            // A bit hacky, but we should probably expose a separate 'reset' prop or handle it in parent
                            // For now, let's just make the children clickable.
                        }
                    }
                }}
                style={styles.header}
            >
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('total_balance')}</Text>
                <View style={styles.balanceContainer}>
                    <Text style={[styles.currency, { color: colors.text }]}>{currency}</Text>
                    <Text style={[styles.balance, { color: colors.text }]}>{balance.toFixed(2)}</Text>
                </View>
            </TouchableOpacity>

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
                    <View>
                        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{t('income')}</Text>
                        <Text style={[styles.subValue, { color: colors.text }]}>{currency}{income.toFixed(2)}</Text>
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
                    <View>
                        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{t('expense')}</Text>
                        <Text style={[styles.subValue, { color: colors.text }]}>{currency}{expense.toFixed(2)}</Text>
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
        padding: 16,
        borderRadius: 24,
        gap: 12,
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
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'SpaceMono',
    },
});
