import { radius, space, useTheme } from '@/constants/theme';
import { useLocalization } from '@/context/LocalizationContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/icons';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';

export type DateFieldProps = { value: Date; onChange: (date: Date) => void; label?: string };

export default function DateField({ value, onChange, label }: DateFieldProps) {
    const { colors } = useTheme();
    const { dateLocale } = useLocalization();
    const [open, setOpen] = useState(false);

    return (
        <View style={{ gap: 6 }}>
            {label && <Text variant="label" tone="secondary">{label}</Text>}
            <Pressable
                onPress={() => setOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={label}
                style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
                <Calendar size={18} color={colors.textMuted} />
                <Text variant="body">{format(value, 'EEEE, d MMMM yyyy', { locale: dateLocale })}</Text>
            </Pressable>
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
    field: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 48, paddingHorizontal: space.md, borderRadius: radius.md, borderWidth: 1 },
});
