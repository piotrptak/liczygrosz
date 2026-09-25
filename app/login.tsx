import AuthLayout from '@/components/feature/AuthLayout';
import Button from '@/components/ui/Button';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import { radius, space, useTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLocalization } from '@/context/LocalizationContext';
import { errorKey } from '@/utils/errors';
import { ArrowLeft, CircleAlert, CircleCheck, Lock, LogIn, Mail, Send, UserPlus } from '@/components/ui/icons';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

type Mode = 'signIn' | 'signUp' | 'reset';

const MIN_PASSWORD = 8;

export default function LoginScreen() {
    const { signIn, signUp, sendPasswordReset } = useAuth();
    const { t } = useLocalization();

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

    const { colors } = useTheme();
    const subtitle = mode === 'signIn' ? t('sign_in_subtitle') : mode === 'signUp' ? t('sign_up_subtitle') : t('reset_subtitle');
    const actionIcon = mode === 'signIn' ? LogIn : mode === 'signUp' ? UserPlus : Send;

    return (
        <AuthLayout>
            <View style={{ gap: space.xs }}>
                <Text variant="title" accessibilityRole="header">{title}</Text>
                <Text variant="body" tone="muted">{subtitle}</Text>
            </View>

            {error && (
                <View style={[styles.banner, { backgroundColor: colors.expenseSoft }]} accessibilityRole="alert">
                    <CircleAlert size={18} color={colors.expense} />
                    <Text variant="label" tone="expense" style={{ flex: 1 }}>{error}</Text>
                </View>
            )}
            {info && (
                <View style={[styles.banner, { backgroundColor: colors.incomeSoft }]} accessibilityRole="alert">
                    <CircleCheck size={18} color={colors.income} />
                    <Text variant="label" tone="income" style={{ flex: 1 }}>{info}</Text>
                </View>
            )}

            <View style={{ gap: space.lg }}>
                <TextField
                    label={t('email')}
                    icon={Mail}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="jan@example.com"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    inputMode="email"
                    textContentType="emailAddress"
                    onSubmitEditing={mode === 'reset' ? submit : undefined}
                />
                {mode !== 'reset' && (
                    <TextField
                        label={t('password')}
                        icon={Lock}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        revealable
                        autoCapitalize="none"
                        autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                        textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
                        hint={mode === 'signUp' ? t('auth_password_min', { count: MIN_PASSWORD }) : undefined}
                        onSubmitEditing={submit}
                        returnKeyType="go"
                    />
                )}
                {mode === 'signIn' && (
                    <Button label={t('forgot_password')} variant="ghost" size="sm" onPress={() => switchMode('reset')} style={styles.forgot} />
                )}
            </View>

            <Button label={action} icon={actionIcon} size="lg" onPress={submit} loading={busy} fullWidth />

            <View style={[styles.switcher, { borderTopColor: colors.border }]}>
                {mode === 'reset' ? (
                    <Button label={t('back_to_sign_in')} icon={ArrowLeft} variant="ghost" onPress={() => switchMode('signIn')} />
                ) : (
                    <>
                        <Text variant="body" tone="muted">{mode === 'signIn' ? t('no_account') : t('have_account')}</Text>
                        <Button
                            label={mode === 'signIn' ? t('sign_up') : t('sign_in')}
                            variant="ghost"
                            size="sm"
                            onPress={() => switchMode(mode === 'signIn' ? 'signUp' : 'signIn')}
                        />
                    </>
                )}
            </View>
        </AuthLayout>
    );
}

const styles = StyleSheet.create({
    banner: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, padding: space.md, borderRadius: radius.md },
    forgot: { alignSelf: 'flex-end', marginTop: -space.sm, marginRight: -space.md },
    switcher: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, paddingTop: space.lg, borderTopWidth: StyleSheet.hairlineWidth },
});
