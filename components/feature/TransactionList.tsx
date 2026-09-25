import CategoryIcon from '@/components/ui/CategoryIcon';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import Text from '@/components/ui/Text';
import { radius, space, useTheme } from '@/constants/theme';
import { useLocalization } from '@/context/LocalizationContext';
import { deleteTransaction, fetchCategories, type Transaction } from '@/lib/api';
import { invalidateTransactions, keys } from '@/lib/queryClient';
import { confirmAction, showMessage, showSuccess } from '@/utils/dialogs';
import { errorKey } from '@/utils/errors';
import { useQuery } from '@tanstack/react-query';
import { format, isThisYear, isToday, isYesterday } from 'date-fns';
import { useRouter } from 'expo-router';
import { CirclePlus, Receipt, Trash2, WifiOff } from '@/components/ui/icons';
import React, { useMemo } from 'react';
import { Platform, Pressable, SectionList, StyleSheet, View, type ViewStyle } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

type Row = Transaction & { category_icon?: string | null; category_color?: string | null };
type Section = { title: string; net: Record<string, number>; data: Row[] };

type Props = {
    transactions: Transaction[];
    loading: boolean;
    error: boolean;
    onRetry: () => void;
    filterType: 'all' | 'income' | 'expense';
    header?: React.ReactElement;
};

export default function TransactionList({ transactions, loading, error, onRetry, filterType, header }: Props) {
    const router = useRouter();
    const { colors } = useTheme();
    const { t, dateLocale, formatMoney } = useLocalization();
    const { data: categories = [] } = useQuery({ queryKey: keys.categories, queryFn: fetchCategories });

    const sections = useMemo<Section[]>(() => {
        const byName = new Map(categories.map(c => [c.name, c]));
        const grouped = new Map<string, Section>();
        for (const tx of transactions) {
            if (filterType !== 'all' && tx.type !== filterType) continue;
            const date = new Date(tx.date);
            let title = format(date, 'EEEE, d MMMM yyyy', { locale: dateLocale });
            if (isToday(date)) title = t('today');
            else if (isYesterday(date)) title = t('yesterday');
            else if (isThisYear(date)) title = format(date, 'EEEE, d MMMM', { locale: dateLocale });

            if (!grouped.has(title)) grouped.set(title, { title, net: {}, data: [] });
            const section = grouped.get(title)!;
            const category = byName.get(tx.category);
            section.data.push({ ...tx, category_icon: category?.icon, category_color: category?.color });
            section.net[tx.currency] = (section.net[tx.currency] ?? 0) + (tx.type === 'income' ? tx.amount : -tx.amount);
        }
        return [...grouped.values()];
    }, [transactions, categories, filterType, dateLocale, t]);

    const handleDelete = (id: string) => {
        confirmAction(t('delete_transaction_title'), t('delete_transaction_message'), t('delete'), t('cancel'), async () => {
            try {
                await deleteTransaction(id);
                await invalidateTransactions();
                showSuccess(t('transaction_deleted'));
            } catch (e) {
                showMessage(t('error'), t(errorKey(e)));
            }
        });
    };

    const renderItem = ({ item, index, section }: { item: Row; index: number; section: Section }) => {
        const isIncome = item.type === 'income';
        const first = index === 0;
        const last = index === section.data.length - 1;
        return (
            <Swipeable
                renderRightActions={() => (
                    <Pressable
                        onPress={() => handleDelete(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel={t('delete')}
                        style={[styles.deleteAction, { backgroundColor: colors.expense }]}
                    >
                        <Trash2 size={20} color="#FFFFFF" />
                    </Pressable>
                )}
            >
                <Pressable
                    onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: item.id } })}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.note || item.category}, ${item.category}, ${isIncome ? '+' : '-'}${formatMoney(item.amount, item.currency)}`}
                    style={(state) => {
                        const { pressed, hovered, focused } = state as typeof state & { hovered?: boolean; focused?: boolean };
                        return [
                            styles.row,
                            { backgroundColor: pressed || hovered ? colors.surfaceHover : colors.surface, borderColor: colors.border },
                            first && styles.rowFirst,
                            last && styles.rowLast,
                            !first && { borderTopWidth: 0 },
                            focused && Platform.OS === 'web' && { outlineColor: colors.focus, outlineStyle: 'solid', outlineWidth: 2, outlineOffset: -2 } as ViewStyle,
                        ];
                    }}
                >
                    <CategoryIcon icon={item.category_icon} color={item.category_color} />
                    <View style={styles.details}>
                        <Text variant="bodyStrong" numberOfLines={1}>{item.note || item.category}</Text>
                        <Text variant="caption" tone="muted" numberOfLines={1}>{item.category}</Text>
                    </View>
                    <Text variant="bodyStrong" tabular tone={isIncome ? 'income' : 'default'}>
                        {isIncome ? '+' : '−'}{formatMoney(item.amount, item.currency)}
                    </Text>
                </Pressable>
            </Swipeable>
        );
    };

    const renderSectionHeader = ({ section }: { section: Section }) => (
        <View style={styles.sectionHeader}>
            <Text variant="overline" tone="muted" style={{ flex: 1 }}>{section.title}</Text>
            <Text variant="caption" tone="muted" tabular>
                {Object.entries(section.net).map(([code, v]) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${formatMoney(Math.abs(v), code)}`).join(' · ')}
            </Text>
        </View>
    );

    let empty: React.ReactElement;
    if (loading) {
        empty = (
            <View style={{ gap: space.sm, marginTop: space.lg }}>
                {[0, 1, 2, 3].map(i => <Skeleton key={i} height={68} rounded={radius.lg} />)}
            </View>
        );
    } else if (error) {
        empty = <EmptyState icon={WifiOff} tone="error" title={t('load_failed_title')} description={t('error_offline')} actionLabel={t('retry')} onAction={onRetry} />;
    } else {
        empty = (
            <EmptyState
                icon={Receipt}
                title={t('empty_month_title')}
                description={t('empty_month_description')}
                actionLabel={t('add_transaction')}
                actionIcon={CirclePlus}
                onAction={() => router.navigate('/(tabs)/add')}
            />
        );
    }

    return (
        <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            ListHeaderComponent={header}
            ListEmptyComponent={empty}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
        />
    );
}

const styles = StyleSheet.create({
    list: { paddingBottom: space.xxxl, paddingHorizontal: space.xl },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: space.xl, marginBottom: space.sm, paddingHorizontal: space.xs },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        minHeight: 68,
        borderWidth: 1,
    },
    rowFirst: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
    rowLast: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
    details: { flex: 1, gap: 2 },
    deleteAction: { justifyContent: 'center', alignItems: 'center', width: 72, borderRadius: radius.lg, marginLeft: space.sm },
});
