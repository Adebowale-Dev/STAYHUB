import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
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
import { getStudentPalette } from '../../constants/design';
import { useThemeStore } from '../../store/themeStore';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const isDark = useThemeStore((state) => state.isDark);
    const palette = getStudentPalette(isDark);

    const handleSubmit = async () => {
        if (!email.trim()) {
            Alert.alert('Missing Field', 'Please enter your email address.');
            return;
        }

        setLoading(true);
        try {
            await authAPI.forgotPassword(email.trim().toLowerCase());
            setSent(true);
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message ?? 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <View className="flex-1 bg-hero">
                <StatusBar barStyle="light-content" backgroundColor={palette.hero} />
                <View style={{ height: insets.top }} />
                <View className="px-5 pb-7">
                    <View className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/8 px-5 py-6">
                        <View className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10" />
                        <View className="absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-[#2F80ED]/25" />

                        <View className="mb-5 h-[72px] w-[72px] items-center justify-center self-center rounded-full bg-primary">
                            <MaterialCommunityIcons name="email-check-outline" size={32} color="#fff" />
                        </View>
                        <Text className="text-center text-[26px] font-extrabold text-white">
                            Check Your Email
                        </Text>
                        <Text className="mt-3 text-center text-[14px] leading-6 text-white/75">
                            We sent a password reset link to the address below.
                        </Text>
                        <View className="mt-5 self-center rounded-full bg-white/95 px-4 py-2.5">
                            <Text className="text-[13px] font-bold text-primary">{email}</Text>
                        </View>
                        <Text className="mt-4 text-center text-[13px] leading-5 text-white/70">
                            If you do not see it soon, check spam or try again with a different email.
                        </Text>

                        <TouchableOpacity
                            className="mt-7 flex-row items-center justify-center rounded-2xl bg-white py-4"
                            onPress={() => router.back()}
                            activeOpacity={0.85}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={18} color={palette.primary} />
                            <Text className="ml-2 text-[14px] font-extrabold text-primary">Back to Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView
                className="flex-1 bg-background"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <StatusBar barStyle="light-content" backgroundColor={palette.hero} />
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 18 }}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View className="bg-hero px-5 pb-8">
                        <View className="absolute -right-8 -top-12 h-44 w-44 rounded-full bg-[#2F80ED]/25" />
                        <View className="absolute -bottom-10 -left-7 h-28 w-28 rounded-full bg-white/10" />

                        <TouchableOpacity
                            className="mb-6 h-10 w-10 items-center justify-center rounded-full bg-white/15"
                            onPress={() => router.back()}
                            disabled={loading}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
                        </TouchableOpacity>

                        <View className="h-[74px] w-[74px] items-center justify-center self-center rounded-full border-2 border-white/25 bg-white/15">
                            <MaterialCommunityIcons name="lock-reset" size={30} color="#fff" />
                        </View>
                        <Text className="mt-4 text-center text-[28px] font-extrabold tracking-hero text-white">
                            Reset Password
                        </Text>
                        <Text className="mt-2 text-center text-[14px] leading-6 text-white/70">
                            We&apos;ll send a reset link to your email so you can get back into StayHub quickly.
                        </Text>
                    </View>

                    <View
                        className="-mt-5 flex-1 rounded-t-[32px] border border-border bg-surface px-5 pb-8 pt-7"
                        style={{
                            shadowColor: palette.shadow,
                            shadowOffset: { width: 0, height: -10 },
                            shadowOpacity: 0.06,
                            shadowRadius: 18,
                            elevation: 8,
                        }}
                    >
                        <Text className="text-[24px] font-extrabold text-foreground">
                            Forgot your password?
                        </Text>
                        <Text className="mt-2 text-[14px] leading-6 text-foreground-secondary">
                            Enter the email linked to your account and we&apos;ll send you a secure reset link.
                        </Text>

                        <View className="mt-6">
                            <Text className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.5px] text-foreground-secondary">
                                Email Address
                            </Text>
                            <TextInput
                                mode="outlined"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                disabled={loading}
                                placeholder="you@example.com"
                                style={{ backgroundColor: palette.surface }}
                                outlineColor={palette.border}
                                activeOutlineColor={palette.primary}
                                left={<TextInput.Icon icon="email-outline" color={palette.textSecondary} />}
                            />
                        </View>

                        <TouchableOpacity
                            className="mt-6 min-h-[56px] flex-row items-center justify-center rounded-[20px] bg-primary"
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.85}
                            style={{
                                shadowColor: palette.primary,
                                shadowOffset: { width: 0, height: 10 },
                                shadowOpacity: 0.24,
                                shadowRadius: 18,
                                elevation: 8,
                                opacity: loading ? 0.72 : 1,
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator size={20} color="#fff" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="send-outline" size={18} color="#fff" />
                                    <Text className="ml-2 text-[15px] font-extrabold text-white">
                                        Send Reset Link
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="mt-5 flex-row items-center justify-center"
                            onPress={() => router.back()}
                            disabled={loading}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={15} color={palette.primary} />
                            <Text className="ml-1.5 text-[13px] font-bold text-primary">Back to Login</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}
