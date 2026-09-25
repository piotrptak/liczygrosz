import AddTransactionForm from '@/components/feature/AddTransactionForm';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function EditTransactionScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <AddTransactionForm transactionId={id} />;
}
