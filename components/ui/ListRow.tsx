import { radius, space, useTheme } from '@/constants/theme';
import { ChevronRight, type LucideIcon } from '@/components/ui/icons';
import React from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Text from './Text';

type Props = {
    icon?: LucideIcon;
    iconColor?: string;
    leading?: React.ReactNode;
    title: string;
    subtitle?: string;
    value?: string;
    trailing?: React.ReactNode;
    onPress?: () => void;
    destructive?: boolean;
    chevron?: boolean;
    divider?: boolean;
};

export default function ListRow({ icon: Icon, iconColor, leading, title, subtitle, value, trailing, onPress, destructive, chevron = !!onPress, divider }: Props) {
    const { colors } = useTheme();
    const tint = destructive ? colors.expense : iconColor ?? colors.primaryText;

    const content = (
        <>
            {leading ?? (Icon && (
                <View style={[styles.iconTile, { backgroundColor: destructive ? colors.expenseSoft : colors.surfaceMuted }]}>
                    <Icon size={18} color={tint} strokeWidth={2} />
                </View>
            ))}
            <View style={styles.text}>
                <Text variant="bodyStrong" tone={destructive ? 'expense' : 'default'} numberOfLines={1}>{title}</Text>
                {subtitle && <Text variant="caption" tone="muted" numberOfLines={1}>{subtitle}</Text>}
            </View>
            {value && <Text variant="label" tone="muted" numberOfLines={1}>{value}</Text>}
            {trailing}
            {chevron && <ChevronRight size={18} color={colors.textMuted} />}
        </>
    );

    const rowStyle = [styles.row, divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }];

    if (!onPress) return <View style={rowStyle}>{content}</View>;
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={value ? `${title}, ${value}` : title}
            style={(state) => {
                const { pressed, hovered, focused } = state as typeof state & { hovered?: boolean; focused?: boolean };
                return [
                    rowStyle,
                    (pressed || hovered) && { backgroundColor: colors.surfaceHover },
                    focused && Platform.OS === 'web' && { outlineColor: colors.focus, outlineStyle: 'solid', outlineWidth: 2, outlineOffset: -2 } as ViewStyle,
                ];
            }}
        >
            {content}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, minHeight: 60, paddingVertical: space.md },
    iconTile: { width: 36, height: 36, borderRadius: radius.sm + 2, alignItems: 'center', justifyContent: 'center' },
    text: { flex: 1, gap: 2 },
});
