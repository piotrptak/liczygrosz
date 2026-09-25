import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { format } from 'date-fns';
import React from 'react';
import type { DateFieldProps } from './DateField';

// @react-native-community/datetimepicker has no web implementation, so use the browser's native date input.
export default function DateField({ value, onChange }: DateFieldProps) {
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];

    return (
        <input
            type="date"
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
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 600,
                color: colors.text,
                backgroundColor: colors.secondary,
                border: 'none',
                borderRadius: 20,
                padding: '6px 12px',
                colorScheme: scheme,
            }}
        />
    );
}
