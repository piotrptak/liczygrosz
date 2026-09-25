import Text from '@/components/ui/Text';
import { layout, radius, space, useTheme } from '@/constants/theme';
import { useLocalization } from '@/context/LocalizationContext';
import { ChartColumn, RefreshCw, ShieldCheck, type LucideIcon } from '@/components/ui/icons';
import React from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Shared frame for sign-in and password screens: brand panel on desktop, single column on phones. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const { colors } = useTheme();
    const { t, locale, setLocale, languages } = useLocalization();
    const { width } = useWindowDimensions();
    const desktop = width >= layout.desktop;

    const languageSwitch = (
        <View style={styles.langRow}>
            {languages.map(l => {
                const active = locale === l.code;
                return (
                    <Pressable
                        key={l.code}
                        onPress={() => setLocale(l.code)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={l.name}
                        style={[styles.langButton, { backgroundColor: active ? colors.surfaceMuted : 'transparent' }]}
                    >
                        <Text variant="label" tone={active ? 'default' : 'muted'}>{l.flag} {l.code.toUpperCase()}</Text>
                    </Pressable>
                );
            })}
        </View>
    );

    const form = (
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            {languageSwitch}
            <View style={styles.form}>
                {!desktop && (
                    <View style={styles.mobileBrand}>
                        <Image source={require('../../assets/images/liczygrosz-icon.png')} style={styles.logo} accessibilityIgnoresInvertColors />
                        <Text variant="title">LiczyGrosz</Text>
                        <Text variant="body" tone="muted" align="center">{t('login_subtitle')}</Text>
                    </View>
                )}
                {children}
            </View>
        </ScrollView>
    );

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: desktop ? colors.surface : colors.background }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.row}>
                {desktop && (
                    <View style={[styles.brand, { backgroundColor: colors.primary }]}>
                        <View style={styles.brandTop}>
                            <Image source={require('../../assets/images/liczygrosz-icon.png')} style={styles.brandLogo} accessibilityIgnoresInvertColors />
                            <Text variant="heading" style={styles.white}>LiczyGrosz</Text>
                        </View>
                        <View style={{ gap: space.xxl }}>
                            <Text variant="display" style={[styles.white, { maxWidth: 420 }]}>{t('brand_headline')}</Text>
                            <Feature icon={RefreshCw} text={t('feature_sync')} />
                            <Feature icon={ChartColumn} text={t('feature_stats')} />
                            <Feature icon={ShieldCheck} text={t('feature_private')} />
                        </View>
                        <Text variant="caption" style={styles.whiteMuted}>© LiczyGrosz</Text>
                    </View>
                )}
                <View style={{ flex: 1 }}>{form}</View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function Feature({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
    return (
        <View style={styles.feature}>
            <View style={styles.featureIcon}><Icon size={18} color="#FFFFFF" strokeWidth={2.2} /></View>
            <Text variant="body" style={[styles.white, { flex: 1 }]}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    row: { flex: 1, flexDirection: 'row' },
    brand: { width: '44%', maxWidth: 560, padding: 48, justifyContent: 'space-between' },
    brandTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    brandLogo: { width: 40, height: 40, borderRadius: radius.md },
    white: { color: '#FFFFFF' },
    whiteMuted: { color: 'rgba(255,255,255,0.9)' },
    feature: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    featureIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
    formScroll: { flexGrow: 1, padding: space.xl },
    langRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.xs },
    langButton: { paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.sm },
    form: { flex: 1, width: '100%', maxWidth: 400, alignSelf: 'center', justifyContent: 'center', gap: space.xl, paddingVertical: space.xxl },
    mobileBrand: { alignItems: 'center', gap: space.sm },
    logo: { width: 72, height: 72, borderRadius: radius.xl, marginBottom: space.xs },
});
