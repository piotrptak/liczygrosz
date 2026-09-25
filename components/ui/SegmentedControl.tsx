import { fonts, radius, space, useTheme } from '@/constants/theme';
import type { LucideIcon } from '@/components/ui/icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type Segment<T extends string> = { value: T; label: string; icon?: LucideIcon; tone?: 'income' | 'expense' };

type Props<T extends string> = {
    value: T;
    onChange: (value: T) => void;
    options: Segment<T>[];
    accessibilityLabel?: string;
};

export default function SegmentedControl<T extends string>({ value, onChange, options, accessibilityLabel }: Props<T>) {
    const { colors } = useTheme();

    return (
        <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
            {options.map(option => {
                const active = option.value === value;
                const fg = !active
                    ? colors.textSecondary
                    : option.tone === 'income' ? colors.income : option.tone === 'expense' ? colors.expense : colors.text;
                const Icon = option.icon;
                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                        accessibilityLabel={option.label}
                        style={[styles.segment, active && [styles.active, { backgroundColor: colors.surface, shadowColor: '#000' }]]}
                    >
                        {Icon && <Icon size={16} color={fg} strokeWidth={2.2} />}
                        <Text style={[styles.label, { color: fg, fontFamily: active ? fonts.semibold : fonts.medium }]}>{option.label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    track: { flexDirection: 'row', borderRadius: radius.md, padding: 3, gap: 3 },
    segment: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minHeight: 40,
        paddingHorizontal: space.md,
        borderRadius: radius.sm + 1,
    },
    active: { shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    label: { fontSize: 14 },
});
