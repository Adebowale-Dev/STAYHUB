import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
import { getAppPalette } from '../../theme/tokens';

export default function LoginScreen() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const setAuth = useAuthStore((state) => state.setAuth);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const palette = getAppPalette(false);

    const initials = useMemo(() => {
        const value = identifier.trim();
        if (!value) {
            return 'SH';
        }

        if (value.includes('@')) {
            return value.slice(0, 2).toUpperCase();
        }

        return value.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase() || 'SH';
    }, [identifier]);

    const maskedIdentifier = useMemo(() => {
        const value = identifier.trim();
        if (!value) {
            return 'Enter email or matric number';
        }

        if (value.includes('@')) {
            const [name, domain] = value.split('@');
            const visible = name.slice(0, 3);
            return `${visible}${'*'.repeat(Math.max(name.length - 3, 2))}@${domain}`;
        }

        if (value.length <= 4) {
            return value.toUpperCase();
        }

        return `${value.slice(0, 2).toUpperCase()}${'*'.repeat(Math.max(value.length - 4, 2))}${value.slice(-2).toUpperCase()}`;
    }, [identifier]);

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
            const normalizedIdentifier = normalizeIdentifier(identifier);
            const response = await authAPI.login({
                identifier: normalizedIdentifier,
                password,
            });

            await setAuth(response.data.user, response.data.token);
            router.replace('/(student)/dashboard');
        }
        catch (error: any) {
            if (!error?.response) {
                const message =
                    error?.code === 'ECONNABORTED' ||
                    String(error?.message || '').toLowerCase().includes('timeout')
                        ? 'Connection timed out. Please check that the backend server is available and try again.'
                        : 'Cannot reach the StayHub server from this phone right now. Check the mobile API URL and make sure the backend is running.';
                setErrorMessage(message);
            }
            else if (error.response.status === 401) {
                setErrorMessage(error.response?.data?.message ?? 'Invalid email, matric number, or password.');
            }
            else {
                setErrorMessage(error.response?.data?.message ?? 'Something went wrong while signing you in.');
            }
        }
        finally {
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
                <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingTop: insets.top + 68,
                        paddingBottom: Math.max(insets.bottom, 24),
                    }}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                >
                    <View className="flex-1 px-7">
                        <View className="mb-7 flex-row items-center">
                            <View className="mr-4 h-[86px] w-[86px] items-center justify-center rounded-full" style={{ backgroundColor: palette.primarySoft }}>
                                <View className="h-[74px] w-[74px] items-center justify-center rounded-full" style={{ backgroundColor: palette.primary }}>
                                <Text className="text-[26px] font-extrabold text-white">{initials}</Text>
                                </View>
                            </View>

                            <View className="flex-1">
                                <Text className="text-[18px] font-medium" style={{ color: palette.textSecondary }}>Welcome Back</Text>
                                <Text className="mt-1 text-[20px] font-extrabold" style={{ color: palette.textPrimary }}>StayHub Student</Text>
                            </View>
                        </View>

                        {errorMessage ? (
                            <View className="mb-5 rounded-[16px] border px-4 py-3" style={{ borderColor: palette.dangerSoft, backgroundColor: '#FEF1F1' }}>
                                <Text className="text-[13px] font-semibold leading-5" style={{ color: palette.danger }}>
                                    {errorMessage}
                                </Text>
                            </View>
                        ) : null}

                        <View className="mb-5">
                            <Text className="mb-3 text-[15px] font-bold" style={{ color: palette.textPrimary }}>Email or Matric Number</Text>
                            <TextInput
                                mode="flat"
                                value={identifier}
                                onChangeText={setIdentifier}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                                placeholder="Enter email or matric number"
                                textColor={palette.textPrimary}
                                placeholderTextColor={palette.textMuted}
                                style={{
                                    backgroundColor: palette.surface,
                                    borderRadius: 18,
                                    overflow: 'hidden',
                                    borderWidth: 1,
                                    borderColor: palette.border,
                                }}
                                contentStyle={{
                                    minHeight: 58,
                                    color: palette.textPrimary,
                                    fontSize: 16,
                                }}
                                underlineColor="transparent"
                                activeUnderlineColor="transparent"
                                left={<TextInput.Icon icon="account-outline" color={palette.textSecondary} />}
                            />
                        </View>

                        <View>
                            <Text className="mb-3 text-[15px] font-bold" style={{ color: palette.textPrimary }}>Password</Text>
                            <TextInput
                                mode="flat"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                editable={!loading}
                                placeholder="Enter your password"
                                textColor={palette.textPrimary}
                                placeholderTextColor={palette.textMuted}
                                style={{
                                    backgroundColor: palette.surface,
                                    borderRadius: 18,
                                    overflow: 'hidden',
                                    borderWidth: 1,
                                    borderColor: palette.border,
                                }}
                                contentStyle={{
                                    minHeight: 58,
                                    color: palette.textPrimary,
                                    fontSize: 16,
                                }}
                                underlineColor="transparent"
                                activeUnderlineColor="transparent"
                                left={<TextInput.Icon icon="lock-outline" color={palette.textSecondary} />}
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
                            className="mt-5 self-end"
                            onPress={() => router.push('/(auth)/forgot-password')}
                            activeOpacity={0.75}
                            disabled={loading}
                        >
                            <Text className="text-[15px] font-bold" style={{ color: palette.primary }}>Reset password</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="mt-12 min-h-[60px] flex-row items-center justify-center rounded-[18px]"
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.88}
                            style={{ backgroundColor: palette.primary }}
                        >
                            {loading ? (
                                <ActivityIndicator size={20} color="#FFFFFF" />
                            ) : (
                                <>
                                    <Text className="text-[17px] font-extrabold text-white">Log in</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 10 }} />
                                </>
                            )}
                        </TouchableOpacity>

                        <View className="mt-8 items-center">
                            <Text className="text-[15px]" style={{ color: palette.textSecondary }}>
                                Need help accessing your account?
                            </Text>
                            <Text className="mt-1 text-[14px] font-bold" style={{ color: palette.primary }}>
                                Contact your administrator
                            </Text>
                        </View>

                        <View className="mt-16 items-center">
                            <View className="h-[92px] w-[92px] items-center justify-center rounded-full" style={{ backgroundColor: palette.surfaceMuted }}>
                                <MaterialCommunityIcons name="clipboard-list-outline" size={34} color={palette.primary} />
                            </View>
                            <Text className="mt-4 text-[15px] font-medium" style={{ color: palette.textSecondary }}>Quick access</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}
