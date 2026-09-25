import TransactionList from '@/components/feature/TransactionList';
import BalanceCard from '@/components/ui/BalanceCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { addMonths, format, subMonths } from 'date-fns';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t, dateLocale } = useLocalization();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const handleToggleFilter = (type: 'income' | 'expense') => {
    setFilterType(current => (current === type ? 'all' : type));
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.inner}>
        {/* Header with Month Selector */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedDate(prev => subMonths(prev, 1))} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>
            {format(selectedDate, 'LLLL yyyy', { locale: dateLocale })}
          </Text>

          <TouchableOpacity onPress={() => setSelectedDate(prev => addMonths(prev, 1))} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <BalanceCard
            selectedDate={selectedDate}
            activeFilter={filterType}
            onPressIncome={() => handleToggleFilter('income')}
            onPressExpense={() => handleToggleFilter('expense')}
          />

          <View style={styles.activityHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recent_activity')}</Text>
            {filterType !== 'all' && (
              <TouchableOpacity onPress={() => setFilterType('all')}>
                <Text style={{ color: colors.tint, fontSize: 13, fontWeight: '600' }}>{t('clear_filter')}</Text>
              </TouchableOpacity>
            )}
          </View>
          <TransactionList selectedDate={selectedDate} filterType={filterType} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  navButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
