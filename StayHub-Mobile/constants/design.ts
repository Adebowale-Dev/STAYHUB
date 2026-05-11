import { getAppPalette } from '../theme/tokens';

export const STUDENT_HERO_IMAGE = {
    uri: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
};

export const STUDENT_HERO_FALLBACK = require('../assets/splash.png');

export function getStudentPalette(isDark: boolean) {
    return getAppPalette(isDark);
}
