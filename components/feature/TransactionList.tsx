import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import { deleteTransaction, fetchCategories, type Transaction } from '@/lib/api';
import { invalidateTransactions, keys } from '@/lib/queryClient';
import { useMonthTransactions } from '@/lib/useMonthTransactions';
import { confirmAction, showMessage } from '@/utils/dialogs';
import { errorKey } from '@/utils/errors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { format, isThisYear, isToday, isYesterday } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

type Row = Transaction & { category_icon?: string | null; category_color?: string | null };

interface SectionData {
    title: string;
    data: Row[];
}

interface TransactionListProps {
    selectedDate: Date;
    filterType: 'all' | 'income' | 'expense';
}

export default function TransactionList({ selectedDate, filterType }: TransactionListProps) {
    const router = useRouter();
    const { t, dateLocale, formatMoney } = useLocalization();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const { data: transactions = [], isPending, isError, refetch } = useMonthTransactions(selectedDate);
    const { data: categories = [] } = useQuery({ queryKey: keys.categories, queryFn: fetchCategories });

    const sections = useMemo<SectionData[]>(() => {
        const byName = new Map(categories.map(c => [c.name, c]));
        const grouped = new Map<string, Row[]>();
        for (const tx of transactions) {
            if (filterType !== 'all' && tx.type !== filterType) continue;
            const date = new Date(tx.date);
            let key = format(date, 'd MMM yyyy', { locale: dateLocale });
            if (isToday(date)) key = t('today');
            else if (isYesterday(date)) key = t('yesterday');
            else if (isThisYear(date)) key = format(date, 'd MMM', { locale: dateLocale });

            const category = byName.get(tx.category);
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push({ ...tx, category_icon: category?.icon, category_color: category?.color });
        }
        return [...grouped].map(([title, data]) => ({ title, data }));
    }, [transactions, categories, filterType, dateLocale, t]);

    const handleDelete = (id: string) => {
        confirmAction(t('delete_transaction_title'), t('delete_transaction_message'), t('delete'), t('cancel'), async () => {
            try {
                await deleteTransaction(id);
                await invalidateTransactions();
            } catch (error) {
                showMessage(t('error'), t(errorKey(error)));
            }
        });
    };

    const handleEdit = (item: Row) => {
        router.push({ pathname: '/transaction/[id]', params: { id: item.id } });
    };

    const renderRightActions = (id: string) => {
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
    const renderCategoryIcon = (iconName: string | null | undefined, color: string | undefined) => {
        // Use generic icon if missing
        const name = (iconName as any) || 'pricetag-outline';
        return <Ionicons name={name} size={20} color={color || '#FFF'} />;
    };

    const renderItem = ({ item }: { item: Row }) => {
        const isIncome = item.type === 'income';
        // Use category color or fallback to income/expense colors
        const iconColor = item.category_color ? '#FFF' : (isIncome ? colors.success : colors.textSecondary);
        const iconBg = item.category_color ? item.category_color : (isIncome ? colors.success + '20' : colors.secondary);

        return (
            <Swipeable renderRightActions={() => renderRightActions(item.id)}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleEdit(item)}
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
                            {isIncome ? '+' : '-'}{formatMoney(item.amount, item.currency)}
                        </Text>
                    </View>
                </TouchableOpacity>
            </Swipeable>
        );
    };

    const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{title}</Text>
    );

    if (isPending) {
        return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />;
    }

    if (isError && transactions.length === 0) {
        return (
            <TouchableOpacity style={styles.emptyContainer} onPress={() => refetch()}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('error_offline')}</Text>
            </TouchableOpacity>
        );
    }

    if (sections.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('no_transactions')}</Text>
            </View>
        );
    }

    return (
        <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
        />
    );
}

const styles = StyleSheet.create({
    list: {
        paddingBottom: 40,
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
