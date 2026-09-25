import { fonts, radius, space, useTheme } from '@/constants/theme';
import type { LucideIcon } from '@/components/ui/icons';
import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerSoft';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = {
    label: string;
    onPress?: () => void;
    variant?: Variant;
    size?: Size;
    icon?: LucideIcon;
    iconRight?: LucideIcon;
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    style?: StyleProp<ViewStyle>;
    accessibilityHint?: string;
};

const HEIGHT: Record<Size, number> = { sm: 36, md: 44, lg: 52 };
const FONT: Record<Size, number> = { sm: 13, md: 15, lg: 16 };

export default function Button({
    label, onPress, variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight,
    loading, disabled, fullWidth, style, accessibilityHint,
}: ButtonProps) {
    const { colors } = useTheme();
    const inactive = disabled || loading;

    const palette = {
        primary: { bg: colors.primary, bgPressed: colors.primaryPressed, fg: colors.onPrimary, border: 'transparent' },
        secondary: { bg: colors.surface, bgPressed: colors.surfaceHover, fg: colors.text, border: colors.borderStrong },
        ghost: { bg: 'transparent', bgPressed: colors.surfaceHover, fg: colors.primaryText, border: 'transparent' },
        danger: { bg: colors.danger, bgPressed: colors.danger, fg: '#FFFFFF', border: 'transparent' },
        dangerSoft: { bg: colors.expenseSoft, bgPressed: colors.expenseSoft, fg: colors.expense, border: 'transparent' },
    }[variant];

    return (
        <Pressable
            onPress={onPress}
            disabled={inactive}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled: !!inactive, busy: !!loading }}
            style={(state) => {
                const { pressed, hovered, focused } = state as typeof state & { hovered?: boolean; focused?: boolean };
                return [
                    styles.base,
                    {
                        height: HEIGHT[size],
                        paddingHorizontal: size === 'sm' ? space.md : space.lg,
                        backgroundColor: pressed || hovered ? palette.bgPressed : palette.bg,
                        borderColor: palette.border,
                        opacity: disabled ? 0.45 : pressed && variant === 'danger' ? 0.85 : 1,
                    },
                    fullWidth && styles.fullWidth,
                    focused && Platform.OS === 'web' && { outlineColor: colors.focus, outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2 } as ViewStyle,
                    style,
                ];
            }}
        >
            {loading ? (
                <ActivityIndicator color={palette.fg} size="small" />
            ) : (
                <View style={styles.content}>
                    {Icon && <Icon size={FONT[size] + 3} color={palette.fg} strokeWidth={2.2} />}
                    <Text style={[styles.label, { color: palette.fg, fontSize: FONT[size] }]} numberOfLines={1}>{label}</Text>
                    {IconRight && <IconRight size={FONT[size] + 3} color={palette.fg} strokeWidth={2.2} />}
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: radius.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    fullWidth: { alignSelf: 'stretch' },
    content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    label: { fontFamily: fonts.semibold },
});
