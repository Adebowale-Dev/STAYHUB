import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { studentAPI } from '../services/api';
import type { StudentNotification } from '../types';
import { toMobileNotificationRoute } from '../utils/notificationRoutes';
import { getStudentPalette } from '../constants/design';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function formatTimestamp(value?: string) {
    if (!value) {
        return 'Now';
    }

    return new Date(value).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function AlertsCard() {
    const theme = useTheme();
    const palette = getStudentPalette(theme.dark);
    const toneStyles: Record<
        StudentNotification['type'],
        {
            iconBackground: string;
            iconColor: string;
            accentColor: string;
        }
    > = {
        warning: {
            iconBackground: palette.warningSoft,
            iconColor: palette.warning,
            accentColor: palette.warning,
        },
        info: {
            iconBackground: palette.primarySoft,
            iconColor: palette.primary,
            accentColor: palette.primary,
        },
        error: {
            iconBackground: palette.dangerSoft,
            iconColor: palette.danger,
            accentColor: palette.danger,
        },
        success: {
            iconBackground: palette.successSoft,
            iconColor: palette.success,
            accentColor: palette.success,
        },
    };
    const router = useRouter();
    const [notifications, setNotifications] = useState<StudentNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

    const loadNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const response = await studentAPI.getNotifications();
            const payload = response.data as any;
            const data = payload?.data ?? [];
            setNotifications(Array.isArray(data) ? data : []);
        }
        catch {
            setNotifications([]);
        }
        finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadNotifications();
        }, [loadNotifications]),
    );

    const markRead = async (notification: StudentNotification, navigate = false) => {
        setUpdatingIds((current) => new Set(current).add(notification._id));
        try {
            if (!notification.read) {
                await studentAPI.markNotificationsRead({ ids: [notification._id] });
                setNotifications((current) =>
                    current.map((item) =>
                        item._id === notification._id ? { ...item, read: true } : item,
                    ),
                );
            }
        }
        catch {
        }
        finally {
            setUpdatingIds((current) => {
                const next = new Set(current);
                next.delete(notification._id);
                return next;
            });

            if (navigate) {
                router.push(toMobileNotificationRoute(notification.destination));
            }
        }
    };

    const unread = notifications.filter((notification) => !notification.read);

    if (loading) {
        return (
            <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={palette.primary} />
            </View>
        );
    }

    if (unread.length === 0) {
        return null;
    }

    return (
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
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderCopy}>
                    <Text style={[styles.headerEyebrow, { color: palette.textMuted }]}>
                        Notifications
                    </Text>
                    <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
                        Recent updates
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: palette.textSecondary }]}>
                        Your latest unread activity is listed here so you can act quickly.
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.viewAllButton, { backgroundColor: palette.primarySoft }]}
                    activeOpacity={0.9}
                    onPress={() => router.push('/(student)/notifications')}
                >
                    <Text style={[styles.viewAllText, { color: palette.primary }]}>View all</Text>
                    <MaterialCommunityIcons name="arrow-right" size={16} color={palette.primary} />
                </TouchableOpacity>
            </View>

            <View style={[styles.summaryStrip, { backgroundColor: palette.surfaceMuted }]}>
                <View style={[styles.summaryBadge, { backgroundColor: palette.primary }]}>
                    <Text style={styles.summaryBadgeText}>{unread.length}</Text>
                </View>
                <Text style={[styles.summaryText, { color: palette.textSecondary }]}>
                    {unread.length === 1
                        ? 'One unread update needs your attention.'
                        : `${unread.length} unread updates need your attention.`}
                </Text>
            </View>

            <View style={styles.list}>
                {unread.slice(0, 3).map((notification, index) => {
                    const tone = toneStyles[notification.type] ?? toneStyles.info;
                    const isUpdating = updatingIds.has(notification._id);
                    const isLast = index === Math.min(unread.length, 3) - 1;

                    return (
                        <View key={notification._id}>
                            <TouchableOpacity
                                style={[
                                    styles.notificationCard,
                                    {
                                        backgroundColor: palette.surfaceRaised,
                                        borderColor: palette.border,
                                    },
                                ]}
                                activeOpacity={0.9}
                                onPress={() => markRead(notification, true)}
                            >
                                <View
                                    style={[
                                        styles.notificationAccent,
                                        { backgroundColor: tone.accentColor },
                                    ]}
                                />

                                <View style={styles.notificationBody}>
                                    <View
                                        style={[
                                            styles.iconBox,
                                            { backgroundColor: tone.iconBackground },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name={(notification.icon as IconName) || 'information-outline'}
                                            size={18}
                                            color={tone.iconColor}
                                        />
                                    </View>

                                    <View style={styles.copyWrap}>
                                        <Text
                                            style={[styles.message, { color: palette.textPrimary }]}
                                            numberOfLines={2}
                                        >
                                            {notification.message}
                                        </Text>
                                        <Text
                                            style={[styles.timestamp, { color: palette.textSecondary }]}
                                            numberOfLines={1}
                                        >
                                            {formatTimestamp(notification.createdAt)}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => markRead(notification)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        style={[
                                            styles.dismissButton,
                                            { backgroundColor: palette.surfaceTint },
                                        ]}
                                        accessibilityLabel="Mark notification as read"
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? (
                                            <ActivityIndicator
                                                size="small"
                                                color={palette.textSecondary}
                                            />
                                        ) : (
                                            <MaterialCommunityIcons
                                                name="check-circle-outline"
                                                size={18}
                                                color={palette.primary}
                                            />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>

                            {!isLast ? (
                                <View
                                    style={[
                                        styles.rowDivider,
                                        { backgroundColor: palette.divider },
                                    ]}
                                />
                            ) : null}
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingRow: {
        alignItems: 'center',
        paddingVertical: 14,
    },
    card: {
        borderRadius: 28,
        borderWidth: 1,
        paddingHorizontal: 18,
        paddingVertical: 18,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    cardHeaderCopy: {
        flex: 1,
    },
    headerEyebrow: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 13,
        lineHeight: 20,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '800',
    },
    summaryStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 16,
    },
    summaryBadge: {
        minWidth: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    summaryBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    summaryText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 18,
    },
    list: {
        gap: 10,
    },
    notificationCard: {
        borderRadius: 22,
        borderWidth: 1,
        overflow: 'hidden',
        flexDirection: 'row',
    },
    notificationAccent: {
        width: 4,
    },
    notificationBody: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    iconBox: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    copyWrap: {
        flex: 1,
        gap: 5,
    },
    message: {
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '700',
    },
    timestamp: {
        fontSize: 11,
        fontWeight: '700',
    },
    dismissButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowDivider: {
        height: 1,
        marginVertical: 2,
    },
});
