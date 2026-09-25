export const CURRENCIES = [
    { code: 'PLN', symbol: 'zł', flag: '🇵🇱' },
    { code: 'EUR', symbol: '€', flag: '🇪🇺' },
    { code: 'USD', symbol: '$', flag: '🇺🇸' },
];

export const getCurrencySymbol = (code: string) =>
    CURRENCIES.find(c => c.code === code)?.symbol ?? code;

export const getCurrencyFlag = (code: string) =>
    CURRENCIES.find(c => c.code === code)?.flag ?? '💱';

const formatters = new Map<string, Intl.NumberFormat>();

// Locale-aware digits ("6 858,62" in Polish, "6,858.62" in English); PLN puts the symbol after the amount.
export const formatMoney = (amount: number, code: string, locale = 'pl') => {
    const tag = locale === 'pl' ? 'pl-PL' : 'en-GB';
    if (!formatters.has(tag)) formatters.set(tag, new Intl.NumberFormat(tag, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    const sign = amount < 0 ? '−' : '';
    const value = formatters.get(tag)!.format(Math.abs(amount));
    return code === 'PLN' ? `${sign}${value} zł` : `${sign}${getCurrencySymbol(code)}${value}`;
};

/** Amount as the user would type it back into an input. */
export const formatAmountInput = (amount: number, locale = 'pl') =>
    locale === 'pl' ? amount.toFixed(2).replace('.', ',') : amount.toFixed(2);

export const parseAmount = (input: string) => parseFloat(input.replace(',', '.').replace(/\s/g, ''));
