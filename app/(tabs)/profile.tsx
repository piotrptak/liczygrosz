import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLocalization } from '@/context/LocalizationContext';
import { confirmAction, showMessage } from '@/utils/dialogs';
import { errorKey } from '@/utils/errors';
import { exportTransactions } from '@/utils/exportCsv';
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const { user, signOut, deleteAccount } = useAuth();
    const { t, locale, setLocale, languages, countryFlag, currencyCode, setCurrencyCode, currencies } = useLocalization();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [isLangModalVisible, setLangModalVisible] = useState(false);
    const [isCurrencyModalVisible, setCurrencyModalVisible] = useState(false);

    const handleExport = async () => {
        try {
            const exported = await exportTransactions();
            if (!exported) showMessage(t('export_csv'), t('export_empty'));
        } catch (e) {
            console.error(e);
            showMessage(t('error'), t(errorKey(e)));
        }
    };

    const handleDeleteAccount = () => {
        confirmAction(t('delete_account_title'), t('delete_account_message'), t('delete_account'), t('cancel'), async () => {
            try {
                await deleteAccount();
            } catch (e) {
                showMessage(t('error'), t(errorKey(e)));
            }
        });
    };

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
        <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.heroSection}>
                    <Image source={require('../../assets/images/liczygrosz-icon.png')} style={styles.avatar} />
                    <View style={{ flexShrink: 1 }}>
                        <Text style={[styles.name, { color: colors.text }]}>LiczyGrosz</Text>
                        <Text style={[styles.email, { color: colors.textSecondary }]} numberOfLines={1}>{user?.email}</Text>
                    </View>
                </View>

                {/* Data Management Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{t('data')}</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        {renderSettingItem('list-circle', t('categories_title'), () => router.push('/categories/manage'))}
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        {renderSettingItem('repeat', t('recurring'), () => router.push('/recurring/manage'))}
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        {renderSettingItem('download-outline', t('export_csv'), handleExport)}
                    </View>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{t('preferences')}</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        {renderSettingItem(
                            'language',
                            t('language'),
                            () => setLangModalVisible(true),
                            `${countryFlag} ${languages.find(l => l.code === locale)?.name}`,
                            '#FF9500'
                        )}

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        {renderSettingItem(
                            'wallet',
                            t('default_currency'),
                            () => setCurrencyModalVisible(true),
                            `${currencyCode}`,
                            colors.moneyIncome
                        )}
                    </View>
                </View>

                {/* Account */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{t('account')}</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        {renderSettingItem('log-out-outline', t('sign_out'), signOut, undefined, colors.textSecondary)}
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        {renderSettingItem('trash-outline', t('delete_account'), handleDeleteAccount, undefined, colors.error)}
                    </View>
                </View>

                <Text style={[styles.info, { color: colors.textSecondary }]}>{t('sync_info')}</Text>
                <Text style={[styles.version, { color: colors.textSecondary }]}>
                    {t('version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
                </Text>
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
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('select_language')}</Text>
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
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('select_currency')}</Text>
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
                                        {item.flag} {item.code}
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
        </SafeAreaView>
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
        paddingHorizontal: 4,
        paddingTop: 24,
        paddingBottom: 32,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 18,
        marginRight: 20,
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
        width: '100%',
        maxWidth: 640,
        alignSelf: 'center',
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
    info: {
        textAlign: 'center',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
        paddingHorizontal: 12,
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
        minHeight: 320,
        width: '100%',
        maxWidth: 640,
        alignSelf: 'center',
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
