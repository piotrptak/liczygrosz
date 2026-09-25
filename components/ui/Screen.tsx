import { layout, space, useTheme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { ArrowLeft } from '@/components/ui/icons';
import React from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconButton from './IconButton';
import Text from './Text';

type HeaderProps = {
    title: string;
    subtitle?: string;
    /** Shows a back button; falls back to this route when there is no history (e.g. opened by link). */
    backTo?: string;
    actions?: React.ReactNode;
};

export function PageHeader({ title, subtitle, backTo, actions }: HeaderProps) {
    const router = useRouter();
    return (
        <View style={styles.header}>
            {backTo && (
                <IconButton
                    icon={ArrowLeft}
                    label="Back"
                    onPress={() => (router.canGoBack() ? router.back() : router.replace(backTo as never))}
                    variant="filled"
                />
            )}
            <View style={{ flex: 1 }}>
                <Text variant="title" accessibilityRole="header" numberOfLines={1}>{title}</Text>
                {subtitle && <Text variant="label" tone="muted" numberOfLines={1}>{subtitle}</Text>}
            </View>
            {actions}
        </View>
    );
}

type ScreenProps = HeaderProps & {
    children: React.ReactNode;
    scroll?: boolean;
    width?: number;
    contentStyle?: StyleProp<ViewStyle>;
    /** Pinned below the content (e.g. a save button). */
    footer?: React.ReactNode;
    hideHeader?: boolean;
};

export default function Screen({ children, scroll = true, width = layout.maxWidth, contentStyle, footer, hideHeader, ...header }: ScreenProps) {
    const { colors } = useTheme();
    const inner = [styles.content, { maxWidth: width }, contentStyle];

    return (
        <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
            <View style={[styles.headerWrap, { maxWidth: width }]}>{!hideHeader && <PageHeader {...header} />}</View>
            {scroll ? (
                <ScrollView contentContainerStyle={[inner, styles.scrollPad]} keyboardShouldPersistTaps="handled">{children}</ScrollView>
            ) : (
                <View style={[inner, { flex: 1 }]}>{children}</View>
            )}
            {footer && (
                <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
                    <View style={[styles.footerInner, { maxWidth: width }]}>{footer}</View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    headerWrap: { width: '100%', alignSelf: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.md, minHeight: 64 },
    content: { width: '100%', alignSelf: 'center', paddingHorizontal: space.xl, gap: space.lg },
    scrollPad: { paddingBottom: space.xxxl },
    footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: space.md },
    footerInner: { width: '100%', alignSelf: 'center', paddingHorizontal: space.xl, flexDirection: 'row', gap: space.md },
});
