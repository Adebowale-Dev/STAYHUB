import { vars } from 'nativewind';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const lightColorVars = {
    '--background': '243 246 251',
    '--surface': '255 255 255',
    '--surface-raised': '249 251 255',
    '--surface-muted': '238 243 250',
    '--surface-tint': '232 241 255',
    '--border': '230 237 247',
    '--divider': '233 238 245',
    '--foreground': '15 23 42',
    '--foreground-secondary': '102 112 133',
    '--muted': '148 163 184',
    '--primary': '12 74 140',
    '--primary-strong': '8 48 92',
    '--primary-soft': '232 241 255',
    '--success': '21 128 61',
    '--success-soft': '234 248 238',
    '--warning': '180 83 9',
    '--warning-soft': '255 244 228',
    '--danger': '185 28 28',
    '--danger-soft': '254 241 241',
    '--hero': '8 22 43',
    '--hero-glass': '255 255 255',
    '--hero-border': '255 255 255',
    '--shadow': '6 18 32',
} as const;

export const darkColorVars = {
    '--background': '8 17 29',
    '--surface': '16 28 45',
    '--surface-raised': '19 34 56',
    '--surface-muted': '13 23 37',
    '--surface-tint': '255 255 255',
    '--border': '148 163 184',
    '--divider': '148 163 184',
    '--foreground': '248 250 252',
    '--foreground-secondary': '175 192 212',
    '--muted': '140 160 184',
    '--primary': '66 165 245',
    '--primary-strong': '12 74 140',
    '--primary-soft': '47 128 237',
    '--success': '76 175 80',
    '--success-soft': '76 175 80',
    '--warning': '255 152 0',
    '--warning-soft': '255 152 0',
    '--danger': '239 68 68',
    '--danger-soft': '239 68 68',
    '--hero': '5 16 34',
    '--hero-glass': '255 255 255',
    '--hero-border': '255 255 255',
    '--shadow': '6 18 32',
} as const;

export const themeVars = {
    light: vars(lightColorVars),
    dark: vars(darkColorVars),
};

export type AppPalette = {
    pageBackground: string;
    surface: string;
    surfaceRaised: string;
    surfaceMuted: string;
    surfaceTint: string;
    border: string;
    divider: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryStrong: string;
    primarySoft: string;
    success: string;
    successSoft: string;
    warning: string;
    warningSoft: string;
    danger: string;
    dangerSoft: string;
    hero: string;
    heroGlass: string;
    heroBorder: string;
    shadow: string;
};

export function getAppPalette(isDark: boolean): AppPalette {
    return {
        pageBackground: isDark ? '#08111D' : '#F3F6FB',
        surface: isDark ? '#101C2D' : '#FFFFFF',
        surfaceRaised: isDark ? '#132238' : '#F9FBFF',
        surfaceMuted: isDark ? '#0D1725' : '#EEF3FA',
        surfaceTint: isDark ? 'rgba(255,255,255,0.06)' : '#E8F1FF',
        border: isDark ? 'rgba(148,163,184,0.16)' : '#E6EDF7',
        divider: isDark ? 'rgba(148,163,184,0.14)' : '#E9EEF5',
        textPrimary: isDark ? '#F8FAFC' : '#0F172A',
        textSecondary: isDark ? '#AFC0D4' : '#667085',
        textMuted: isDark ? '#8CA0B8' : '#94A3B8',
        primary: isDark ? '#42A5F5' : '#0C4A8C',
        primaryStrong: '#08305C',
        primarySoft: isDark ? 'rgba(47,128,237,0.18)' : '#E8F1FF',
        success: isDark ? '#4CAF50' : '#15803D',
        successSoft: isDark ? 'rgba(76,175,80,0.18)' : '#EAF8EE',
        warning: isDark ? '#FF9800' : '#B45309',
        warningSoft: isDark ? 'rgba(255,152,0,0.18)' : '#FFF4E4',
        danger: isDark ? '#EF4444' : '#B91C1C',
        dangerSoft: isDark ? 'rgba(239,68,68,0.18)' : '#FEF1F1',
        hero: isDark ? '#051022' : '#08162B',
        heroGlass: 'rgba(255,255,255,0.12)',
        heroBorder: 'rgba(255,255,255,0.18)',
        shadow: '#061220',
    };
}

export function getPaperTheme(isDark: boolean) {
    const palette = getAppPalette(isDark);
    const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

    return {
        ...baseTheme,
        dark: isDark,
        colors: {
            ...baseTheme.colors,
            primary: palette.primary,
            secondary: palette.primary,
            background: palette.pageBackground,
            surface: palette.surface,
            surfaceVariant: palette.surfaceMuted,
            onSurface: palette.textPrimary,
            onSurfaceVariant: palette.textSecondary,
            outline: palette.border,
            error: palette.danger,
        },
    };
}
