import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLocalization } from '@/context/LocalizationContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const { signOut, user } = useAuth();
    const { t, locale, setLocale, languages, countryFlag, currencyCode, setCurrencyCode, currencies } = useLocalization();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [isLangModalVisible, setLangModalVisible] = useState(false);
    const [isCurrencyModalVisible, setCurrencyModalVisible] = useState(false);

    const renderSettingItem = (
        icon: any,
        label: string,
        onPress: () => void,
        value?: string,
        color?: string
    ) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress}>
            <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: (color || colors.tint) + '15' }]}>
                    <Ionicons name={icon} size={22} color={color || colors.tint} />
                </View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
            </View>
            <View style={styles.settingRight}>
                {value && <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{value}</Text>}
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header / Profile Hero */}
            <View style={styles.heroSection}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
                </View>
                <View>
                    <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'User'}</Text>
                    <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email || 'email@example.com'}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Data Management Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{t('settings') || 'Data'}</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        {renderSettingItem('list-circle', t('categories_title'), () => router.push('/categories/manage'))}
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        {renderSettingItem('repeat', t('recurring'), () => router.push('/recurring/manage'))}
                    </View>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Preferences</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        {renderSettingItem(
                            'language',
                            'Language',
                            () => setLangModalVisible(true),
                            `${countryFlag} ${languages.find(l => l.code === locale)?.name}`,
                            colors.secondary
                        )}

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        {renderSettingItem(
                            'wallet',
                            'Default Currency',
                            () => setCurrencyModalVisible(true),
                            `${currencyCode}`,
                            colors.moneyIncome
                        )}
                    </View>
                </View>

                {/* Account Actions */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.signOutBtn, { backgroundColor: colors.surface }]}
                        onPress={signOut}
                    >
                        <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0 (Premium)</Text>
            </ScrollView>

            {/* Language Modal */}
            <Modal
                visible={isLangModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setLangModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Language</Text>
                            <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={languages}
                            keyExtractor={item => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.langOption,
                                        { borderBottomColor: colors.border },
                                        locale === item.code && { backgroundColor: mlColor(colors.primary, 0.1) }
                                    ]}
                                    onPress={() => {
                                        setLocale(item.code);
                                        setLangModalVisible(false);
                                    }}
                                >
                                    <Text style={{ fontSize: 32, marginRight: 16 }}>{item.flag}</Text>
                                    <Text style={[styles.langText, { color: colors.text, fontWeight: locale === item.code ? 'bold' : '400' }]}>
                                        {item.name}
                                    </Text>
                                    {locale === item.code && (
                                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Currency Modal */}
            <Modal
                visible={isCurrencyModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setCurrencyModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Currency</Text>
                            <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={currencies}
                            keyExtractor={item => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.langOption,
                                        { borderBottomColor: colors.border },
                                        currencyCode === item.code && { backgroundColor: mlColor(colors.primary, 0.1) }
                                    ]}
                                    onPress={() => {
                                        setCurrencyCode(item.code);
                                        setCurrencyModalVisible(false);
                                    }}
                                >
                                    <View style={{ width: 40, alignItems: 'center', marginRight: 16 }}>
                                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>{item.symbol}</Text>
                                    </View>
                                    <Text style={[styles.langText, { color: colors.text, fontWeight: currencyCode === item.code ? 'bold' : '400' }]}>
                                        {item.code}
                                    </Text>
                                    {currencyCode === item.code && (
                                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// Helper to add alpha to hex color
const mlColor = (hex: string, alpha: number) => {
    return hex + Math.round(alpha * 255).toString(16).padStart(2, '0');
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    heroSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 40,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 12,
        marginLeft: 8,
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 17,
        fontWeight: '500',
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingValue: {
        fontSize: 15,
        marginRight: 8,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 76,
    },
    signOutBtn: {
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
    },
    signOutText: {
        fontSize: 17,
        fontWeight: '600',
    },
    version: {
        textAlign: 'center',
        marginBottom: 40,
        fontSize: 13,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 48,
        minHeight: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    langOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    langText: {
        fontSize: 18,
    }
});
