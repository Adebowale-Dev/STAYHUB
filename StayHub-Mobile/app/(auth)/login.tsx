import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    ImageBackground,
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FALLBACK_IMAGE = require('../../assets/splash.png');
const HERO_IMAGE = {
    uri: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1400&q=80',
};

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const FEATURE_ITEMS: Array<{ icon: IconName; label: string }> = [
    { icon: 'shield-check-outline', label: 'Secure access' },
    { icon: 'bed-king-outline', label: 'Live room updates' },
    { icon: 'credit-card-check-outline', label: 'Fast fee tracking' },
];

export default function LoginScreen() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const setAuth = useAuthStore((state) => state.setAuth);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const normalizeIdentifier = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) {
            return '';
        }
        return trimmed.includes('@') ? trimmed.toLowerCase() : trimmed.toUpperCase();
    };

    const handleLogin = async () => {
        if (!identifier.trim() || !password.trim()) {
            setErrorMessage('Enter your email or matric number and your password to continue.');
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
        } catch (error: any) {
            if (!error?.response) {
                const message =
                    error?.code === 'ECONNABORTED' ||
                    String(error?.message || '').toLowerCase().includes('timeout')
                        ? 'Connection timed out. Please check that the backend server is available and try again.'
                        : 'Cannot reach the StayHub server from this phone right now. Check the mobile API URL and make sure the backend is running.';
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
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

                <ImageBackground source={FALLBACK_IMAGE} className="flex-1 bg-hero" resizeMode="cover">
                    <ImageBackground
                        source={HERO_IMAGE}
                        className="flex-1 bg-hero"
                        resizeMode="cover"
                        imageStyle={{ transform: [{ scale: 1.04 }] }}
                    >
                        <View className="absolute inset-0 bg-hero/70" />
                        <View className="absolute -right-12 -top-28 h-[280px] w-[280px] rounded-full bg-[#2F80ED]/30" />
                        <View className="absolute -bottom-28 -left-10 h-[240px] w-[240px] rounded-full bg-[#0F52BA]/25" />

                        <ScrollView
                            className="flex-1"
                            contentContainerStyle={{
                                flexGrow: 1,
                                minHeight: SCREEN_HEIGHT + insets.top + Math.max(insets.bottom, 24),
                                paddingTop: insets.top + 24,
                                paddingBottom: Math.max(insets.bottom, 24),
                            }}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            <View className="flex-1 justify-between px-5">
                                <View>
                                    <View className="self-start rounded-full border border-white/20 bg-white/15 px-3.5 py-2.5">
                                        <View className="flex-row items-center">
                                            <View className="mr-2.5 h-8 w-8 items-center justify-center rounded-full bg-white/15">
                                                <MaterialCommunityIcons
                                                    name="home-city-outline"
                                                    size={18}
                                                    color="#FFFFFF"
                                                />
                                            </View>
                                            <Text className="text-base font-extrabold text-white">StayHub</Text>
                                        </View>
                                    </View>

                                    <View className="mt-7 max-w-[520px]">
                                        <Text className="mb-3 text-[12px] font-extrabold tracking-[1.3px] text-white/75">
                                            STUDENT ACCOMMODATION PLATFORM
                                        </Text>
                                        <Text className="mb-3.5 text-[34px] font-extrabold leading-10 tracking-hero text-white">
                                            Your hostel experience, professionally organized.
                                        </Text>
                                        <Text className="max-w-[380px] text-[15px] leading-6 text-white/80">
                                            Reserve rooms, manage payments, and stay updated from one
                                            secure student portal.
                                        </Text>

                                        <View className="mt-5 flex-row flex-wrap gap-2.5">
                                            {FEATURE_ITEMS.map((item) => (
                                                <View
                                                    key={item.label}
                                                    className="flex-row items-center rounded-full border border-white/15 bg-white/12 px-3 py-2.5"
                                                >
                                                    <MaterialCommunityIcons
                                                        name={item.icon}
                                                        size={16}
                                                        color="#FFFFFF"
                                                    />
                                                    <Text className="ml-2 text-[12px] font-bold text-white">
                                                        {item.label}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View>

                                <View
                                    className="overflow-hidden rounded-[30px] border border-white/50 bg-surface/95 px-5 pb-5 pt-6"
                                    style={{
                                        shadowColor: '#031120',
                                        shadowOffset: { width: 0, height: 16 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 26,
                                        elevation: 18,
                                    }}
                                >
                                    <View className="absolute -right-5 -top-12 h-[140px] w-[140px] rounded-full bg-primary/10" />

                                    <View className="mb-5 flex-row items-start justify-between">
                                        <View className="flex-1 pr-3">
                                            <Text className="mb-1.5 text-[26px] font-extrabold text-foreground">
                                                Welcome back
                                            </Text>
                                            <Text className="text-[14px] leading-5 text-foreground-secondary">
                                                Sign in with your email or matric number to continue.
                                            </Text>
                                        </View>

                                        <View className="rounded-full bg-primary-soft px-3 py-2">
                                            <Text className="text-[11px] font-extrabold uppercase tracking-[0.7px] text-primary">
                                                Student
                                            </Text>
                                        </View>
                                    </View>

                                    {errorMessage ? (
                                        <View className="mb-4 flex-row rounded-[18px] border border-red-200 bg-red-50 px-3.5 py-3">
                                            <MaterialCommunityIcons
                                                name="alert-circle-outline"
                                                size={18}
                                                color="#B42318"
                                            />
                                            <Text className="ml-2 flex-1 text-[13px] font-semibold leading-5 text-[#B42318]">
                                                {errorMessage}
                                            </Text>
                                        </View>
                                    ) : null}

                                    <View className="mb-3.5">
                                        <Text className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.4px] text-[#344054]">
                                            Email or Matric Number
                                        </Text>
                                        <TextInput
                                            mode="outlined"
                                            value={identifier}
                                            onChangeText={setIdentifier}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            editable={!loading}
                                            placeholder="BU22CSC1005 or you@example.com"
                                            style={{ backgroundColor: '#FFFFFF', fontSize: 14 }}
                                            contentStyle={{ minHeight: 54, color: '#0F172A' }}
                                            outlineColor="rgba(12, 74, 140, 0.16)"
                                            activeOutlineColor="#0C4A8C"
                                            left={<TextInput.Icon icon="account-outline" color="#64748B" />}
                                        />
                                    </View>

                                    <View>
                                        <Text className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.4px] text-[#344054]">
                                            Password
                                        </Text>
                                        <TextInput
                                            mode="outlined"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            editable={!loading}
                                            placeholder="Enter your password"
                                            style={{ backgroundColor: '#FFFFFF', fontSize: 14 }}
                                            contentStyle={{ minHeight: 54, color: '#0F172A' }}
                                            outlineColor="rgba(12, 74, 140, 0.16)"
                                            activeOutlineColor="#0C4A8C"
                                            left={<TextInput.Icon icon="lock-outline" color="#64748B" />}
                                            right={
                                                <TextInput.Icon
                                                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                                    onPress={() => setShowPassword((current) => !current)}
                                                    color="#64748B"
                                                />
                                            }
                                        />
                                    </View>

                                    <View className="mb-[18px] mt-3.5 flex-row items-center justify-between">
                                        <TouchableOpacity
                                            onPress={() => router.push('/(auth)/forgot-password')}
                                            disabled={loading}
                                            activeOpacity={0.72}
                                        >
                                            <Text className="text-[13px] font-bold text-primary">Forgot password?</Text>
                                        </TouchableOpacity>

                                        <View className="flex-row items-center rounded-full bg-primary-soft px-2.5 py-1.5">
                                            <MaterialCommunityIcons
                                                name="shield-check"
                                                size={14}
                                                color="#0C4A8C"
                                            />
                                            <Text className="ml-1.5 text-[11px] font-extrabold text-primary">
                                                Protected login
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        className="min-h-[62px] flex-row items-center justify-between rounded-[22px] bg-primary px-[18px] py-[14px]"
                                        onPress={handleLogin}
                                        disabled={loading}
                                        activeOpacity={0.88}
                                        style={{
                                            shadowColor: '#0C4A8C',
                                            shadowOffset: { width: 0, height: 12 },
                                            shadowOpacity: 0.32,
                                            shadowRadius: 20,
                                            elevation: 10,
                                            opacity: loading ? 0.74 : 1,
                                        }}
                                    >
                                        {loading ? (
                                            <ActivityIndicator size={20} color="#FFFFFF" />
                                        ) : (
                                            <>
                                                <View>
                                                    <Text className="mb-0.5 text-[16px] font-extrabold text-white">
                                                        Sign In
                                                    </Text>
                                                    <Text className="text-[12px] font-semibold text-white/75">
                                                        Continue to your dashboard
                                                    </Text>
                                                </View>
                                                <View className="h-[38px] w-[38px] items-center justify-center rounded-full bg-white">
                                                    <MaterialCommunityIcons
                                                        name="arrow-right"
                                                        size={18}
                                                        color="#0C4A8C"
                                                    />
                                                </View>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    <View className="mt-4 flex-row items-center">
                                        <MaterialCommunityIcons
                                            name="check-decagram-outline"
                                            size={14}
                                            color="#667085"
                                        />
                                        <Text className="ml-2 flex-1 text-[12px] font-semibold leading-[18px] text-foreground-secondary">
                                            Use the same account details you use on the web portal.
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </ImageBackground>
                </ImageBackground>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}
