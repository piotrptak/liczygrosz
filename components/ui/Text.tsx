import { type TypeVariant, type as typeScale, useTheme } from '@/constants/theme';
import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

export type Tone = 'default' | 'secondary' | 'muted' | 'primary' | 'income' | 'expense' | 'inverse' | 'onPrimary';

export type TextProps = RNTextProps & {
    variant?: TypeVariant;
    tone?: Tone;
    /** Fixed-width digits for amounts, so columns of numbers align. */
    tabular?: boolean;
    align?: 'left' | 'center' | 'right';
};

export default function Text({ variant = 'body', tone = 'default', tabular, align, style, ...props }: TextProps) {
    const { colors } = useTheme();
    const color = {
        default: colors.text,
        secondary: colors.textSecondary,
        muted: colors.textMuted,
        primary: colors.primaryText,
        income: colors.income,
        expense: colors.expense,
        inverse: colors.textInverse,
        onPrimary: colors.onPrimary,
    }[tone];

    return (
        <RNText
            style={[
                typeScale[variant],
                { color },
                tabular && { fontVariant: ['tabular-nums'] },
                align && { textAlign: align },
                style,
            ]}
            {...props}
        />
    );
}
