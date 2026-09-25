import { radius, space, useTheme } from '@/constants/theme';
import { setFeedbackHandlers } from '@/utils/dialogs';
import { CircleAlert, CircleCheck, Info, type LucideIcon } from '@/components/ui/icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from './Button';
import Text from './Text';

type ToastTone = 'success' | 'error' | 'info';
type Toast = { id: number; tone: ToastTone; title: string; message?: string };
type Confirm = { title: string; message: string; confirmLabel: string; cancelLabel: string; resolve: (ok: boolean) => void };

/**
 * In-app confirmations and toasts (browser alert/confirm look out of place).
 * Mounted once at the root; utils/dialogs.ts talks to it.
 */
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [toast, setToast] = useState<Toast | null>(null);
    const [confirm, setConfirm] = useState<Confirm | null>(null);
    const opacity = useRef(new Animated.Value(0)).current;
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((tone: ToastTone, title: string, message?: string) => {
        if (timer.current) clearTimeout(timer.current);
        setToast({ id: Date.now(), tone, title, message });
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
        timer.current = setTimeout(() => {
            Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null));
        }, tone === 'error' ? 5000 : 3000);
    }, [opacity]);

    useEffect(() => {
        setFeedbackHandlers({
            toast: showToast,
            confirm: (title, message, confirmLabel, cancelLabel) =>
                new Promise<boolean>(resolve => setConfirm({ title, message, confirmLabel, cancelLabel, resolve })),
        });
    }, [showToast]);

    const closeConfirm = (ok: boolean) => {
        confirm?.resolve(ok);
        setConfirm(null);
    };

    const toneStyle: Record<ToastTone, { icon: LucideIcon; color: string }> = {
        success: { icon: CircleCheck, color: colors.income },
        error: { icon: CircleAlert, color: colors.expense },
        info: { icon: Info, color: colors.primaryText },
    };

    return (
        <>
            {children}

            {toast && (
                <Animated.View
                    pointerEvents="box-none"
                    style={[styles.toastWrap, { top: insets.top + space.md, opacity }]}
                >
                    <View
                        accessibilityRole="alert"
                        accessibilityLiveRegion="polite"
                        style={[styles.toast, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: '#000' }]}
                    >
                        {React.createElement(toneStyle[toast.tone].icon, { size: 20, color: toneStyle[toast.tone].color, strokeWidth: 2.2 })}
                        <View style={{ flex: 1, gap: 2 }}>
                            <Text variant="bodyStrong">{toast.title}</Text>
                            {toast.message && <Text variant="caption" tone="secondary">{toast.message}</Text>}
                        </View>
                    </View>
                </Animated.View>
            )}

            <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => closeConfirm(false)}>
                <View style={styles.center}>
                    <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={() => closeConfirm(false)} accessibilityLabel={confirm?.cancelLabel} />
                    <View accessibilityViewIsModal accessibilityRole="alert" style={[styles.dialog, { backgroundColor: colors.surface }]}>
                        <View style={[styles.dialogIcon, { backgroundColor: colors.expenseSoft }]}>
                            <CircleAlert size={22} color={colors.expense} />
                        </View>
                        <Text variant="heading">{confirm?.title}</Text>
                        <Text variant="body" tone="secondary">{confirm?.message}</Text>
                        <View style={styles.actions}>
                            <Button label={confirm?.cancelLabel ?? ''} variant="secondary" onPress={() => closeConfirm(false)} style={{ flex: 1 }} />
                            <Button label={confirm?.confirmLabel ?? ''} variant="danger" onPress={() => closeConfirm(true)} style={{ flex: 1 }} />
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: space.lg, zIndex: 1000 },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        width: '100%',
        maxWidth: 440,
        padding: space.lg,
        borderRadius: radius.lg,
        borderWidth: 1,
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl },
    dialog: { width: '100%', maxWidth: 400, borderRadius: radius.xl, padding: space.xxl, gap: space.sm },
    dialogIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs },
    actions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
});

