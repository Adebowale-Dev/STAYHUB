import React, { useCallback, useMemo, useState } from 'react';
import { Animated, RefreshControl, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { studentAPI } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Reveal } from '../../components/ui/Reveal';
import { StudentHero } from '../../components/ui/StudentHero';
import { useStudentBackSwipe } from '../../components/ui/StudentTabSwipe';
import { getStudentPalette } from '../../constants/design';
import type { StudentNotification } from '../../types';
import { toMobileNotificationRoute } from '../../utils/notificationRoutes';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function formatTimestamp(value?: string) {
    if (!value) {
        return 'Now';
    }

    return new Date(value).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function NotificationsScreen() {
    const theme = useTheme();
    const palette = getStudentPalette(theme.dark);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const bottomContentPadding = Math.max(insets.bottom + 96, 116);
    const swipeHandlers = useStudentBackSwipe('/(student)/profile');
    const scrollY = useState(() => new Animated.Value(0))[0];
    const [notifications, setNotifications] = useState<StudentNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [markingAll, setMarkingAll] = useState(false);
    const [openingId, setOpeningId] = useState<string | null>(null);

    const typeMeta = useMemo<Record<StudentNotification['type'], {
        color: string;
        backgroundColor: string;
        iconBackground: string;
        icon: IconName;
    }>>(
        () => ({
            warning: {
                color: palette.warning,
                backgroundColor: palette.warningSoft,
                iconBackground: palette.surface,
                icon: 'alert-outline',
            },
            info: {
                color: palette.primary,
                backgroundColor: palette.primarySoft,
                iconBackground: palette.surface,
                icon: 'information-outline',
            },
            error: {
                color: palette.danger,
                backgroundColor: palette.dangerSoft,
                iconBackground: palette.surface,
                icon: 'close-circle-outline',
            },
            success: {
                color: palette.success,
                backgroundColor: palette.successSoft,
                iconBackground: palette.surface,
                icon: 'check-circle-outline',
            },
        }),
        [palette]
    );

    const loadNotifications = useCallback(async () => {
        try {
            const response = await studentAPI.getNotifications();
            const payload = response.data as any;
            const data = payload?.data ?? [];
            setNotifications(Array.isArray(data) ? data : []);
        } catch {
            setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadNotifications();
        }, [loadNotifications])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.read).length,
        [notifications]
    );

    const visibleNotifications = useMemo(
        () =>
            filter === 'unread'
                ? notifications.filter((notification) => !notification.read)
                : notifications,
        [filter, notifications]
    );

    const handleOpen = async (notification: StudentNotification) => {
        setOpeningId(notification._id);
        try {
            if (!notification.read) {
                await studentAPI.markNotificationsRead({ ids: [notification._id] });
                setNotifications((current) =>
                    current.map((item) =>
                        item._id === notification._id ? { ...item, read: true } : item
                    )
                );
            }
        } catch {
        } finally {
            setOpeningId(null);
            router.push(toMobileNotificationRoute(notification.destination, '/(student)/reservation'));
        }
    };

    const handleMarkAllRead = async () => {
        setMarkingAll(true);
        try {
            await studentAPI.markNotificationsRead({ markAll: true });
            setNotifications((current) => current.map((item) => ({ ...item, read: true })));
        } catch {
        } finally {
            setMarkingAll(false);
        }
    };

    const handleBack = () => {
        router.replace('/(student)/profile');
    };

    const heroOpacity = scrollY.interpolate({
        inputRange: [0, 42, 78],
        outputRange: [1, 0.62, 0],
        extrapolate: 'clamp',
    });
    const stickyHeaderOpacity = scrollY.interpolate({
        inputRange: [58, 86],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    if (loading) {
        return (
            <LoadingSpinner
                title="Loading notifications"
                message="We are collecting your room invites, payment prompts, and reservation updates."
            />
        );
    }

    return (
        <View className="flex-1" style={{ backgroundColor: palette.pageBackground }}>
            <StatusBar
                barStyle={theme.dark ? 'light-content' : 'dark-content'}
                backgroundColor={palette.surface}
            />

            <Animated.View
                style={[
                    styles.stickyHeaderShell,
                    {
                        backgroundColor: palette.surface,
                        borderBottomColor: palette.border,
                        paddingTop: insets.top + 8,
                        opacity: stickyHeaderOpacity,
                    },
                ]}
            >
                <TouchableOpacity style={styles.stickyBackButton} activeOpacity={0.75} onPress={handleBack}>
                    <MaterialCommunityIcons name="chevron-left" size={25} color={palette.textPrimary} />
                </TouchableOpacity>
                <Text numberOfLines={1} style={[styles.stickyHeaderTitle, { color: palette.textPrimary }]}>
                    Stay on top of updates
                </Text>
                <View style={styles.stickyHeaderTrailingSpace} />
            </Animated.View>

            <Animated.ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: bottomContentPadding }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={palette.primary}
                        colors={[palette.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
                {...swipeHandlers}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
            >
                <Animated.View style={{ opacity: heroOpacity }}>
                    <StudentHero
                        insetTop={insets.top}
                        title="Stay on top of updates"
                        subtitle="See invitations, approvals, reminders, and reservation activity in one place."
                        variant="surface"
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
                    <View className="mt-6 flex-row gap-2.5">
                        <View
                            style={[
                                styles.heroStatCard,
                                {
                                    backgroundColor: palette.surfaceMuted,
                                    borderColor: palette.border,
                                },
                            ]}
                        >
                            <Text
                                className="text-2xl font-extrabold"
                                style={{ color: palette.textPrimary }}
                            >
                                {unreadCount}
                            </Text>
                            <Text
                                className="text-[12px] font-bold leading-[18px]"
                                style={{ color: palette.textSecondary }}
                            >
                                Unread
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.heroStatCard,
                                {
                                    backgroundColor: palette.surfaceMuted,
                                    borderColor: palette.border,
                                },
                            ]}
                        >
                            <Text
                                className="text-2xl font-extrabold"
                                style={{ color: palette.textPrimary }}
                            >
                                {notifications.length}
                            </Text>
                            <Text
                                className="text-[12px] font-bold leading-[18px]"
                                style={{ color: palette.textSecondary }}
                            >
                                Total alerts
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.heroStatCard,
                                {
                                    backgroundColor: palette.surfaceMuted,
                                    borderColor: palette.border,
                                },
                            ]}
                        >
                            <Text
                                className="text-2xl font-extrabold"
                                style={{ color: palette.textPrimary }}
                            >
                                {notifications.length - unreadCount}
                            </Text>
                            <Text
                                className="text-[12px] font-bold leading-[18px]"
                                style={{ color: palette.textSecondary }}
                            >
                                Reviewed
                            </Text>
                        </View>
                    </View>
                    </StudentHero>
                </Animated.View>

                <View className="px-[18px] pt-[16px]">
                    <Reveal delay={60}>
                        <View
                            style={[
                                styles.controlsPanel,
                                {
                                    backgroundColor: palette.surface,
                                    borderColor: palette.border,
                                    shadowColor: palette.shadow,
                                },
                            ]}
                        >
                            <View style={styles.controlsHeader}>
                                <View>
                                    <Text
                                        className="mb-1 text-[11px] font-extrabold uppercase tracking-[1px]"
                                        style={{ color: palette.textMuted }}
                                    >
                                        Filter
                                    </Text>
                                    <Text
                                        className="text-[20px] font-extrabold"
                                        style={{ color: palette.textPrimary }}
                                    >
                                        Activity feed
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.markAllButton,
                                        { backgroundColor: palette.primarySoft },
                                        unreadCount === 0 && styles.disabledButton,
                                    ]}
                                    activeOpacity={0.85}
                                    onPress={handleMarkAllRead}
                                    disabled={markingAll || unreadCount === 0}
                                >
                                    {markingAll ? (
                                        <ActivityIndicator size="small" color={palette.primary} />
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons
                                                name="check-all"
                                                size={18}
                                                color={palette.primary}
                                            />
                                            <Text style={[styles.markAllText, { color: palette.primary }]}>
                                                Mark all read
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <SegmentedButtons
                                value={filter}
                                onValueChange={(value) => setFilter(value as 'all' | 'unread')}
                                buttons={[
                                    { value: 'all', label: `All (${notifications.length})` },
                                    { value: 'unread', label: `Unread (${unreadCount})` },
                                ]}
                                style={styles.segmented}
                            />
                        </View>
                    </Reveal>

                    <View className="pt-[22px]">
                        {visibleNotifications.length === 0 ? (
                            <Reveal delay={120}>
                                <View
                                    style={[
                                        styles.emptyPanel,
                                        {
                                            backgroundColor: palette.surface,
                                            borderColor: palette.border,
                                            shadowColor: palette.shadow,
                                        },
                                    ]}
                                >
                                    <View style={[styles.emptyIconWrap, { backgroundColor: palette.primarySoft }]}>
                                        <MaterialCommunityIcons
                                            name="bell-sleep-outline"
                                            size={34}
                                            color={palette.primary}
                                        />
                                    </View>
                                    <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
                                        {filter === 'unread' ? 'No unread notifications' : 'Nothing here yet'}
                                    </Text>
                                    <Text style={[styles.emptyCopy, { color: palette.textSecondary }]}>
                                        {filter === 'unread'
                                            ? 'You are all caught up. New room activity will appear here as soon as it happens.'
                                            : 'When friends reserve beds, payments update, or room status changes, you will see it here.'}
                                    </Text>
                                </View>
                            </Reveal>
                        ) : (
                            visibleNotifications.map((notification, index) => {
                                const meta = typeMeta[notification.type] ?? typeMeta.info;
                                const isOpening = openingId === notification._id;

                                return (
                                    <Reveal key={notification._id} delay={120 + index * 55}>
                                        <TouchableOpacity
                                            style={[
                                                styles.notificationCard,
                                                {
                                                    backgroundColor: palette.surface,
                                                    borderColor: palette.border,
                                                    shadowColor: palette.shadow,
                                                },
                                            ]}
                                            activeOpacity={0.85}
                                            onPress={() => handleOpen(notification)}
                                        >
                                            <View style={[styles.notificationAccent, { backgroundColor: meta.color }]} />

                                            <View style={styles.notificationContent}>
                                                <View style={styles.notificationTopRow}>
                                                    <View
                                                        style={[
                                                            styles.notificationIconBox,
                                                            { backgroundColor: meta.iconBackground },
                                                        ]}
                                                    >
                                                        <MaterialCommunityIcons
                                                            name={(notification.icon as IconName) || meta.icon}
                                                            size={20}
                                                            color={meta.color}
                                                        />
                                                    </View>

                                                    <View style={styles.notificationCopy}>
                                                        <View style={styles.notificationHeader}>
                                                            <Text
                                                                style={[
                                                                    styles.notificationTitle,
                                                                    { color: palette.textPrimary },
                                                                ]}
                                                                numberOfLines={2}
                                                            >
                                                                {notification.title || 'StayHub update'}
                                                            </Text>
                                                            {!notification.read ? (
                                                                <View
                                                                    style={[
                                                                        styles.unreadDot,
                                                                        { backgroundColor: palette.primary },
                                                                    ]}
                                                                />
                                                            ) : null}
                                                        </View>
                                                        <Text
                                                            style={[
                                                                styles.notificationMessage,
                                                                { color: palette.textSecondary },
                                                            ]}
                                                            numberOfLines={3}
                                                        >
                                                            {notification.message}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View style={styles.notificationFooter}>
                                                    <View
                                                        style={[
                                                            styles.notificationTypePill,
                                                            { backgroundColor: meta.backgroundColor },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.notificationTypeText,
                                                                { color: meta.color },
                                                            ]}
                                                        >
                                                            {notification.read ? 'Reviewed' : 'Unread'}
                                                        </Text>
                                                    </View>
                                                    <Text
                                                        style={[
                                                            styles.notificationTimestamp,
                                                            { color: palette.textSecondary },
                                                        ]}
                                                    >
                                                        {formatTimestamp(notification.createdAt)}
                                                    </Text>
                                                </View>

                                                <View
                                                    style={[
                                                        styles.notificationActionRow,
                                                        { borderTopColor: palette.divider },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.notificationActionText,
                                                            { color: palette.primary },
                                                        ]}
                                                    >
                                                        {isOpening ? 'Opening...' : 'Open update'}
                                                    </Text>
                                                    {isOpening ? (
                                                        <ActivityIndicator size="small" color={palette.primary} />
                                                    ) : (
                                                        <MaterialCommunityIcons
                                                            name="arrow-right"
                                                            size={18}
                                                            color={palette.primary}
                                                        />
                                                    )}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </Reveal>
                                );
                            })
                        )}
                    </View>
                </View>
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    stickyHeaderShell: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        minHeight: 76,
        paddingHorizontal: 18,
        paddingBottom: 12,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        overflow: 'hidden',
    },
    stickyBackButton: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    stickyHeaderTitle: {
        flex: 1,
        fontSize: 20,
        lineHeight: 25,
        fontWeight: '800',
        letterSpacing: -0.35,
        textAlign: 'center',
    },
    stickyHeaderTrailingSpace: {
        width: 34,
        height: 34,
        flexShrink: 0,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroStatCard: {
        flex: 1,
        minHeight: 84,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 14,
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        borderWidth: 1,
    },
    controlsPanel: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 18,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 10,
    },
    controlsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    markAllButton: {
        minHeight: 42,
        borderRadius: 14,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    markAllText: {
        fontSize: 13,
        fontWeight: '800',
    },
    segmented: {
        minHeight: 42,
    },
    disabledButton: {
        opacity: 0.55,
    },
    emptyPanel: {
        borderRadius: 24,
        borderWidth: 1,
        paddingHorizontal: 24,
        paddingVertical: 28,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 10,
    },
    emptyIconWrap: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyCopy: {
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
    },
    notificationCard: {
        flexDirection: 'row',
        borderRadius: 22,
        overflow: 'hidden',
        marginBottom: 14,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
    },
    notificationAccent: {
        width: 5,
    },
    notificationContent: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    notificationTopRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    notificationIconBox: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    notificationCopy: {
        flex: 1,
        gap: 6,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    notificationTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 22,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 5,
    },
    notificationMessage: {
        fontSize: 13,
        lineHeight: 20,
    },
    notificationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        marginTop: 14,
    },
    notificationTypePill: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    notificationTypeText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    notificationTimestamp: {
        fontSize: 11,
        fontWeight: '600',
    },
    notificationActionRow: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    notificationActionText: {
        fontSize: 13,
        fontWeight: '800',
    },
});
