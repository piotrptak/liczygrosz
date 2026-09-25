import AddTransactionForm from '@/components/feature/AddTransactionForm';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddScreen() {
    const colors = Colors[useColorScheme() ?? 'light'];

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
            <AddTransactionForm />
        </SafeAreaView>
    );
}
