import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
type ExpoExtraConfig = {
    apiBaseUrl?: string;
    paystackPublicKey?: string;
    eas?: {
        projectId?: string | null;
    };
};
const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtraConfig;
const defaultApiPort = '5000';
const defaultApiPath = '/api';
const trimConfigValue = (value?: string | null) => typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
const isPrivateDevelopmentHost = (host: string) => host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
const buildApiBaseUrlFromHostUri = (hostUri?: string | null) => {
    const trimmedHostUri = typeof hostUri === 'string' ? hostUri.trim() : '';
    if (!trimmedHostUri) {
        return '';
    }
    try {
        const normalizedHostUri = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmedHostUri)
            ? trimmedHostUri
            : `http://${trimmedHostUri}`;
        const hostname = new URL(normalizedHostUri).hostname;
        if (!hostname || !isPrivateDevelopmentHost(hostname)) {
            return '';
        }
        const resolvedHost = (hostname === 'localhost' || hostname === '127.0.0.1') && Platform.OS === 'android'
            ? '10.0.2.2'
            : hostname;
        return `http://${resolvedHost}:${defaultApiPort}${defaultApiPath}`;
    }
    catch {
        return '';
    }
};
const resolveApiBaseUrl = () => {
    const configuredUrl = trimConfigValue(extra.apiBaseUrl);
    if (configuredUrl) {
        return configuredUrl;
    }
    const expoHostUrl = trimConfigValue(buildApiBaseUrlFromHostUri(Constants.expoConfig?.hostUri));
    if (expoHostUrl) {
        return expoHostUrl;
    }
    return Platform.OS === 'android'
        ? `http://10.0.2.2:${defaultApiPort}${defaultApiPath}`
        : `http://localhost:${defaultApiPort}${defaultApiPath}`;
};
const fallbackPaystackKey = 'pk_test_f5ab1691491857e39c3ca1221d7e8d5680317b13';
export const API_CONFIG = {
    BASE_URL: resolveApiBaseUrl(),
    TIMEOUT: 120000,
};
export const PAYSTACK_CONFIG = {
    PUBLIC_KEY: trimConfigValue(extra.paystackPublicKey) || fallbackPaystackKey,
};
export const APP_CONFIG = {
    APP_NAME: Constants.expoConfig?.name || 'StayHub',
    VERSION: Constants.expoConfig?.version || '1.0.0',
    EAS_PROJECT_ID: extra.eas?.projectId || '',
    HOST_URI: Constants.expoConfig?.hostUri || '',
    IS_EXPO_GO: Constants.executionEnvironment === ExecutionEnvironment.StoreClient,
};
