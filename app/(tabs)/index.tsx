import TransactionList from '@/components/feature/TransactionList';
import BalanceCard from '@/components/ui/BalanceCard';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Text from '@/components/ui/Text';
import { layout, radius, space, useTheme } from '@/constants/theme';
import { useLocalization } from '@/context/LocalizationContext';
import { useMonthTransactions } from '@/lib/useMonthTransactions';
import { addMonths, format, isSameMonth, subMonths } from 'date-fns';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, CirclePlus } from '@/components/ui/icons';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Filter = 'all' | 'income' | 'expense';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const { t, dateLocale } = useLocalization();
  const { width } = useWindowDimensions();
  const desktop = width >= layout.desktop;

  const [month, setMonth] = useState(new Date());
  const [filter, setFilter] = useState<Filter>('all');
  const { data: transactions = [], isPending, isError, refetch } = useMonthTransactions(month);
  const current = isSameMonth(month, new Date());

  const monthSwitcher = (
    <View style={[styles.monthSwitcher, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <IconButton icon={ChevronLeft} label={t('previous_month')} onPress={() => setMonth(m => subMonths(m, 1))} size={36} />
      <Text variant="bodyStrong" style={styles.monthLabel} numberOfLines={1}>
        {format(month, 'LLLL yyyy', { locale: dateLocale })}
      </Text>
      <IconButton icon={ChevronRight} label={t('next_month')} onPress={() => setMonth(m => addMonths(m, 1))} size={36} />
    </View>
  );

  const summary = (
    <View style={{ gap: space.lg }}>
      <BalanceCard transactions={transactions} loading={isPending} />
      <SegmentedControl<Filter>
        value={filter}
        onChange={setFilter}
        accessibilityLabel={t('filter')}
        options={[
          { value: 'all', label: t('filter_all') },
          { value: 'income', label: t('income'), tone: 'income' },
          { value: 'expense', label: t('expense'), tone: 'expense' },
        ]}
      />
    </View>
  );

  const header = (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text variant="title" accessibilityRole="header">{t('dashboard_title')}</Text>
        {!current && (
          <Button label={t('back_to_today')} variant="ghost" size="sm" onPress={() => setMonth(new Date())} style={styles.todayButton} />
        )}
      </View>
      {monthSwitcher}
      {desktop && <Button label={t('add_transaction')} icon={CirclePlus} onPress={() => router.navigate('/(tabs)/add')} />}
    </View>
  );

  const list = (listHeader?: React.ReactElement) => (
    <TransactionList
      transactions={transactions}
      loading={isPending}
      error={isError && transactions.length === 0}
      onRetry={() => refetch()}
      filterType={filter}
      header={listHeader}
    />
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={[styles.inner, { maxWidth: layout.maxWidth }]}>
        {header}
        {desktop ? (
          <View style={styles.columns}>
            <View style={styles.sideColumn}>{summary}</View>
            <View style={{ flex: 1 }}>{list()}</View>
          </View>
        ) : (
          list(summary)
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, width: '100%', alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.md,
    flexWrap: 'wrap',
  },
  todayButton: { alignSelf: 'flex-start', marginLeft: -space.md, height: 28 },
  monthSwitcher: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, padding: 2 },
  monthLabel: { minWidth: 132, textAlign: 'center', textTransform: 'capitalize' },
  columns: { flex: 1, flexDirection: 'row', paddingLeft: space.xl, gap: space.sm },
  sideColumn: { width: 360, paddingTop: space.xs },
});
