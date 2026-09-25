import { useColorScheme } from '@/components/useColorScheme';

// Design tokens. Every screen and component takes colors, spacing, radii and type from here.

const light = {
    background: '#F5F6F8',
    surface: '#FFFFFF',
    surfaceMuted: '#F0F2F5',
    surfaceHover: '#E9ECF1',
    border: '#E3E6EB',
    borderStrong: '#CDD2DA',

    text: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#646B78',
    textInverse: '#FFFFFF',

    primary: '#4F46E5',
    primaryPressed: '#4338CA',
    primarySoft: '#EEF0FF',
    primaryText: '#4338CA',
    onPrimary: '#FFFFFF',

    income: '#047857',
    incomeSoft: '#E7F7EF',
    expense: '#C0262D',
    expenseSoft: '#FDECEC',
    /** Solid destructive buttons (white text). */
    danger: '#C0262D',
    warning: '#B45309',
    warningSoft: '#FEF3E2',

    focus: '#4F46E5',
    overlay: 'rgba(17, 24, 39, 0.45)',
    shadow: 'rgba(17, 24, 39, 0.08)',
    chartBar: '#A5B4FC',
    chartBarActive: '#4F46E5',
    chartGrid: '#EDEFF3',
};

export type ThemeColors = typeof light;

const dark: ThemeColors = {
    background: '#0B0D12',
    surface: '#151821',
    surfaceMuted: '#1C2029',
    surfaceHover: '#232834',
    border: '#262B36',
    borderStrong: '#363C4A',

    text: '#F3F4F6',
    textSecondary: '#C3C8D2',
    textMuted: '#9AA3B2',
    textInverse: '#0B0D12',

    primary: '#5558E8',
    primaryPressed: '#4B4ED8',
    primarySoft: '#23244A',
    primaryText: '#A5B4FC',
    onPrimary: '#FFFFFF',

    income: '#4ADE9A',
    incomeSoft: '#12291F',
    expense: '#F8847D',
    expenseSoft: '#351719',
    danger: '#D92D20',
    warning: '#F5B454',
    warningSoft: '#33260F',

    focus: '#A5B4FC',
    overlay: 'rgba(0, 0, 0, 0.6)',
    shadow: 'rgba(0, 0, 0, 0.4)',
    chartBar: '#3F4494',
    chartBarActive: '#818CF8',
    chartGrid: '#222733',
};

export const palette = { light, dark };

/** 4 px rhythm. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 999 } as const;

export const fonts = {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
} as const;

export const type = {
    display: { fontSize: 34, lineHeight: 40, fontFamily: fonts.bold, letterSpacing: -0.8 },
    title: { fontSize: 24, lineHeight: 30, fontFamily: fonts.bold, letterSpacing: -0.4 },
    heading: { fontSize: 17, lineHeight: 24, fontFamily: fonts.semibold, letterSpacing: -0.1 },
    body: { fontSize: 15, lineHeight: 22, fontFamily: fonts.regular },
    bodyStrong: { fontSize: 15, lineHeight: 22, fontFamily: fonts.semibold },
    label: { fontSize: 13, lineHeight: 18, fontFamily: fonts.medium },
    caption: { fontSize: 12, lineHeight: 16, fontFamily: fonts.regular },
    overline: { fontSize: 11, lineHeight: 14, fontFamily: fonts.semibold, letterSpacing: 0.8, textTransform: 'uppercase' as const },
} as const;

export type TypeVariant = keyof typeof type;

/** Content width on large screens and the width at which the layout switches to desktop. */
export const layout = { maxWidth: 1120, formWidth: 560, desktop: 960 } as const;

export const useTheme = () => {
    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    return { colors: palette[scheme], scheme } as const;
};

/** Soft elevation that reads in both themes. */
export const elevation = (colors: ThemeColors) => ({
    shadowColor: '#000',
    shadowOpacity: colors === dark ? 0.4 : 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
});
