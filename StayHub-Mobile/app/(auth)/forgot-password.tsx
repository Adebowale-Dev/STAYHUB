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
import { useThemeStore } from '../../store/themeStore';
import { getAppPalette } from '../../theme/tokens';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const isDark = useThemeStore((state) => state.isDark);
    const palette = getAppPalette(isDark);

    const handleSubmit = async () => {
        if (!email.trim()) {
            setErrorMessage('Enter the email address linked to your StayHub account.');
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            await authAPI.forgotPassword(email.trim().toLowerCase());
            setSent(true);
        } catch (error: any) {
            setErrorMessage(
                error?.response?.data?.message ?? 'Failed to send reset email. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <View className="flex-1" style={{ backgroundColor: palette.pageBackground }}>
                <StatusBar
                    barStyle={isDark ? 'light-content' : 'dark-content'}
                    translucent
                    backgroundColor="transparent"
                />

                <View
                    className="flex-1 px-6"
                    style={{
                        paddingTop: insets.top + 28,
                        paddingBottom: Math.max(insets.bottom, 28),
                    }}
                >
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
                            style={{ backgroundColor: palette.success }}
                        >
                            <MaterialCommunityIcons
                                name="email-check-outline"
                                size={26}
                                color="#FFFFFF"
                            />
                        </View>

                        <Text
                            className="text-[28px] font-extrabold"
                            style={{ color: palette.textPrimary }}
                        >
                            Check your email
                        </Text>
                        <Text
                            className="mt-2 text-[15px] leading-6"
                            style={{ color: palette.textSecondary }}
                        >
                            We sent a password reset link to the address below. Open it to create
                            a new password.
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
                        <Text
                            className="text-[20px] font-extrabold"
                            style={{ color: palette.textPrimary }}
                        >
                            Reset link sent
                        </Text>
                        <Text
                            className="mt-1 text-[14px] leading-5"
                            style={{ color: palette.textSecondary }}
                        >
                            If the email exists in StayHub, you should receive instructions shortly.
                        </Text>

                        <View
                            className="mt-5 rounded-[18px] px-4 py-4"
                            style={{ backgroundColor: palette.surfaceMuted }}
                        >
                            <Text
                                className="text-[12px] font-bold uppercase"
                                style={{ color: palette.textSecondary }}
                            >
                                Email Address
                            </Text>
                            <Text
                                className="mt-2 text-[15px] font-semibold"
                                style={{ color: palette.textPrimary }}
                            >
                                {email}
                            </Text>
                        </View>

                        <Text
                            className="mt-5 text-[13px] leading-5"
                            style={{ color: palette.textSecondary }}
                        >
                            If you do not see the message soon, check your spam folder or try again
                            with another email address.
                        </Text>

                        <TouchableOpacity
                            className="mt-6 min-h-[56px] flex-row items-center justify-center rounded-[18px]"
                            onPress={() => router.replace('/(auth)/login')}
                            activeOpacity={0.88}
                            style={{ backgroundColor: palette.primary }}
                        >
                            <MaterialCommunityIcons
                                name="arrow-left"
                                size={18}
                                color="#FFFFFF"
                            />
                            <Text className="ml-2 text-[16px] font-extrabold text-white">
                                Back to Login
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

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
                                    name="lock-reset"
                                    size={26}
                                    color="#FFFFFF"
                                />
                            </View>

                            <Text
                                className="text-[28px] font-extrabold"
                                style={{ color: palette.textPrimary }}
                            >
                                Forgot password?
                            </Text>
                            <Text
                                className="mt-2 text-[15px] leading-6"
                                style={{ color: palette.textSecondary }}
                            >
                                Enter your email address and we will send you a secure reset link to
                                regain access to your account.
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
                                    Reset your password
                                </Text>
                                <Text
                                    className="mt-1 text-[14px] leading-5"
                                    style={{ color: palette.textSecondary }}
                                >
                                    We will email reset instructions to the address on your account.
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

                            <View>
                                <Text
                                    className="mb-2 text-[13px] font-bold"
                                    style={{ color: palette.textPrimary }}
                                >
                                    Email Address
                                </Text>
                                <TextInput
                                    mode="outlined"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!loading}
                                    placeholder="Enter your email address"
                                    placeholderTextColor={palette.textMuted}
                                    textColor={palette.textPrimary}
                                    style={{ backgroundColor: palette.surface }}
                                    outlineColor={palette.border}
                                    activeOutlineColor={palette.primary}
                                    left={
                                        <TextInput.Icon
                                            icon="email-outline"
                                            color={palette.textSecondary}
                                        />
                                    }
                                />
                            </View>

                            <TouchableOpacity
                                className="mt-6 min-h-[56px] flex-row items-center justify-center rounded-[18px]"
                                onPress={handleSubmit}
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
                                        <MaterialCommunityIcons
                                            name="send-outline"
                                            size={18}
                                            color="#FFFFFF"
                                        />
                                        <Text className="ml-2 text-[16px] font-extrabold text-white">
                                            Send Reset Link
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="mt-4 self-center"
                                onPress={() => router.back()}
                                disabled={loading}
                                activeOpacity={0.75}
                            >
                                <Text
                                    className="text-[13px] font-bold"
                                    style={{ color: palette.primary }}
                                >
                                    Back to login
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="mt-6 items-center px-5">
                            <Text
                                className="text-center text-[13px] leading-5"
                                style={{ color: palette.textSecondary }}
                            >
                                If you no longer have access to your email, reach out to your
                                administrator for account recovery support.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}
