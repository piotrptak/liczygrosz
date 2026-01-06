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

  const goToPreviousMonth = () => {
    setSelectedDate(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setSelectedDate(prev => addMonths(prev, 1));
  };

  const handleToggleFilter = (type: 'income' | 'expense') => {
    if (filterType === type) {
      setFilterType('all');
    } else {
      setFilterType(type);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header with Month Selector */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {format(selectedDate, 'MMMM yyyy', { locale: dateLocale })}
          </Text>
        </View>

        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
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
              <Text style={{ color: colors.tint, fontSize: 13, fontWeight: '600' }}>
                Clear Filter
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <TransactionList selectedDate={selectedDate} filterType={filterType} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    textTransform: 'capitalize'
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
  }
});
