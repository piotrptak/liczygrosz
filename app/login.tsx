import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLocalization } from '@/context/LocalizationContext';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const { signIn, isLoading, error } = useAuth();
    const { t } = useLocalization();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const handleLogin = async () => {
        try {
            await signIn();
            // Navigation will happen automatically when user state changes
        } catch (err: any) {
            // Error is handled in AuthContext
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Image
                    source={require('../assets/images/liczygrosz-icon.png')}
                    style={{ width: 120, height: 120, marginBottom: 20, borderRadius: 20 }}
                />
                <Text style={[styles.title, { color: colors.text }]}>LiczyGrosz</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('login_subtitle')}</Text>
            </View>

            <View style={styles.form}>
                {/* Error Message */}
                {error && (
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                )}

                {/* Universal Login Button */}
                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <FontAwesome name="sign-in" size={20} color="#fff" style={{ marginRight: 12 }} />
                            <Text style={styles.primaryButtonText}>
                                Sign In / Sign Up
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Secure authentication powered by Auth0
                </Text>
                <Text style={[styles.infoTextSmall, { color: colors.textSecondary }]}>
                    You can create an account or log in on the next screen
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        fontFamily: 'SpaceMono',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    errorText: {
        fontSize: 14,
        marginBottom: 12,
        textAlign: 'center',
    },
    primaryButton: {
        borderRadius: 16,
        height: 56,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'SpaceMono',
    },
    infoText: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 8,
    },
    infoTextSmall: {
        fontSize: 11,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
