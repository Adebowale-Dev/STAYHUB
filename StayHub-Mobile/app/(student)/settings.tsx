import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';
import { ActivityIndicator, Divider, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Reveal } from '../../components/ui/Reveal';
import { StudentHero } from '../../components/ui/StudentHero';
import { useStudentBackSwipe } from '../../components/ui/StudentTabSwipe';
import { APP_CONFIG } from '../../constants/config';
import { getStudentPalette } from '../../constants/design';
import { authAPI, studentAPI } from '../../services/api';
import {
    getPushNotificationsUnavailableReason,
    isPushNotificationsSupported,
    registerForPushNotificationsAsync,
    unregisterStoredPushTokenAsync,
} from '../../services/pushNotifications';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import type { NotificationPreferences, NotificationSettings } from '../../types';

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    pushEnabled: true,
    emailEscalationEnabled: true,
    invitationCreated: true,
    invitationUpdates: true,
    invitationExpired: true,
    paymentUpdates: true,
    reservationUpdates: true,
};

const buildFallbackNotificationSettings = (
    preferences?: Partial<NotificationPreferences>
): NotificationSettings => ({
    preferences: {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(preferences ?? {}),
    },
    devices: [],
    registeredDevicesCount: 0,
    hasActiveDevice: false,
    lastRegisteredAt: null,
});

export default function SettingsScreen() {
    const user = useAuthStore((state) => state.user);
    const updateUser = useAuthStore((state) => state.updateUser);
    const router = useRouter();
    const theme = useTheme();
    const palette = getStudentPalette(theme.dark);
    const insets = useSafeAreaInsets();
    const isDark = useThemeStore((state) => state.isDark);
    const setTheme = useThemeStore((state) => state.setTheme);
    const primaryTint = palette.primarySoft;
    const warningTint = palette.warningSoft;
    const successTint = palette.successSoft;
    const bottomContentPadding = Math.max(insets.bottom + 96, 116);
    const swipeHandlers = useStudentBackSwipe('/(student)/profile');

    const [loading, setLoading] = useState(true);
    const [pwModalVisible, setPwModalVisible] = useState(false);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwSaving, setPwSaving] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
        buildFallbackNotificationSettings(user?.notificationPreferences)
    );
    const [notificationBusy, setNotificationBusy] = useState<
        keyof NotificationPreferences | 'reconnect' | null
    >(null);
    const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            try {
                const [profileResult, settingsResult] = await Promise.allSettled([
                    studentAPI.getProfile(),
                    studentAPI.getNotificationSettings(),
                ]);

                const student =
                    profileResult.status === 'fulfilled'
                        ? (profileResult.value.data as any).data?.student ??
                          (profileResult.value.data as any).student
                        : null;

                if (student) {
                    updateUser(student);
                    if (student.theme) {
                        await setTheme(student.theme === 'dark');
                    }
                }

                if (settingsResult.status === 'fulfilled') {
                    const settings =
                        (settingsResult.value.data as any).data ??
                        buildFallbackNotificationSettings(student?.notificationPreferences);
                    setNotificationSettings(settings);
                    updateUser({
                        notificationPreferences: settings.preferences,
                        ...(settings.theme ? { theme: settings.theme } : {}),
                    });
                } else {
                    setNotificationSettings(
                        buildFallbackNotificationSettings(student?.notificationPreferences)
                    );
                }
            } catch {
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [setTheme, updateUser]);

    const closePwModal = () => {
        setPwModalVisible(false);
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
        setShowCurrentPw(false);
        setShowNewPw(false);
        setShowConfirmPw(false);
    };

    const handleChangePassword = async () => {
        if (!currentPw || !newPw || !confirmPw) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        if (newPw.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters.');
            return;
        }
        if (newPw !== confirmPw) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }

        setPwSaving(true);
        try {
            await authAPI.changePassword({
                currentPassword: currentPw,
                newPassword: newPw,
                confirmPassword: confirmPw,
            });
            closePwModal();
            Alert.alert('Success', 'Password changed successfully.');
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.response?.data?.message ?? 'Failed to change password. Please try again.'
            );
        } finally {
            setPwSaving(false);
        }
    };

    const handleThemeToggle = async (newValue: boolean) => {
        await setTheme(newValue);
        try {
            await studentAPI.updateProfile({ theme: newValue ? 'dark' : 'light' });
        } catch {
        }
    };

    const applyNotificationSettings = (settings: NotificationSettings) => {
        setNotificationSettings(settings);
        updateUser({
            notificationPreferences: settings.preferences,
            ...(settings.theme ? { theme: settings.theme } : {}),
        });
    };

    const syncPushDevice = async (preferences: NotificationPreferences) => {
        const result = await registerForPushNotificationsAsync(preferences);

        if (result.status !== 'registered' || !result.token) {
            setNotificationMessage(
                result.message ?? 'Push notifications are not ready on this device yet.'
            );
            return result;
        }

        const response = await studentAPI.registerPushDevice({
            token: result.token,
            platform: result.platform ?? Platform.OS,
            appOwnership: result.appOwnership ?? null,
            deviceName: result.deviceName ?? null,
            projectId: result.projectId ?? null,
        });

        const nextSettings = (response.data as any).data as NotificationSettings;
        applyNotificationSettings(nextSettings);
        setNotificationMessage('Push alerts are active on this device.');
        return result;
    };

    const handleNotificationToggle = async (
        key: keyof NotificationPreferences,
        value: boolean
    ) => {
        const previousSettings = notificationSettings;
        const optimisticSettings: NotificationSettings = {
            ...notificationSettings,
            preferences: {
                ...notificationSettings.preferences,
                [key]: value,
            },
        };

        setNotificationBusy(key);
        setNotificationSettings(optimisticSettings);

        try {
            const response = await studentAPI.updateNotificationPreferences({
                [key]: value,
            });
            const updatedSettings = (response.data as any).data as NotificationSettings;
            applyNotificationSettings(updatedSettings);

            if (key === 'pushEnabled') {
                if (value) {
                    const result = await syncPushDevice(updatedSettings.preferences);
                    if (result.status === 'denied') {
                        Alert.alert(
                            'Permission Needed',
                            result.message ??
                                'Allow notifications in your device settings to receive room alerts.'
                        );
                    } else if (result.status === 'unsupported') {
                        Alert.alert(
                            'Development Build Needed',
                            result.message ??
                                'Push notifications are not available in Expo Go. Use a development build instead.'
                        );
                    }
                } else {
                    await unregisterStoredPushTokenAsync(async (token) => {
                        await studentAPI.unregisterPushDevice(token);
                    });
                    const refreshed = await studentAPI.getNotificationSettings();
                    applyNotificationSettings((refreshed.data as any).data as NotificationSettings);
                    setNotificationMessage('Push alerts have been turned off for this device.');
                }
            }
        } catch (error: any) {
            setNotificationSettings(previousSettings);
            Alert.alert(
                'Error',
                error.response?.data?.message ?? 'Failed to update notification settings.'
            );
        } finally {
            setNotificationBusy(null);
        }
    };

    const handleReconnectDevice = async () => {
        if (!notificationSettings.preferences.pushEnabled) {
            Alert.alert('Push Alerts Off', 'Turn on push alerts first, then reconnect this device.');
            return;
        }
        if (!APP_CONFIG.EAS_PROJECT_ID) {
            Alert.alert(
                'Expo Project ID Needed',
                'Add EXPO_EAS_PROJECT_ID to your mobile environment before reconnecting this device for push alerts.'
            );
            return;
        }

        setNotificationBusy('reconnect');
        try {
            const result = await syncPushDevice(notificationSettings.preferences);
            if (result.status === 'denied') {
                Alert.alert(
                    'Permission Needed',
                    result.message ??
                        'Allow notifications in your device settings to receive room alerts.'
                );
            } else if (result.status === 'unsupported') {
                Alert.alert(
                    'Development Build Needed',
                    result.message ??
                        'Push notifications are not available in Expo Go. Use a development build instead.'
                );
            }
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.response?.data?.message ?? 'Failed to reconnect this device.'
            );
        } finally {
            setNotificationBusy(null);
        }
    };

    const handleNotificationPairToggle = async (
        firstKey: keyof NotificationPreferences,
        secondKey: keyof NotificationPreferences,
        value: boolean
    ) => {
        const previousSettings = notificationSettings;
        const optimisticSettings: NotificationSettings = {
            ...notificationSettings,
            preferences: {
                ...notificationSettings.preferences,
                [firstKey]: value,
                [secondKey]: value,
            },
        };

        setNotificationBusy(firstKey);
        setNotificationSettings(optimisticSettings);

        try {
            const response = await studentAPI.updateNotificationPreferences({
                [firstKey]: value,
                [secondKey]: value,
            });
            applyNotificationSettings((response.data as any).data as NotificationSettings);
        } catch (error: any) {
            setNotificationSettings(previousSettings);
            Alert.alert(
                'Error',
                error.response?.data?.message ?? 'Failed to update notification settings.'
            );
        } finally {
            setNotificationBusy(null);
        }
    };

    const notificationPreferences = notificationSettings.preferences;
    const notificationStatusText = !isPushNotificationsSupported()
        ? getPushNotificationsUnavailableReason() ??
          'Push notifications are not available in this build.'
        : !APP_CONFIG.EAS_PROJECT_ID
          ? 'Add an Expo project ID to finish push setup for builds.'
          : !notificationPreferences.pushEnabled
            ? 'Push alerts are turned off.'
            : notificationSettings.hasActiveDevice
              ? `Active on ${notificationSettings.registeredDevicesCount} device${
                    notificationSettings.registeredDevicesCount === 1 ? '' : 's'
                }.`
              : notificationMessage ||
                'Enable permission and reconnect this device to receive alerts.';

    const notificationMetaText = notificationSettings.lastRegisteredAt
        ? `Last synced ${new Date(notificationSettings.lastRegisteredAt).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            })}`
        : 'Urgent invites and expiry alerts will still fall back to email.';

    const notificationSummary = !notificationPreferences.pushEnabled
        ? 'Push alerts off'
        : notificationSettings.hasActiveDevice
          ? `${notificationSettings.registeredDevicesCount} device${
                notificationSettings.registeredDevicesCount === 1 ? '' : 's'
            } linked`
          : 'Needs setup';

    const handleBack = () => {
        router.replace('/(student)/profile');
    };

    if (loading) {
        return (
            <LoadingSpinner
                title="Loading your settings"
                message="We are preparing your security, appearance, and notification preferences."
            />
        );
    }

    return (
        <>
            <StatusBar
                barStyle={theme.dark ? 'light-content' : 'dark-content'}
                backgroundColor={palette.surface}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={[styles.flex, { backgroundColor: palette.pageBackground }]}
            >
                <ScrollView
                    style={[styles.container, { backgroundColor: palette.pageBackground }]}
                    contentContainerStyle={[
                        styles.content,
                        {
                            backgroundColor: palette.pageBackground,
                            paddingBottom: bottomContentPadding,
                        },
                    ]}
                    showsVerticalScrollIndicator={false}
                    {...swipeHandlers}
                >
                    <StudentHero
                        insetTop={insets.top}
                        variant="surface"
                        // eyebrow="Settings"
                        title="Security & preferences"
                        subtitle="Manage password, appearance, and alert preferences from one place."
                        align="left"
                        leadingAccessory={
                            <TouchableOpacity
                                style={[
                                    styles.backButton,
                                    {
                                        backgroundColor: palette.surfaceMuted,
                                        borderColor: palette.border,
                                    },
                                ]}
                                activeOpacity={0.8}
                                onPress={handleBack}
                            >
                                <MaterialCommunityIcons
                                    name="chevron-left"
                                    size={22}
                                    color={palette.textPrimary}
                                />
                            </TouchableOpacity>
                        }
                    >
                        <View style={styles.heroMetaRow}>
                            <View
                                style={[
                                    styles.heroMetaCard,
                                    {
                                        backgroundColor: palette.surfaceMuted,
                                        borderColor: palette.border,
                                    },
                                ]}
                            >
                                <Text style={[styles.heroMetaLabel, { color: palette.textSecondary }]}>
                                    Appearance
                                </Text>
                                <Text style={[styles.heroMetaValue, { color: palette.textPrimary }]}>
                                    {isDark ? 'Dark mode' : 'Light mode'}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.heroMetaCard,
                                    {
                                        backgroundColor: palette.surfaceMuted,
                                        borderColor: palette.border,
                                    },
                                ]}
                            >
                                <Text style={[styles.heroMetaLabel, { color: palette.textSecondary }]}>
                                    Alerts
                                </Text>
                                <Text style={[styles.heroMetaValue, { color: palette.textPrimary }]}>
                                    {notificationSummary}
                                </Text>
                            </View>
                        </View>
                    </StudentHero>

                    <View style={styles.contentWrap}>
                        <Reveal delay={60}>
                            <View
                                style={[
                                    styles.card,
                                    {
                                        backgroundColor: palette.surface,
                                        borderColor: palette.border,
                                        shadowColor: palette.shadow,
                                    },
                                ]}
                            >
                                <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                                    Security
                                </Text>

                                <TouchableOpacity
                                    style={styles.settingRow}
                                    onPress={() => setPwModalVisible(true)}
                                    activeOpacity={0.75}
                                >
                                    <View
                                        style={[
                                            styles.settingIconWrap,
                                            { backgroundColor: primaryTint },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="lock-outline"
                                            size={18}
                                            color={palette.primary}
                                        />
                                    </View>
                                    <View style={styles.settingCopy}>
                                        <Text
                                            style={[
                                                styles.settingLabel,
                                                { color: palette.textPrimary },
                                            ]}
                                        >
                                            Change Password
                                        </Text>
                                        <Text
                                            style={[
                                                styles.settingHint,
                                                { color: palette.textSecondary },
                                            ]}
                                        >
                                            Update your password to keep your account secure.
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons
                                        name="chevron-right"
                                        size={20}
                                        color={palette.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
                        </Reveal>

                        <Reveal delay={120}>
                            <View
                                style={[
                                    styles.card,
                                    {
                                        backgroundColor: palette.surface,
                                        borderColor: palette.border,
                                        shadowColor: palette.shadow,
                                    },
                                ]}
                            >
                                <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                                    Appearance
                                </Text>

                                <View style={styles.settingRow}>
                                    <View
                                        style={[
                                            styles.settingIconWrap,
                                            { backgroundColor: primaryTint },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name={isDark ? 'weather-night' : 'white-balance-sunny'}
                                            size={18}
                                            color={palette.primary}
                                        />
                                    </View>
                                    <View style={styles.settingCopy}>
                                        <Text
                                            style={[
                                                styles.settingLabel,
                                                { color: palette.textPrimary },
                                            ]}
                                        >
                                            Dark Mode
                                        </Text>
                                        <Text
                                            style={[
                                                styles.settingHint,
                                                { color: palette.textSecondary },
                                            ]}
                                        >
                                            Switch between light and dark appearance across the app.
                                        </Text>
                                    </View>
                                    <Switch
                                        value={isDark}
                                        onValueChange={handleThemeToggle}
                                        trackColor={{ false: '#D5DDE7', true: '#8EC5FF' }}
                                        thumbColor={isDark ? palette.primary : '#F4F3F4'}
                                    />
                                </View>
                            </View>
                        </Reveal>

                        <Reveal delay={180}>
                            <View
                                style={[
                                    styles.card,
                                    {
                                        backgroundColor: palette.surface,
                                        borderColor: palette.border,
                                        shadowColor: palette.shadow,
                                    },
                                ]}
                            >
                                <Text style={[styles.sectionLabel, { color: palette.textSecondary }]}>
                                    Notifications
                                </Text>

                                <View style={styles.settingRow}>
                                    <View
                                        style={[
                                            styles.settingIconWrap,
                                            { backgroundColor: successTint },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="bell-ring-outline"
                                            size={18}
                                            color={palette.success}
                                        />
                                    </View>
                                    <View style={styles.settingCopy}>
                                        <Text
                                            style={[
                                                styles.settingLabel,
                                                { color: palette.textPrimary },
                                            ]}
                                        >
                                            Push Alerts
                                        </Text>
                                        <Text
                                            style={[
                                                styles.settingHint,
                                                { color: palette.textSecondary },
                                            ]}
                                        >
                                            {notificationStatusText}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={notificationPreferences.pushEnabled}
                                        onValueChange={(value) =>
                                            handleNotificationToggle('pushEnabled', value)
                                        }
                                        trackColor={{ false: '#D5DDE7', true: '#9CD7A7' }}
                                        thumbColor={
                                            notificationPreferences.pushEnabled
                                                ? palette.success
                                                : '#F4F3F4'
                                        }
                                        disabled={notificationBusy === 'pushEnabled'}
                                    />
                                </View>

                                <View
                                    style={[styles.sep, { backgroundColor: palette.divider }]}
                                />

                                <TouchableOpacity
                                    style={styles.settingRow}
                                    activeOpacity={0.75}
                                    onPress={handleReconnectDevice}
                                    disabled={notificationBusy === 'reconnect'}
                                >
                                    <View
                                        style={[
                                            styles.settingIconWrap,
                                            { backgroundColor: primaryTint },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="cellphone-link"
                                            size={18}
                                            color={palette.primary}
                                        />
                                    </View>
                                    <View style={styles.settingCopy}>
                                        <Text
                                            style={[
                                                styles.settingLabel,
                                                { color: palette.textPrimary },
                                            ]}
                                        >
                                            Reconnect This Device
                                        </Text>
                                        <Text
                                            style={[
                                                styles.settingHint,
                                                { color: palette.textSecondary },
                                            ]}
                                        >
                                            {notificationMetaText}
                                        </Text>
                                    </View>
                                    {notificationBusy === 'reconnect' ? (
                                        <ActivityIndicator size={18} color={palette.primary} />
                                    ) : (
                                        <MaterialCommunityIcons
                                            name="chevron-right"
                                            size={20}
                                            color={palette.textMuted}
                                        />
                                    )}
                                </TouchableOpacity>

                                <View
                                    style={[styles.sep, { backgroundColor: palette.divider }]}
                                />

                                <View style={styles.settingRow}>
                                    <View
                                        style={[
                                            styles.settingIconWrap,
                                            { backgroundColor: warningTint },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="email-sync-outline"
                                            size={18}
                                            color={palette.warning}
                                        />
                                    </View>
                                    <View style={styles.settingCopy}>
                                        <Text
                                            style={[
                                                styles.settingLabel,
                                                { color: palette.textPrimary },
                                            ]}
                                        >
                                            Email Backup
                                        </Text>
                                        <Text
                                            style={[
                                                styles.settingHint,
                                                { color: palette.textSecondary },
                                            ]}
                                        >
                                            Send email too when push is unavailable or an invitation is urgent.
                                        </Text>
                                    </View>
                                    <Switch
                                        value={notificationPreferences.emailEscalationEnabled}
                                        onValueChange={(value) =>
                                            handleNotificationToggle(
                                                'emailEscalationEnabled',
                                                value
                                            )
                                        }
                                        trackColor={{ false: '#D5DDE7', true: '#FFD08A' }}
                                        thumbColor={
                                            notificationPreferences.emailEscalationEnabled
                                                ? palette.warning
                                                : '#F4F3F4'
                                        }
                                        disabled={
                                            notificationBusy === 'emailEscalationEnabled'
                                        }
                                    />
                                </View>

                                <View
                                    style={[styles.sep, { backgroundColor: palette.divider }]}
                                />

                                <View style={styles.settingRow}>
                                    <View
                                        style={[
                                            styles.settingIconWrap,
                                            { backgroundColor: primaryTint },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="account-multiple-outline"
                                            size={18}
                                            color={palette.primary}
                                        />
                                    </View>
                                    <View style={styles.settingCopy}>
                                        <Text
                                            style={[
                                                styles.settingLabel,
                                                { color: palette.textPrimary },
                                            ]}
                                        >
                                            Room Invite Alerts
                                        </Text>
                                        <Text
                                            style={[
                                                styles.settingHint,
                                                { color: palette.textSecondary },
                                            ]}
                                        >
                                            Get notified immediately when a friend reserves a bed for you.
                                        </Text>
                                    </View>
                                    <Switch
                                        value={notificationPreferences.invitationCreated}
                                        onValueChange={(value) =>
                                            handleNotificationToggle('invitationCreated', value)
                                        }
                                        trackColor={{ false: '#D5DDE7', true: '#8EC5FF' }}
                                        thumbColor={
                                            notificationPreferences.invitationCreated
                                                ? palette.primary
                                                : '#F4F3F4'
                                        }
                                        disabled={notificationBusy === 'invitationCreated'}
                                    />
                                </View>

                                <View
                                    style={[styles.sep, { backgroundColor: palette.divider }]}
                                />

                                <View style={styles.settingRow}>
                                    <View
                                        style={[
                                            styles.settingIconWrap,
                                            { backgroundColor: primaryTint },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="account-check-outline"
                                            size={18}
                                            color={palette.primary}
                                        />
                                    </View>
                                    <View style={styles.settingCopy}>
                                        <Text
                                            style={[
                                                styles.settingLabel,
                                                { color: palette.textPrimary },
                                            ]}
                                        >
                                            Invite Responses & Expiry
                                        </Text>
                                        <Text
                                            style={[
                                                styles.settingHint,
                                                { color: palette.textSecondary },
                                            ]}
                                        >
                                            See when friends approve, reject, or allow an invite to expire.
                                        </Text>
                                    </View>
                                    <Switch
                                        value={
                                            notificationPreferences.invitationUpdates &&
                                            notificationPreferences.invitationExpired
                                        }
                                        onValueChange={(value) =>
                                            handleNotificationPairToggle(
                                                'invitationUpdates',
                                                'invitationExpired',
                                                value
                                            )
                                        }
                                        trackColor={{ false: '#D5DDE7', true: '#8EC5FF' }}
                                        thumbColor={
                                            notificationPreferences.invitationUpdates &&
                                            notificationPreferences.invitationExpired
                                                ? palette.primary
                                                : '#F4F3F4'
                                        }
                                        disabled={notificationBusy === 'invitationUpdates'}
                                    />
                                </View>

                                <View
                                    style={[styles.sep, { backgroundColor: palette.divider }]}
                                />

                                <View style={styles.settingRow}>
                                    <View
                                        style={[
                                            styles.settingIconWrap,
                                            { backgroundColor: primaryTint },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="credit-card-check-outline"
                                            size={18}
                                            color={palette.primary}
                                        />
                                    </View>
                                    <View style={styles.settingCopy}>
                                        <Text
                                            style={[
                                                styles.settingLabel,
                                                { color: palette.textPrimary },
                                            ]}
                                        >
                                            Payment & Reservation Updates
                                        </Text>
                                        <Text
                                            style={[
                                                styles.settingHint,
                                                { color: palette.textSecondary },
                                            ]}
                                        >
                                            Keep payment confirmation and confirmed-room updates on this phone.
                                        </Text>
                                    </View>
                                    <Switch
                                        value={
                                            notificationPreferences.paymentUpdates &&
                                            notificationPreferences.reservationUpdates
                                        }
                                        onValueChange={(value) =>
                                            handleNotificationPairToggle(
                                                'paymentUpdates',
                                                'reservationUpdates',
                                                value
                                            )
                                        }
                                        trackColor={{ false: '#D5DDE7', true: '#8EC5FF' }}
                                        thumbColor={
                                            notificationPreferences.paymentUpdates &&
                                            notificationPreferences.reservationUpdates
                                                ? palette.primary
                                                : '#F4F3F4'
                                        }
                                        disabled={notificationBusy === 'paymentUpdates'}
                                    />
                                </View>
                            </View>
                        </Reveal>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                visible={pwModalVisible}
                transparent
                animationType="slide"
                onRequestClose={closePwModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={closePwModal}
                    />
                    <View style={[styles.modalBox, { backgroundColor: palette.surface }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                            Change Password
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: palette.textSecondary }]}>
                            Enter your current password, then choose a new one.
                        </Text>
                        <Divider style={{ marginBottom: 20, marginTop: 4 }} />

                        <TextInput
                            mode="outlined"
                            label="Current Password"
                            value={currentPw}
                            onChangeText={setCurrentPw}
                            secureTextEntry={!showCurrentPw}
                            right={
                                <TextInput.Icon
                                    icon={showCurrentPw ? 'eye-off-outline' : 'eye-outline'}
                                    onPress={() => setShowCurrentPw((value) => !value)}
                                />
                            }
                            style={styles.input}
                            disabled={pwSaving}
                            outlineColor={palette.border}
                            activeOutlineColor={palette.primary}
                        />

                        <TextInput
                            mode="outlined"
                            label="New Password"
                            value={newPw}
                            onChangeText={setNewPw}
                            secureTextEntry={!showNewPw}
                            right={
                                <TextInput.Icon
                                    icon={showNewPw ? 'eye-off-outline' : 'eye-outline'}
                                    onPress={() => setShowNewPw((value) => !value)}
                                />
                            }
                            style={styles.input}
                            disabled={pwSaving}
                            outlineColor={palette.border}
                            activeOutlineColor={palette.primary}
                        />

                        <TextInput
                            mode="outlined"
                            label="Confirm New Password"
                            value={confirmPw}
                            onChangeText={setConfirmPw}
                            secureTextEntry={!showConfirmPw}
                            right={
                                <TextInput.Icon
                                    icon={showConfirmPw ? 'eye-off-outline' : 'eye-outline'}
                                    onPress={() => setShowConfirmPw((value) => !value)}
                                />
                            }
                            style={styles.input}
                            disabled={pwSaving}
                            outlineColor={palette.border}
                            activeOutlineColor={palette.primary}
                        />

                        <View style={styles.editActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={closePwModal}
                                disabled={pwSaving}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, pwSaving && { opacity: 0.7 }]}
                                onPress={handleChangePassword}
                                disabled={pwSaving}
                            >
                                {pwSaving ? (
                                    <ActivityIndicator size={16} color="#FFF" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Update</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: 'transparent' },
    content: {},
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentWrap: {
        paddingHorizontal: 18,
        paddingTop: 16,
        gap: 18,
    },
    heroMetaRow: {
        marginTop: 22,
        flexDirection: 'row',
        gap: 12,
    },
    heroMetaCard: {
        flex: 1,
        minHeight: 84,
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 14,
        justifyContent: 'space-between',
    },
    heroMetaLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    heroMetaValue: {
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 22,
    },
    card: {
        borderRadius: 24,
        borderWidth: 1,
        paddingHorizontal: 18,
        paddingVertical: 18,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 10,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        gap: 12,
    },
    settingIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingCopy: {
        flex: 1,
        gap: 2,
    },
    settingLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    settingHint: {
        fontSize: 12,
        lineHeight: 17,
    },
    sep: {
        height: 1,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    modalBox: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingBottom: 32,
        paddingTop: 12,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E0E0E0',
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontWeight: '700',
        fontSize: 18,
        marginBottom: 2,
    },
    modalSubtitle: {
        fontSize: 13,
        marginBottom: 4,
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'transparent',
        fontSize: 14,
    },
    editActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    cancelBtn: {
        flex: 1,
        height: 46,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 14,
    },
    saveBtn: {
        flex: 1,
        height: 46,
        borderRadius: 16,
        backgroundColor: '#0C4A8C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
});
