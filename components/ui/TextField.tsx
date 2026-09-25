import { fonts, radius, space, useTheme } from '@/constants/theme';
import { Eye, EyeOff, type LucideIcon } from '@/components/ui/icons';
import React, { forwardRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Text from './Text';

type Props = TextInputProps & {
    label?: string;
    icon?: LucideIcon;
    error?: string | null;
    hint?: string;
    /** Adds a show/hide toggle for password fields. */
    revealable?: boolean;
};

const TextField = forwardRef<TextInput, Props>(function TextField(
    { label, icon: Icon, error, hint, revealable, secureTextEntry, style, onFocus, onBlur, ...props },
    ref,
) {
    const { colors } = useTheme();
    const [focused, setFocused] = useState(false);
    const [revealed, setRevealed] = useState(false);

    const borderColor = error ? colors.expense : focused ? colors.primary : colors.border;

    return (
        <View style={styles.wrapper}>
            {label && <Text variant="label" tone="secondary" style={styles.label}>{label}</Text>}
            <View style={[styles.field, { backgroundColor: colors.surface, borderColor }, focused && { borderWidth: 1.5 }]}>
                {Icon && <Icon size={18} color={error ? colors.expense : focused ? colors.primaryText : colors.textMuted} strokeWidth={2} />}
                <TextInput
                    ref={ref}
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={secureTextEntry && !revealed}
                    onFocus={(e) => { setFocused(true); onFocus?.(e); }}
                    onBlur={(e) => { setFocused(false); onBlur?.(e); }}
                    accessibilityLabel={label}
                    style={[
                        styles.input,
                        { color: colors.text },
                        Platform.OS === 'web' && ({ outlineStyle: 'none' } as object),
                        style,
                    ]}
                    {...props}
                />
                {revealable && (
                    <Pressable
                        onPress={() => setRevealed(v => !v)}
                        accessibilityRole="button"
                        accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
                        hitSlop={8}
                    >
                        {revealed ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                    </Pressable>
                )}
            </View>
            {error ? (
                <Text variant="caption" tone="expense" style={styles.message} accessibilityLiveRegion="polite">{error}</Text>
            ) : hint ? (
                <Text variant="caption" tone="muted" style={styles.message}>{hint}</Text>
            ) : null}
        </View>
    );
});

export default TextField;

const styles = StyleSheet.create({
    wrapper: { gap: 6 },
    label: {},
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        minHeight: 48,
        paddingHorizontal: space.md,
        borderRadius: radius.md,
        borderWidth: 1,
    },
    input: { flex: 1, fontSize: 15, fontFamily: fonts.regular, paddingVertical: space.md },
    message: {},
});
