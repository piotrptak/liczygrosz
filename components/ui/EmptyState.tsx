import { radius, space, useTheme } from '@/constants/theme';
import type { LucideIcon } from '@/components/ui/icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Button from './Button';
import Text from './Text';

type Props = {
    icon: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    actionIcon?: LucideIcon;
    onAction?: () => void;
    tone?: 'default' | 'error';
};

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionIcon, onAction, tone = 'default' }: Props) {
    const { colors } = useTheme();
    return (
        <View style={styles.container}>
            <View style={[styles.icon, { backgroundColor: tone === 'error' ? colors.expenseSoft : colors.primarySoft }]}>
                <Icon size={26} color={tone === 'error' ? colors.expense : colors.primaryText} strokeWidth={1.8} />
            </View>
            <Text variant="heading" align="center">{title}</Text>
            {description && <Text variant="body" tone="muted" align="center" style={styles.description}>{description}</Text>}
            {actionLabel && onAction && (
                <Button label={actionLabel} icon={actionIcon} onPress={onAction} variant="secondary" style={{ marginTop: space.sm }} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', paddingVertical: space.xxxl, paddingHorizontal: space.xxl, gap: space.sm },
    icon: { width: 56, height: 56, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs },
    description: { maxWidth: 320 },
});
