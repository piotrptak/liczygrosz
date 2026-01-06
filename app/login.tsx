import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLocalization } from '@/context/LocalizationContext';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const { signIn } = useAuth();
    const { t } = useLocalization();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const handleLogin = async (provider: 'google' | 'facebook' | 'instagram') => {
        await signIn(provider);
        router.replace('/(tabs)');
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

            <View style={styles.buttons}>
                <TouchableOpacity
                    style={[styles.button, styles.googleButton]}
                    onPress={() => handleLogin('google')}
                >
                    <FontAwesome name="google" size={24} color="#DB4437" style={styles.icon} />
                    <Text style={styles.buttonText}>{t('login_google')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.facebookButton]}
                    onPress={() => handleLogin('facebook')}
                >
                    <FontAwesome name="facebook" size={24} color="#4267B2" style={styles.icon} />
                    <Text style={[styles.buttonText, { color: '#4267B2' }]}>{t('login_facebook')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.instaButton]}
                    onPress={() => handleLogin('instagram')}
                >
                    <FontAwesome name="instagram" size={24} color="#C13584" style={styles.icon} />
                    <Text style={[styles.buttonText, { color: '#C13584' }]}>{t('login_instagram')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 60,
        alignItems: 'center',
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold', // Should be Serif in real Hinge, but system bold is fine for now
        marginBottom: 10,
        fontFamily: 'SpaceMono', // Placeholder font
    },
    subtitle: {
        fontSize: 18,
        textAlign: 'center',
    },
    buttons: {
        gap: 16,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 30, // Pill shape
        borderWidth: 1,
        borderColor: '#E5E5E5',
        backgroundColor: '#FFFFFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    googleButton: {},
    facebookButton: {},
    instaButton: {},
    icon: {
        marginRight: 16,
        width: 30,
        textAlign: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
});
