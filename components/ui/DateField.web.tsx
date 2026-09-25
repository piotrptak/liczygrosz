import { fonts, radius, space, useTheme } from '@/constants/theme';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/icons';
import React from 'react';
import { View } from 'react-native';
import type { DateFieldProps } from './DateField';
import Text from './Text';

// @react-native-community/datetimepicker has no web implementation, so use the browser's native date input.
export default function DateField({ value, onChange, label }: DateFieldProps) {
    const { colors, scheme } = useTheme();

    return (
        <View style={{ gap: 6 }}>
            {label && <Text variant="label" tone="secondary">{label}</Text>}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 48, paddingHorizontal: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
                <Calendar size={18} color={colors.textMuted} />
                <input
                    type="date"
                    aria-label={label}
                    value={format(value, 'yyyy-MM-dd')}
                    onChange={(e) => {
                        if (!e.target.value) return;
                        const [y, m, d] = e.target.value.split('-').map(Number);
                        // Keep the time of day so transactions entered today sort naturally.
                        const next = new Date(value);
                        next.setFullYear(y, m - 1, d);
                        onChange(next);
                    }}
                    style={{
                        flex: 1,
                        fontFamily: fonts.regular,
                        fontSize: 15,
                        color: colors.text,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        padding: '12px 0',
                        colorScheme: scheme,
                    }}
                />
            </View>
        </View>
    );
}
