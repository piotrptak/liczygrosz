import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type DateFieldProps = { value: Date; onChange: (date: Date) => void };

export default function DateField({ value, onChange }: DateFieldProps) {
    const colors = Colors[useColorScheme() ?? 'light'];
    const { dateLocale } = useLocalization();
    const [open, setOpen] = useState(false);

    return (
        <View>
            <TouchableOpacity onPress={() => setOpen(true)} style={[styles.badge, { backgroundColor: colors.secondary }]}>
                <Ionicons name="calendar" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.text, { color: colors.text }]}>{format(value, 'd MMM yyyy', { locale: dateLocale })}</Text>
            </TouchableOpacity>
            {open && (
                <DateTimePicker
                    value={value}
                    mode="date"
                    display="default"
                    onChange={(_event, selected) => {
                        setOpen(Platform.OS === 'ios');
                        if (selected) onChange(selected);
                    }}
                />
            )}
        </View>
    );
}

export const styles = StyleSheet.create({
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    text: { fontSize: 14, fontWeight: '600' },
});
