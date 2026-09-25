import AddTransactionForm from '@/components/feature/AddTransactionForm';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditTransactionScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const colors = Colors[useColorScheme() ?? 'light'];
    const { t } = useLocalization();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <ScreenHeader title={t('edit_transaction')} />
            <AddTransactionForm transactionId={Number(id)} />
        </SafeAreaView>
    );
}
