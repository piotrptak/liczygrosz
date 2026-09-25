import AuthLayout from '@/components/feature/AuthLayout';
import Button from '@/components/ui/Button';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import { space } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLocalization } from '@/context/LocalizationContext';
import { showSuccess } from '@/utils/dialogs';
import { errorKey } from '@/utils/errors';
import { Check, Lock } from '@/components/ui/icons';
import React, { useState } from 'react';
import { View } from 'react-native';

const MIN_PASSWORD = 8;

// Shown after opening the password reset link from the e-mail.
export default function ResetPasswordScreen() {
    const { updatePassword, signOut } = useAuth();
    const { t } = useLocalization();

    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async () => {
        if (password.length < MIN_PASSWORD) {
            setError(t('auth_password_min', { count: MIN_PASSWORD }));
            return;
        }
        setBusy(true);
        setError(null);
        try {
            await updatePassword(password);
            showSuccess(t('password_changed'));
        } catch (e) {
            setError(t(errorKey(e, 'error_generic')));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthLayout>
            <View style={{ gap: space.xs }}>
                <Text variant="title" accessibilityRole="header">{t('set_new_password')}</Text>
                <Text variant="body" tone="muted">{t('set_new_password_subtitle')}</Text>
            </View>
            <TextField
                label={t('new_password')}
                icon={Lock}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(null); }}
                secureTextEntry
                revealable
                autoComplete="new-password"
                textContentType="newPassword"
                error={error}
                hint={t('auth_password_min', { count: MIN_PASSWORD })}
                onSubmitEditing={submit}
            />
            <View style={{ gap: space.sm }}>
                <Button label={t('save')} icon={Check} size="lg" onPress={submit} loading={busy} fullWidth />
                <Button label={t('cancel')} variant="ghost" onPress={signOut} fullWidth />
            </View>
        </AuthLayout>
    );
}
