import { getSetting, setSetting } from '@/db/database';
import { CURRENCIES, formatMoney, getCurrencyFlag, getCurrencySymbol } from '@/utils/money';
import { enUS, pl as plDate, type Locale } from 'date-fns/locale';
import * as Localization from 'expo-localization';
import { useSQLiteContext } from 'expo-sqlite';
import { I18n } from 'i18n-js';
import React, { createContext, useContext, useMemo, useState } from 'react';
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

export const LocalizationProvider = ({ children }: { children: React.ReactNode }) => {
    const db = useSQLiteContext();

    const [locale, setLocaleState] = useState(() => getSetting(db, 'locale') ?? deviceLocale());
    // null = follow the language default until the user picks a currency explicitly.
    const [storedCurrency, setStoredCurrency] = useState(() => getSetting(db, 'currency'));

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
            setSetting(db, 'locale', next);
        },
        setCurrencyCode: (code: string) => {
            setStoredCurrency(code);
            setSetting(db, 'currency', code);
        },
        languages: LANGUAGES,
        currencies: CURRENCIES,
        getCurrencySymbol,
        getCurrencyFlag,
        formatMoney: (amount, code) => formatMoney(amount, code || currencyCode),
    }), [db, locale, currencyCode]);

    return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
};
