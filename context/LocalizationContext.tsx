import { useAuth } from '@/context/AuthContext';
import { fetchSettings, saveSettings } from '@/lib/api';
import { getLocalPref, setLocalPref } from '@/lib/localPrefs';
import { keys } from '@/lib/queryClient';
import { CURRENCIES, formatMoney, getCurrencyFlag, getCurrencySymbol } from '@/utils/money';
import { useQuery } from '@tanstack/react-query';
import { enUS, pl as plDate, type Locale } from 'date-fns/locale';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from '../locales/en';
import pl from '../locales/pl';

export { CURRENCIES };

export const LANGUAGES = [
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
];

const i18n = new I18n({ en, pl });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

const deviceLocale = () => (Localization.getLocales()[0]?.languageCode === 'pl' ? 'pl' : 'en');
const defaultCurrencyFor = (locale: string) => (locale === 'pl' ? 'PLN' : 'EUR');

type LocalizationContextType = {
    t: (key: string, options?: any) => string;
    locale: string;
    /** Symbol of the default currency. */
    currency: string;
    currencyCode: string;
    countryFlag: string;
    dateLocale: Locale;
    setLocale: (locale: string) => void;
    setCurrencyCode: (code: string) => void;
    languages: typeof LANGUAGES;
    currencies: typeof CURRENCIES;
    getCurrencySymbol: (code: string) => string;
    getCurrencyFlag: (code: string) => string;
    formatMoney: (amount: number, code?: string | null) => string;
};

const LocalizationContext = createContext<LocalizationContextType | null>(null);

export const useLocalization = () => {
    const ctx = useContext(LocalizationContext);
    if (!ctx) throw new Error('useLocalization must be used inside LocalizationProvider');
    return ctx;
};

// Language and default currency are stored per account (synced between devices)
// and cached on the device, so the login screen already uses the right language.
export const LocalizationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();

    const [locale, setLocaleState] = useState(() => getLocalPref('locale') ?? deviceLocale());
    // null = follow the language default until the user picks a currency explicitly.
    const [storedCurrency, setStoredCurrency] = useState(() => getLocalPref('currency'));

    const { data: settings } = useQuery({
        queryKey: keys.settings,
        queryFn: fetchSettings,
        enabled: !!user,
    });

    useEffect(() => {
        if (settings?.locale) {
            setLocaleState(settings.locale);
            setLocalPref('locale', settings.locale);
        }
        if (settings?.currency) {
            setStoredCurrency(settings.currency);
            setLocalPref('currency', settings.currency);
        }
    }, [settings]);

    const currencyCode = storedCurrency ?? defaultCurrencyFor(locale);
    i18n.locale = locale;

    const value = useMemo<LocalizationContextType>(() => ({
        t: (key, options) => i18n.t(key, options),
        locale,
        currency: getCurrencySymbol(currencyCode),
        currencyCode,
        countryFlag: LANGUAGES.find(l => l.code === locale)?.flag ?? '🇬🇧',
        dateLocale: locale === 'pl' ? plDate : enUS,
        setLocale: (next: string) => {
            setLocaleState(next);
            setLocalPref('locale', next);
            // Pin the current currency so switching language never changes how amounts are totalled.
            if (!storedCurrency) {
                setStoredCurrency(currencyCode);
                setLocalPref('currency', currencyCode);
            }
            if (user) saveSettings(user.id, { locale: next, currency: currencyCode }).catch(console.error);
        },
        setCurrencyCode: (code: string) => {
            setStoredCurrency(code);
            setLocalPref('currency', code);
            if (user) saveSettings(user.id, { currency: code }).catch(console.error);
        },
        languages: LANGUAGES,
        currencies: CURRENCIES,
        getCurrencySymbol,
        getCurrencyFlag,
        formatMoney: (amount, code) => formatMoney(amount, code || currencyCode, locale),
    }), [user, locale, currencyCode, storedCurrency]);

    return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
};
