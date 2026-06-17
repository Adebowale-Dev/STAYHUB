const packageJson = require('./package.json');
const getEnv = (...keys) => {
    for (const key of keys) {
        const value = process.env[key];
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }
    return '';
};
const apiBaseUrl = getEnv('EXPO_PUBLIC_API_BASE_URL', 'API_BASE_URL');
const paystackPublicKey = getEnv('EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY', 'PAYSTACK_PUBLIC_KEY') ||
    'pk_test_f5ab1691491857e39c3ca1221d7e8d5680317b13';
const easProjectId = getEnv('EXPO_PUBLIC_EAS_PROJECT_ID', 'EXPO_EAS_PROJECT_ID', 'EAS_PROJECT_ID') ||
    '66c2f543-e9cc-4716-9bc3-b741720dc65c';
module.exports = {
    expo: {
        name: 'StayHub',
        slug: 'stayhub-mobile',
        version: packageJson.version || '1.0.0',
        orientation: 'portrait',
        icon: './assets/icon.png',
        userInterfaceStyle: 'light',
        splash: {
            image: './assets/splash.png',
            resizeMode: 'contain',
            backgroundColor: '#1565C0',
        },
        assetBundlePatterns: ['**/*'],
        ios: {
            supportsTablet: false,
            bundleIdentifier: 'com.stayhub.mobile',
        },
        android: {
            adaptiveIcon: {
                foregroundImage: './assets/adaptive-icon.png',
                backgroundColor: '#1565C0',
            },
            package: 'com.stayhub.mobile',
        },
        web: {
            bundler: 'metro',
            output: 'static',
            favicon: './assets/favicon.png',
        },
        plugins: ['expo-router', 'expo-notifications'],
        experiments: {
            typedRoutes: true,
        },
        scheme: 'stayhub',
        extra: {
            apiBaseUrl,
            paystackPublicKey,
            eas: {
                projectId: easProjectId,
            },
        },
    },
};
