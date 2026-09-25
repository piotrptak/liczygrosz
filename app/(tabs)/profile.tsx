import Card from '@/components/ui/Card';
import ListRow from '@/components/ui/ListRow';
import Screen from '@/components/ui/Screen';
import Sheet from '@/components/ui/Sheet';
import Text from '@/components/ui/Text';
import { layout, radius, space, useTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLocalization } from '@/context/LocalizationContext';
import { confirmAction, showMessage, showSuccess } from '@/utils/dialogs';
import { errorKey } from '@/utils/errors';
import { exportTransactions } from '@/utils/exportCsv';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Check, Coins, Download, Languages, LogOut, Repeat, Tags, Trash2 } from '@/components/ui/icons';
import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function ProfileScreen() {
    const { user, signOut, deleteAccount } = useAuth();
    const { t, locale, setLocale, languages, currencyCode, setCurrencyCode, currencies } = useLocalization();
    const router = useRouter();
    const { colors } = useTheme();

    const [sheet, setSheet] = useState<'language' | 'currency' | null>(null);
    const [exporting, setExporting] = useState(false);

    const email = user?.email ?? '';
    const language = languages.find(l => l.code === locale);

    const handleExport = async () => {
        setExporting(true);
        try {
            const exported = await exportTransactions();
            if (exported) showSuccess(t('export_done'));
            else showMessage(t('export_csv'), t('export_empty'));
        } catch (e) {
            showMessage(t('error'), t(errorKey(e)));
        } finally {
            setExporting(false);
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

    const option = (key: string, label: string, active: boolean, onPress: () => void, leading: string) => (
        <ListRow
            key={key}
            leading={<Text variant="heading" style={{ width: 28, textAlign: 'center' }}>{leading}</Text>}
            title={label}
            onPress={onPress}
            chevron={false}
            trailing={active ? <Check size={20} color={colors.primaryText} strokeWidth={2.6} /> : undefined}
        />
    );

    return (
        <Screen title={t('profile')} width={layout.formWidth + 80}>
            <Card style={styles.account}>
                <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
                    <Text variant="title" tone="primary">{email.charAt(0).toUpperCase() || '?'}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="heading" numberOfLines={1}>{email}</Text>
                    <Text variant="caption" tone="muted">{t('sync_info')}</Text>
                </View>
            </Card>

            <Section title={t('data')}>
                <ListRow icon={Tags} title={t('categories_title')} onPress={() => router.push('/categories/manage')} />
                <ListRow icon={Repeat} title={t('recurring')} onPress={() => router.push('/recurring/manage')} divider />
                <ListRow icon={Download} title={t('export_csv')} subtitle={exporting ? t('exporting') : t('export_hint')} onPress={handleExport} divider />
            </Section>

            <Section title={t('preferences')}>
                <ListRow icon={Languages} title={t('language')} value={`${language?.flag} ${language?.name}`} onPress={() => setSheet('language')} />
                <ListRow icon={Coins} title={t('default_currency')} value={currencyCode} onPress={() => setSheet('currency')} divider />
            </Section>

            <Section title={t('account')}>
                <ListRow icon={LogOut} title={t('sign_out')} onPress={signOut} chevron={false} />
                <ListRow icon={Trash2} title={t('delete_account')} onPress={handleDeleteAccount} destructive chevron={false} divider />
            </Section>

            <View style={styles.footer}>
                <Image source={require('../../assets/images/liczygrosz-icon.png')} style={styles.logo} accessibilityIgnoresInvertColors />
                <Text variant="caption" tone="muted">LiczyGrosz · {t('version', { version: Constants.expoConfig?.version ?? '1.0.0' })}</Text>
            </View>

            <Sheet visible={sheet === 'language'} onClose={() => setSheet(null)} title={t('select_language')}>
                <Card padded={false}>
                    {languages.map(l => option(l.code, l.name, l.code === locale, () => { setLocale(l.code); setSheet(null); }, l.flag))}
                </Card>
            </Sheet>
            <Sheet visible={sheet === 'currency'} onClose={() => setSheet(null)} title={t('select_currency')}>
                <Text variant="caption" tone="muted">{t('currency_hint')}</Text>
                <Card padded={false}>
                    {currencies.map(c => option(c.code, `${c.code} · ${c.symbol}`, c.code === currencyCode, () => { setCurrencyCode(c.code); setSheet(null); }, c.flag))}
                </Card>
            </Sheet>
        </Screen>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={{ gap: space.sm }}>
            <Text variant="overline" tone="muted" style={{ marginLeft: space.xs }}>{title}</Text>
            <Card padded={false}>{children}</Card>
        </View>
    );
}

const styles = StyleSheet.create({
    account: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
    avatar: { width: 56, height: 56, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
    footer: { alignItems: 'center', gap: space.sm, paddingTop: space.lg },
    logo: { width: 40, height: 40, borderRadius: radius.md },
});
