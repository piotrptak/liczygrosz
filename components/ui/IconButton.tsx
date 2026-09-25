import { radius, useTheme } from '@/constants/theme';
import type { LucideIcon } from '@/components/ui/icons';
import React from 'react';
import { Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
    icon: LucideIcon;
    /** Required: icon-only controls need an accessible name. */
    label: string;
    onPress: () => void;
    tone?: 'default' | 'danger' | 'primary';
    variant?: 'ghost' | 'filled';
    size?: number;
    style?: StyleProp<ViewStyle>;
};

export default function IconButton({ icon: Icon, label, onPress, tone = 'default', variant = 'ghost', size = 40, style }: Props) {
    const { colors } = useTheme();
    const fg = tone === 'danger' ? colors.expense : tone === 'primary' ? colors.primaryText : colors.textSecondary;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={4}
            style={(state) => {
                const { pressed, hovered, focused } = state as typeof state & { hovered?: boolean; focused?: boolean };
                return [
                    {
                        width: size,
                        height: size,
                        borderRadius: radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: pressed || hovered ? colors.surfaceHover : variant === 'filled' ? colors.surfaceMuted : 'transparent',
                    },
                    focused && Platform.OS === 'web' && { outlineColor: colors.focus, outlineStyle: 'solid', outlineWidth: 2 } as ViewStyle,
                    style,
                ];
            }}
        >
            <Icon size={Math.round(size * 0.5)} color={fg} strokeWidth={2} />
        </Pressable>
    );
}
