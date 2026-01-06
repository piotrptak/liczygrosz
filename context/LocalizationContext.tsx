import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import en from '../locales/en';
import pl from '../locales/pl';

export const CURRENCIES = [
    { code: 'USD', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', flag: '🇪🇺' },
    { code: 'PLN', symbol: 'zł', flag: '🇵🇱' }
];

const i18n = new I18n({ en, pl });
i18n.enableFallback = true;
i18n.locale = Localization.getLocales()[0].languageCode ?? 'en';

import { enUS, pl as plDate } from 'date-fns/locale';

export const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' }
];

// ... existing imports

type LocalizationContextType = {
    t: (key: string, options?: any) => string;
    locale: string;
    currency: string;
    currencyCode: string;
    countryFlag: string;
    dateLocale: any;
    setLocale: (locale: string) => void;
    setCurrencyCode: (code: string) => void;
    languages: typeof LANGUAGES;
    currencies: typeof CURRENCIES;
    getCurrencySymbol: (code: string) => string;
    getCurrencyFlag: (code: string) => string;
};

const LocalizationContext = createContext<LocalizationContextType>({
    t: (key, options) => i18n.t(key, options),
    locale: 'en',
    currency: '$', // keeping as default code now, or symbol? Let's check usage. 
    // Wait, original `currency` was symbol. The user wants "default currency depend on language".
    // I should probably switch `currency` to be the "Active Currency Code" or just keep it as symbol for backward compatibility 
    // but the request implies per-transaction currency. 
    // The context `currency` seems to be the "Default App Currency". 
    // I will treat `currency` in context as the "Preferred/Default Currency Code" moving forward, 
    // BUT checking previous usage it was used as a symbol. 
    // REQUIRED CHANGE: The previous usage `currency` was returning '$' or 'zł'.
    // I will keep `currency` as the SYMBOL for simple display, but adds `defaultCurrencyCode`.
    // Actually, let's look at `setCurrency` in provider.
    currencyCode: 'USD',
    countryFlag: '🇺🇸',
    dateLocale: enUS,
    setLocale: () => { },
    setCurrencyCode: () => { },
    languages: LANGUAGES,
    currencies: CURRENCIES,
    getCurrencySymbol: () => '$',
    getCurrencyFlag: () => '🇺🇸',
});

export const useLocalization = () => useContext(LocalizationContext);

export const LocalizationProvider = ({ children }: { children: React.ReactNode }) => {
    const [locale, setLocale] = useState(i18n.locale);
    const [currency, setCurrency] = useState('$');
    const [currencyCode, setCurrencyCode] = useState('USD');
    const [countryFlag, setCountryFlag] = useState('🇺🇸');
    const [dateLocale, setDateLocale] = useState<any>(enUS);

    useEffect(() => {
        i18n.locale = locale;
        // Check if user has explicitly set a currency? For now, we update if natural switch, 
        // but if we want strictly "default varies by language UNLESS overridden", we need more state.
        // For simplicity: When language changes, we update the currency code to the language default,
        // effectively resetting it. The user can then change it back if they want a mismatch.
        // This satisfies "by default currency should be set according to the language".

        const newCode = locale === 'pl' ? 'PLN' : (locale === 'en' ? 'USD' : 'EUR');
        setCurrencyCode(newCode);
        setCurrency(CURRENCIES.find(c => c.code === newCode)?.symbol || '$');

        setCountryFlag(locale === 'pl' ? '🇵🇱' : '🇺🇸');
        setDateLocale(locale === 'pl' ? plDate : enUS);
    }, [locale]);

    // Watch currencyCode changes to update symbol if changed manually
    useEffect(() => {
        setCurrency(CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$');
    }, [currencyCode]);

    const t = (key: string, options?: any) => i18n.t(key, options);

    const getCurrencySymbol = (code: string) => {
        return CURRENCIES.find(c => c.code === code)?.symbol || code;
    }

    const getCurrencyFlag = (code: string) => {
        return CURRENCIES.find(c => c.code === code)?.flag || '🇺🇸';
    }

    return (
        <LocalizationContext.Provider value={{ t, locale, currency, currencyCode, countryFlag, dateLocale, setLocale, setCurrencyCode, languages: LANGUAGES, currencies: CURRENCIES, getCurrencySymbol, getCurrencyFlag }}>
            {children}
        </LocalizationContext.Provider>
    );
};
