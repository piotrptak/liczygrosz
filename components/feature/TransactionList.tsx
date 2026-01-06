import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { endOfMonth, format, isThisYear, isToday, isYesterday, startOfMonth } from 'date-fns';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

interface Transaction {
    id: number;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: number;
    note?: string;
    category_icon?: string;
    category_color?: string;
    currency?: string;
}

interface SectionData {
    title: string;
    data: Transaction[];
}

interface TransactionListProps {
    selectedDate: Date;
    filterType: 'all' | 'income' | 'expense';
}

export default function TransactionList({ selectedDate, filterType }: TransactionListProps) {
    const db = useSQLiteContext();
    const router = useRouter();
    const isFocused = useIsFocused();
    const { t, currency: defaultSymbol, currencies, dateLocale } = useLocalization();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [sections, setSections] = useState<SectionData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isFocused) {
            loadTransactions();
        }
    }, [isFocused, selectedDate, filterType]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const start = startOfMonth(selectedDate).getTime();
            const end = endOfMonth(selectedDate).getTime();

            // We join with categories to get the icon and color
            // Using LEFT JOIN in case a category was deleted but transaction remains (though we should handle that)
            let query = `
                SELECT t.*, c.icon as category_icon, c.color as category_color 
                FROM transactions t 
                LEFT JOIN categories c ON t.category = c.name 
                WHERE t.date >= ? AND t.date <= ?
            `;
            const params: any[] = [start, end];

            if (filterType !== 'all') {
                query += ' AND t.type = ?';
                params.push(filterType);
            }

            query += ' ORDER BY t.date DESC';

            const result = await db.getAllAsync<Transaction>(query, params);

            // Group by date
            const grouped: { [key: string]: Transaction[] } = {};
            result.forEach(tx => {
                const date = new Date(tx.date);
                let key = format(date, 'MMM dd, yyyy', { locale: dateLocale });
                if (isToday(date)) key = t('today') || 'Today';
                else if (isYesterday(date)) key = t('yesterday') || 'Yesterday';
                else if (isThisYear(date)) key = format(date, 'MMM dd', { locale: dateLocale });

                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(tx);
            });

            const sectionsArray = Object.keys(grouped).map(key => ({
                title: key,
                data: grouped[key]
            }));

            setSections(sectionsArray);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert(
            "Delete Transaction",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
                        loadTransactions(); // Reload
                    }
                }
            ]
        );
    };

    const handleEdit = (item: Transaction) => {
        router.push({
            pathname: '/(tabs)/add',
            params: {
                id: item.id,
                amount: item.amount,
                type: item.type,
                category: item.category,
                note: item.note || '',
                date: item.date.toString(),
                currency: item.currency
            }
        });
    };

    const renderRightActions = (id: number) => {
        return (
            <TouchableOpacity
                style={styles.deleteAction}
                onPress={() => handleDelete(id)}
            >
                <Ionicons name="trash" size={24} color="#FFF" />
            </TouchableOpacity>
        );
    };

    // Helper to render icon safely
    const renderCategoryIcon = (iconName: string | undefined, color: string | undefined) => {
        // Use generic icon if missing
        const name = (iconName as any) || 'pricetag-outline';
        return <Ionicons name={name} size={20} color={color || '#FFF'} />;
    };

    const renderItem = ({ item }: { item: Transaction }) => {
        const isIncome = item.type === 'income';
        // Use category color or fallback to income/expense colors
        const iconColor = item.category_color ? '#FFF' : (isIncome ? colors.success : colors.textSecondary);
        const iconBg = item.category_color ? item.category_color : (isIncome ? colors.success + '20' : colors.secondary);

        return (
            <Swipeable renderRightActions={() => renderRightActions(item.id)}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onLongPress={() => handleEdit(item)}
                    style={[styles.card, { backgroundColor: colors.surface }]}
                >
                    <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                        {renderCategoryIcon(item.category_icon, iconColor)}
                    </View>
                    <View style={styles.details}>
                        <Text style={[styles.category, { color: colors.text }]}>{item.category}</Text>
                        {item.note ? <Text numberOfLines={1} style={[styles.note, { color: colors.textSecondary }]}>{item.note}</Text> : null}
                    </View>
                    <View style={styles.amountContainer}>
                        <Text style={[
                            styles.amount,
                            { color: isIncome ? colors.moneyIncome : colors.text }
                        ]}>
                            {isIncome ? '+' : ''}{item.currency ? (currencies.find(c => c.code === item.currency)?.symbol || item.currency) : defaultSymbol}{item.amount.toFixed(2)}
                        </Text>
                    </View>
                </TouchableOpacity>
            </Swipeable>
        );
    };

    const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{title}</Text>
    );

    if (loading) {
        return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />;
    }

    if (sections.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('no_transactions')}</Text>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
            />
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    list: {
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 24,
        textTransform: 'uppercase',
        letterSpacing: 1,
        opacity: 0.7,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03, // Extra subtle
        shadowRadius: 10,
        elevation: 2,
    },
    deleteAction: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        marginBottom: 12,
        borderRadius: 20,
        height: '84%',
        marginTop: 0,
        marginLeft: 10,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    details: {
        flex: 1,
    },
    category: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    note: {
        fontSize: 12,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'SpaceMono',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
    },
});
