import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScreenHeader({ title, right }: { title: string; right?: React.ReactNode }) {
    const router = useRouter();
    const colors = Colors[useColorScheme() ?? 'light'];

    const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));

    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back">
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
            {right}
        </View>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    backButton: { marginRight: 16, padding: 4 },
    title: { flex: 1, fontSize: 24, fontWeight: 'bold', fontFamily: 'SpaceMono' },
});
