/** @type {import('tailwindcss').Config} */
module.exports = {
    presets: [require('nativewind/preset')],
    content: [
        './app/**/*.{js,jsx,ts,tsx}',
        './components/**/*.{js,jsx,ts,tsx}',
        './constants/**/*.{js,jsx,ts,tsx}',
        './theme/**/*.{js,jsx,ts,tsx}',
        './services/**/*.{js,jsx,ts,tsx}',
        './store/**/*.{js,jsx,ts,tsx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: 'rgb(var(--background) / <alpha-value>)',
                surface: 'rgb(var(--surface) / <alpha-value>)',
                'surface-raised': 'rgb(var(--surface-raised) / <alpha-value>)',
                'surface-muted': 'rgb(var(--surface-muted) / <alpha-value>)',
                'surface-tint': 'rgb(var(--surface-tint) / <alpha-value>)',
                border: 'rgb(var(--border) / <alpha-value>)',
                divider: 'rgb(var(--divider) / <alpha-value>)',
                foreground: 'rgb(var(--foreground) / <alpha-value>)',
                'foreground-secondary': 'rgb(var(--foreground-secondary) / <alpha-value>)',
                muted: 'rgb(var(--muted) / <alpha-value>)',
                primary: 'rgb(var(--primary) / <alpha-value>)',
                'primary-strong': 'rgb(var(--primary-strong) / <alpha-value>)',
                'primary-soft': 'rgb(var(--primary-soft) / <alpha-value>)',
                success: 'rgb(var(--success) / <alpha-value>)',
                'success-soft': 'rgb(var(--success-soft) / <alpha-value>)',
                warning: 'rgb(var(--warning) / <alpha-value>)',
                'warning-soft': 'rgb(var(--warning-soft) / <alpha-value>)',
                danger: 'rgb(var(--danger) / <alpha-value>)',
                'danger-soft': 'rgb(var(--danger-soft) / <alpha-value>)',
                hero: 'rgb(var(--hero) / <alpha-value>)',
                'hero-glass': 'rgb(var(--hero-glass) / <alpha-value>)',
                'hero-border': 'rgb(var(--hero-border) / <alpha-value>)',
                shadow: 'rgb(var(--shadow) / <alpha-value>)',
            },
            boxShadow: {
                card: '0px 18px 40px rgba(6, 18, 32, 0.14)',
                hero: '0px 16px 36px rgba(5, 16, 34, 0.3)',
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.25rem',
            },
            letterSpacing: {
                hero: '-0.02em',
            },
        },
    },
    plugins: [],
};
