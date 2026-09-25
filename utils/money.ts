export const CURRENCIES = [
    { code: 'PLN', symbol: 'zł', flag: '🇵🇱' },
    { code: 'EUR', symbol: '€', flag: '🇪🇺' },
    { code: 'USD', symbol: '$', flag: '🇺🇸' },
];

export const getCurrencySymbol = (code: string) =>
    CURRENCIES.find(c => c.code === code)?.symbol ?? code;

export const getCurrencyFlag = (code: string) =>
    CURRENCIES.find(c => c.code === code)?.flag ?? '💱';

// PLN puts the symbol after the amount ("12.50 zł"), the others before it ("€12.50").
export const formatMoney = (amount: number, code: string) => {
    const sign = amount < 0 ? '-' : '';
    const value = Math.abs(amount).toFixed(2);
    return code === 'PLN' ? `${sign}${value} zł` : `${sign}${getCurrencySymbol(code)}${value}`;
};

export const parseAmount = (input: string) => parseFloat(input.replace(',', '.').replace(/\s/g, ''));
