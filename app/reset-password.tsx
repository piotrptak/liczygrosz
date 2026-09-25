import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLocalization } from '@/context/LocalizationContext';
import { errorKey } from '@/utils/errors';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MIN_PASSWORD = 8;

// Shown after opening the password reset link from the e-mail.
export default function ResetPasswordScreen() {
    const { updatePassword, signOut } = useAuth();
    const { t } = useLocalization();
    const colors = Colors[useColorScheme() ?? 'light'];

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
        } catch (e) {
            setError(t(errorKey(e, 'error_generic')));
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={styles.container}>
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.title, { color: colors.text }]}>{t('set_new_password')}</Text>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('new_password')}</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete="new-password"
                        textContentType="newPassword"
                        onSubmitEditing={submit}
                    />
                    <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('auth_password_min', { count: MIN_PASSWORD })}</Text>
                    {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
                    <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={submit} disabled={busy}>
                        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('save')}</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={signOut} style={styles.link}>
                        <Text style={{ color: colors.textSecondary }}>{t('cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24, width: '100%', maxWidth: 440, alignSelf: 'center' },
    card: { borderRadius: 24, padding: 20 },
    title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 14 },
    hint: { fontSize: 12, marginTop: -8, marginBottom: 14 },
    error: { fontSize: 14, marginBottom: 12, textAlign: 'center' },
    button: { height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
    link: { alignItems: 'center', paddingVertical: 14 },
});
