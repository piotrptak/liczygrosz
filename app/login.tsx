import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLocalization } from '@/context/LocalizationContext';
import { errorKey } from '@/utils/errors';
import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Mode = 'signIn' | 'signUp' | 'reset';

const MIN_PASSWORD = 8;

export default function LoginScreen() {
    const { signIn, signUp, sendPasswordReset } = useAuth();
    const { t, locale, setLocale, languages } = useLocalization();
    const colors = Colors[useColorScheme() ?? 'light'];

    const [mode, setMode] = useState<Mode>('signIn');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    const switchMode = (next: Mode) => {
        setMode(next);
        setError(null);
        setInfo(null);
    };

    const submit = async () => {
        setError(null);
        setInfo(null);
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            setError(t('auth_email_invalid'));
            return;
        }
        if (mode !== 'reset' && password.length < (mode === 'signUp' ? MIN_PASSWORD : 1)) {
            setError(t('auth_password_min', { count: MIN_PASSWORD }));
            return;
        }

        setBusy(true);
        try {
            if (mode === 'signIn') {
                await signIn(email, password);
            } else if (mode === 'signUp') {
                const needsConfirmation = await signUp(email, password);
                if (needsConfirmation) {
                    setInfo(t('auth_confirm_email_sent', { email: email.trim() }));
                    setMode('signIn');
                }
            } else {
                await sendPasswordReset(email);
                setInfo(t('auth_reset_sent', { email: email.trim() }));
            }
        } catch (e) {
            setError(t(errorKey(e, 'error_generic')));
        } finally {
            setBusy(false);
        }
    };

    const title = mode === 'signIn' ? t('sign_in') : mode === 'signUp' ? t('sign_up') : t('forgot_password');
    const action = mode === 'signIn' ? t('sign_in') : mode === 'signUp' ? t('create_account') : t('send_reset_link');

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <View style={styles.langRow}>
                        {languages.map(l => (
                            <TouchableOpacity key={l.code} onPress={() => setLocale(l.code)} style={[styles.langButton, locale === l.code && { backgroundColor: colors.secondary }]}>
                                <Text style={{ color: colors.text, fontWeight: locale === l.code ? '700' : '400' }}>{l.flag} {l.code.toUpperCase()}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.header}>
                        <Image source={require('../assets/images/liczygrosz-icon.png')} style={styles.logo} />
                        <Text style={[styles.appName, { color: colors.text }]}>LiczyGrosz</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('login_subtitle')}</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('email')}</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="jan@example.com"
                            placeholderTextColor={colors.textSecondary}
                            autoCapitalize="none"
                            autoComplete="email"
                            keyboardType="email-address"
                            inputMode="email"
                            textContentType="emailAddress"
                        />

                        {mode !== 'reset' && (
                            <>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('password')}</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                                    textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
                                    onSubmitEditing={submit}
                                    returnKeyType="go"
                                />
                                {mode === 'signUp' && (
                                    <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('auth_password_min', { count: MIN_PASSWORD })}</Text>
                                )}
                            </>
                        )}

                        {error && <Text style={[styles.message, { color: colors.error }]}>{error}</Text>}
                        {info && <Text style={[styles.message, { color: colors.success }]}>{info}</Text>}

                        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: busy ? 0.7 : 1 }]} onPress={submit} disabled={busy}>
                            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{action}</Text>}
                        </TouchableOpacity>

                        {mode === 'signIn' && (
                            <TouchableOpacity onPress={() => switchMode('reset')} style={styles.linkButton}>
                                <Text style={{ color: colors.tint }}>{t('forgot_password')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => switchMode(mode === 'signIn' ? 'signUp' : 'signIn')}
                        style={styles.linkButton}
                    >
                        <Text style={{ color: colors.textSecondary }}>
                            {mode === 'signIn' ? t('no_account') : t('have_account')}{' '}
                            <Text style={{ color: colors.tint, fontWeight: '600' }}>{mode === 'signIn' ? t('sign_up') : t('sign_in')}</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: 24, width: '100%', maxWidth: 440, alignSelf: 'center' },
    langRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 8 },
    langButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    header: { alignItems: 'center', marginBottom: 24 },
    logo: { width: 96, height: 96, borderRadius: 22, marginBottom: 16 },
    appName: { fontSize: 32, fontWeight: 'bold', fontFamily: 'SpaceMono' },
    subtitle: { fontSize: 15, textAlign: 'center', marginTop: 4 },
    card: { borderRadius: 24, padding: 20 },
    title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 14 },
    hint: { fontSize: 12, marginTop: -8, marginBottom: 14 },
    message: { fontSize: 14, marginBottom: 12, textAlign: 'center' },
    primaryButton: { height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
    primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
    linkButton: { alignItems: 'center', paddingVertical: 14 },
});
