import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { ActivityIndicator, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { getAppPalette } from '../../theme/tokens';

export default function LoginScreen() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const setAuth = useAuthStore((state) => state.setAuth);
    const isDark = useThemeStore((state) => state.isDark);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const palette = getAppPalette(isDark);

    const normalizeIdentifier = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) {
            return '';
        }

        return trimmed.includes('@') ? trimmed.toLowerCase() : trimmed.toUpperCase();
    };

    const handleLogin = async () => {
        if (!identifier.trim() || !password.trim()) {
            setErrorMessage('Enter your email or matric number and password to continue.');
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await authAPI.login({
                identifier: normalizeIdentifier(identifier),
                password,
            });

            await setAuth(response.data.user, response.data.token);
            router.replace('/(student)/dashboard');
        } catch (error: any) {
            if (!error?.response) {
                const message =
                    error?.code === 'ECONNABORTED' ||
                    String(error?.message || '').toLowerCase().includes('timeout')
                        ? 'Connection timed out. Please try again in a moment.'
                        : 'Cannot reach the StayHub server right now. Check the mobile API URL and backend status.';
                setErrorMessage(message);
            } else if (error.response.status === 401) {
                setErrorMessage(error.response?.data?.message ?? 'Invalid email, matric number, or password.');
            } else {
                setErrorMessage(error.response?.data?.message ?? 'Something went wrong while signing you in.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ backgroundColor: palette.pageBackground }}
            >
                <StatusBar
                    barStyle={isDark ? 'light-content' : 'dark-content'}
                    translucent
                    backgroundColor="transparent"
                />

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingTop: insets.top + 28,
                        paddingBottom: Math.max(insets.bottom, 28),
                    }}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                >
                    <View className="flex-1 px-6">
                        <View
                            className="mb-6 rounded-[28px] px-6 py-6"
                            style={{
                                backgroundColor: palette.surfaceTint,
                                borderWidth: 1,
                                borderColor: palette.border,
                            }}
                        >
                            <View
                                className="mb-5 h-14 w-14 items-center justify-center rounded-[18px]"
                                style={{ backgroundColor: palette.primary }}
                            >
                                <MaterialCommunityIcons
                                    name="office-building-outline"
                                    size={26}
                                    color="#FFFFFF"
                                />
                            </View>

                            <Text
                                className="text-[28px] font-extrabold"
                                style={{ color: palette.textPrimary }}
                            >
                                Welcome back
                            </Text>
                            <Text
                                className="mt-2 text-[15px] leading-6"
                                style={{ color: palette.textSecondary }}
                            >
                                Sign in to StayHub to continue with your hostel access,
                                payment status, and room updates.
                            </Text>
                        </View>

                        <View
                            className="rounded-[28px] px-5 py-6"
                            style={{
                                backgroundColor: palette.surface,
                                borderWidth: 1,
                                borderColor: palette.border,
                                shadowColor: palette.shadow,
                                shadowOffset: { width: 0, height: 12 },
                                shadowOpacity: isDark ? 0.18 : 0.08,
                                shadowRadius: 24,
                                elevation: 8,
                            }}
                        >
                            <View className="mb-6">
                                <Text
                                    className="text-[20px] font-extrabold"
                                    style={{ color: palette.textPrimary }}
                                >
                                    Student sign in
                                </Text>
                                <Text
                                    className="mt-1 text-[14px] leading-5"
                                    style={{ color: palette.textSecondary }}
                                >
                                    Use your school email or matric number and password.
                                </Text>
                            </View>

                            {errorMessage ? (
                                <View
                                    className="mb-5 rounded-[18px] px-4 py-3"
                                    style={{
                                        backgroundColor: palette.dangerSoft,
                                        borderWidth: 1,
                                        borderColor: isDark ? 'rgba(239,68,68,0.28)' : '#F5CACA',
                                    }}
                                >
                                    <Text
                                        className="text-[13px] font-medium leading-5"
                                        style={{ color: palette.danger }}
                                    >
                                        {errorMessage}
                                    </Text>
                                </View>
                            ) : null}

                            <View className="mb-4">
                                <Text
                                    className="mb-2 text-[13px] font-bold"
                                    style={{ color: palette.textPrimary }}
                                >
                                    Email or Matric Number
                                </Text>
                                <TextInput
                                    mode="outlined"
                                    value={identifier}
                                    onChangeText={setIdentifier}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!loading}
                                    placeholder="Enter your email or matric number"
                                    placeholderTextColor={palette.textMuted}
                                    textColor={palette.textPrimary}
                                    style={{ backgroundColor: palette.surface }}
                                    outlineColor={palette.border}
                                    activeOutlineColor={palette.primary}
                                    left={
                                        <TextInput.Icon
                                            icon="account-outline"
                                            color={palette.textSecondary}
                                        />
                                    }
                                />
                            </View>

                            <View>
                                <Text
                                    className="mb-2 text-[13px] font-bold"
                                    style={{ color: palette.textPrimary }}
                                >
                                    Password
                                </Text>
                                <TextInput
                                    mode="outlined"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    editable={!loading}
                                    placeholder="Enter your password"
                                    placeholderTextColor={palette.textMuted}
                                    textColor={palette.textPrimary}
                                    style={{ backgroundColor: palette.surface }}
                                    outlineColor={palette.border}
                                    activeOutlineColor={palette.primary}
                                    left={
                                        <TextInput.Icon
                                            icon="lock-outline"
                                            color={palette.textSecondary}
                                        />
                                    }
                                    right={
                                        <TextInput.Icon
                                            icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                            onPress={() => setShowPassword((current) => !current)}
                                            color={palette.textSecondary}
                                        />
                                    }
                                />
                            </View>

                            <TouchableOpacity
                                className="mt-4 self-end"
                                onPress={() => router.push('/(auth)/forgot-password')}
                                activeOpacity={0.75}
                                disabled={loading}
                            >
                                <Text
                                    className="text-[13px] font-bold"
                                    style={{ color: palette.primary }}
                                >
                                    Forgot password?
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="mt-6 min-h-[56px] flex-row items-center justify-center rounded-[18px]"
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.88}
                                style={{
                                    backgroundColor: palette.primary,
                                    opacity: loading ? 0.78 : 1,
                                }}
                            >
                                {loading ? (
                                    <ActivityIndicator size={20} color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text className="text-[16px] font-extrabold text-white">
                                            Sign In
                                        </Text>
                                        <MaterialCommunityIcons
                                            name="arrow-right"
                                            size={18}
                                            color="#FFFFFF"
                                            style={{ marginLeft: 8 }}
                                        />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View className="mt-6 items-center px-5">
                            <Text
                                className="text-center text-[13px] leading-5"
                                style={{ color: palette.textSecondary }}
                            >
                                Having trouble signing in? Contact your hostel administrator for
                                help with account access.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}
