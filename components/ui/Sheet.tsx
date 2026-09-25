import { layout, radius, space, useTheme } from '@/constants/theme';
import { X } from '@/components/ui/icons';
import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconButton from './IconButton';
import Text from './Text';

type Props = {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
};

/** Bottom sheet on phones, centered dialog on wide screens. */
export default function Sheet({ visible, onClose, title, children, footer }: Props) {
    const { colors } = useTheme();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const wide = width >= 700;

    return (
        <Modal visible={visible} transparent animationType={wide ? 'fade' : 'slide'} onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.overlay, wide && styles.center]}>
                <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={onClose} accessibilityLabel="Close" />
                <View
                    accessibilityViewIsModal
                    style={[
                        styles.panel,
                        { backgroundColor: colors.surface },
                        wide ? styles.dialog : [styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }],
                    ]}
                >
                    {!wide && <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />}
                    <View style={styles.header}>
                        <Text variant="heading" style={{ flex: 1 }} accessibilityRole="header">{title}</Text>
                        <IconButton icon={X} label="Close" onPress={onClose} size={36} />
                    </View>
                    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">{children}</ScrollView>
                    {footer && <View style={[styles.footer, { borderTopColor: colors.border }]}>{footer}</View>}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    center: { justifyContent: 'center', alignItems: 'center', padding: space.xxl },
    panel: { maxHeight: '90%' },
    sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
    dialog: { width: '100%', maxWidth: layout.formWidth, borderRadius: radius.xl },
    handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginTop: space.sm },
    header: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.xl, paddingRight: space.md, paddingTop: space.md, paddingBottom: space.xs },
    body: { paddingHorizontal: space.xl, paddingBottom: space.xl, paddingTop: space.sm, gap: space.lg },
    footer: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.xl, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth },
});
