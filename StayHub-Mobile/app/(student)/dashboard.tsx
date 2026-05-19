import React, { useEffect, useMemo, useState } from 'react';
import {
    Image,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paymentAPI, studentAPI } from '../../services/api';
import AlertsCard from '../../components/AlertsCard';
import { Reveal } from '../../components/ui/Reveal';
import { useAuthStore } from '../../store/authStore';
import type { DashboardData } from '../../types';
import { getStudentPalette } from '../../constants/design';
import { StudentHero } from '../../components/ui/StudentHero';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useStudentTabSwipe } from '../../components/ui/StudentTabSwipe';

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) {
        return 'Good morning';
    }
    if (hour < 17) {
        return 'Good afternoon';
    }
    return 'Good evening';
}

function formatReservationStatus(value?: string | null) {
    if (!value) {
        return 'No reservation';
    }

    return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAmountLabel(amount: number | null) {
    return amount != null ? `NGN ${amount.toLocaleString()}` : 'Pending';
}

export default function DashboardScreen() {
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
    const user = useAuthStore((state) => state.user);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const palette = getStudentPalette(theme.dark);
    const swipeHandlers = useStudentTabSwipe('dashboard');

    const loadDashboard = async () => {
        setError(false);
        try {
            const response = await studentAPI.getDashboard();
            const data: DashboardData = response.data.data ?? (response.data as any);
            setDashboard(data);

            if (data?.paymentStatus !== 'paid') {
                try {
                    const amountResponse = await paymentAPI.getAmount();
                    const amount =
                        amountResponse.data.data?.amount ??
                        (amountResponse.data as any)?.amount ??
                        null;
                    setPaymentAmount(typeof amount === 'number' ? amount : null);
                }
                catch {
                    setPaymentAmount(null);
                }
            }
            else {
                setPaymentAmount(null);
            }
        }
        catch {
            setError(true);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboard();
    };

    const initials = useMemo(
        () => `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}` || 'SH',
        [user?.firstName, user?.lastName],
    );

    const department = user?.department
        ? typeof user.department === 'object'
            ? (user.department as any).name
            : user.department
        : null;

    const paymentPaid = dashboard?.paymentStatus === 'paid';
    const reservationStatus = dashboard?.reservationStatus ?? dashboard?.reservation?.status ?? null;
    const hasReservation = dashboard?.hasReservation ?? false;
    const paymentToneColor = paymentPaid ? '#CBEFD2' : '#FFD89C';
    const reservationToneColor = hasReservation ? '#DDEBFF' : 'rgba(255,255,255,0.76)';
    const reservationLabel =
        reservationStatus === 'temporary'
            ? 'Invite pending'
            : hasReservation
                ? 'Room reserved'
                : 'No reservation';
    const reservationStatusTone =
        reservationStatus === 'confirmed'
            ? { backgroundColor: palette.successSoft, color: palette.success }
            : reservationStatus === 'cancelled'
                ? { backgroundColor: palette.dangerSoft, color: palette.danger }
                : { backgroundColor: palette.warningSoft, color: palette.warning };
    const nextStep = !paymentPaid
        ? {
            title: 'Complete your hostel payment',
            description: paymentAmount != null
                ? `Amount due: ${formatAmountLabel(paymentAmount)}. Complete payment so your room process can continue without delay.`
                : 'Open payment to review your fee and complete checkout.',
            icon: 'credit-card-outline' as const,
            route: '/(student)/payment',
            cta: 'Open payment',
            backgroundColor: palette.warningSoft,
            iconBackground: palette.surface,
            iconColor: palette.warning,
            titleColor: palette.warning,
        }
        : reservationStatus === 'temporary'
            ? {
                title: 'Review your room invite',
                description: 'A room is waiting for your approval. Open your reservation and confirm it before the approval window closes.',
                icon: 'email-check-outline' as const,
                route: '/(student)/reservation',
                cta: 'Review invite',
                backgroundColor: palette.primarySoft,
                iconBackground: palette.surface,
                iconColor: palette.primary,
                titleColor: palette.primaryStrong,
            }
            : !hasReservation
                ? {
                    title: 'Reserve a room',
                    description: 'Browse available hostels and secure a room that fits your session before the preferred spaces fill up.',
                    icon: 'home-search-outline' as const,
                    route: '/(student)/hostels',
                    cta: 'Browse hostels',
                    backgroundColor: palette.primarySoft,
                    iconBackground: palette.surface,
                    iconColor: palette.primary,
                    titleColor: palette.primaryStrong,
                }
                : {
                    title: 'Manage your reservation',
                    description: 'Your room is already in place. Open your reservation to review occupants, invite status, and final check-in details.',
                    icon: 'bed-outline' as const,
                    route: '/(student)/reservation',
                    cta: 'View reservation',
                    backgroundColor: palette.successSoft,
                    iconBackground: palette.surface,
                    iconColor: palette.success,
                    titleColor: palette.success,
                };

    if (loading) {
        return (
            <LoadingSpinner
                title="Preparing your dashboard"
                message="Syncing room status, payment details, and current alerts."
            />
        );
    }

    return (
        <View className="flex-1" style={{ backgroundColor: palette.pageBackground }}>
            <StatusBar barStyle="light-content" backgroundColor={palette.hero} />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 144 }}
                showsVerticalScrollIndicator={false}
                {...swipeHandlers}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={palette.primary}
                        colors={[palette.primary]}
                    />
                }
            >
                <StudentHero
                    insetTop={insets.top}
                    title={`${getGreeting()}, ${user?.firstName ?? 'Student'}`}
                    titleAccessory={
                        <View style={styles.avatarRing}>
                            {user?.profilePicture ? (
                                <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarInner}>
                                    <Text style={styles.avatarText}>{initials}</Text>
                                </View>
                            )}
                        </View>
                    }
                >
                    <View className="mb-[18px] mt-4 gap-3">
                        <View className="flex-row flex-wrap gap-2.5">
                            {department ? (
                                <View style={styles.heroMetaPill}>
                                    <MaterialCommunityIcons
                                        name="school-outline"
                                        size={14}
                                        color="#FFFFFF"
                                    />
                                    <Text style={styles.heroMetaText}>
                                        {department}
                                        {user?.level ? ` | ${user.level} Level` : ''}
                                    </Text>
                                </View>
                            ) : null}

                            {user?.matricNumber ? (
                                <View style={styles.heroMetaPill}>
                                    <MaterialCommunityIcons
                                        name="card-account-details-outline"
                                        size={14}
                                        color="#FFFFFF"
                                    />
                                    <Text style={styles.heroMetaText}>{user.matricNumber}</Text>
                                </View>
                            ) : null}
                        </View>

                        {dashboard?.currentSession ? (
                            <View style={styles.sessionPill}>
                                <Text
                                    style={styles.sessionPillText}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {dashboard.currentSession}
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.heroSummaryBar}>
                        <View style={styles.heroSummaryItem}>
                            <Text style={[styles.heroSummaryLabel, { color: paymentToneColor }]}>Payment</Text>
                            <Text style={styles.heroSummaryValue}>{paymentPaid ? 'Cleared' : 'Pending review'}</Text>
                        </View>
                        <View style={styles.heroSummaryDivider} />
                        <View style={styles.heroSummaryItem}>
                            <Text style={[styles.heroSummaryLabel, { color: reservationToneColor }]}>Reservation</Text>
                            <Text style={styles.heroSummaryValue}>{reservationLabel}</Text>
                        </View>
                    </View>
                </StudentHero>

                <View className="mt-3 px-[18px]">
                    {error ? (
                        <View
                            style={[
                                styles.stateCard,
                                {
                                    backgroundColor: palette.surface,
                                    borderColor: palette.border,
                                    shadowColor: palette.shadow,
                                },
                            ]}
                        >
                            <View style={[styles.stateIconWrap, { backgroundColor: palette.dangerSoft }]}>
                                <MaterialCommunityIcons name="wifi-off" size={26} color={palette.danger} />
                            </View>
                            <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>
                                Could not load your dashboard
                            </Text>
                            <Text style={[styles.stateCopy, { color: palette.textSecondary }]}>
                                Check your connection and refresh to continue.
                            </Text>
                            <TouchableOpacity
                                style={[styles.primaryButton, { backgroundColor: palette.primary }]}
                                onPress={() => {
                                    setLoading(true);
                                    loadDashboard();
                                }}
                                activeOpacity={0.9}
                            >
                                <MaterialCommunityIcons name="refresh" size={16} color="#FFFFFF" />
                                <Text style={styles.primaryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="gap-[22px]">
                            <Reveal delay={40}>
                                <View
                                    style={[
                                        styles.summaryCard,
                                        {
                                            backgroundColor: palette.surface,
                                            borderColor: palette.border,
                                            shadowColor: palette.shadow,
                                        },
                                    ]}
                                >
                                    <View style={styles.sectionHeaderRow}>
                                        <View>
                                            <Text className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[1px]" style={{ color: palette.textMuted }}>
                                                Overview
                                            </Text>
                                            <Text className="text-[22px] font-extrabold tracking-[-0.5px]" style={{ color: palette.textPrimary }}>
                                                Your housing summary
                                            </Text>
                                        </View>
                                        <View style={[styles.sectionBadge, { backgroundColor: palette.primarySoft }]}>
                                            <Text style={[styles.sectionBadgeText, { color: palette.primary }]}>Live</Text>
                                        </View>
                                    </View>

                                    <View style={styles.summaryGrid}>
                                        <View style={[styles.summaryTile, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                                            <Text style={[styles.summaryTileLabel, { color: palette.textMuted }]}>Payment status</Text>
                                            <Text style={[styles.summaryTileValue, { color: palette.textPrimary }]}>
                                                {paymentPaid ? 'Paid in full' : 'Pending payment'}
                                            </Text>
                                            <Text style={[styles.summaryTileMeta, { color: palette.textSecondary }]}>
                                                {paymentPaid ? 'No outstanding hostel fee' : formatAmountLabel(paymentAmount)}
                                            </Text>
                                        </View>

                                        <View style={[styles.summaryTile, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                                            <Text style={[styles.summaryTileLabel, { color: palette.textMuted }]}>Reservation status</Text>
                                            <Text style={[styles.summaryTileValue, { color: palette.textPrimary }]}>
                                                {formatReservationStatus(reservationStatus)}
                                            </Text>
                                            <Text style={[styles.summaryTileMeta, { color: palette.textSecondary }]}>
                                                {hasReservation ? 'Your room is already tracked in StayHub' : 'No room has been reserved yet'}
                                            </Text>
                                        </View>

                                        {dashboard?.currentSession ? (
                                            <View style={[styles.summaryTileWide, { backgroundColor: palette.primarySoft, borderColor: palette.border }]}>
                                                <Text style={[styles.summaryTileLabel, { color: palette.primaryStrong }]}>Current session</Text>
                                                <Text style={[styles.summaryTileWideValue, { color: palette.textPrimary }]}>
                                                    {dashboard.currentSession}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            </Reveal>

                            <Reveal delay={90}>
                                <TouchableOpacity
                                    style={[styles.nextStepCard, { backgroundColor: nextStep.backgroundColor }]}
                                    activeOpacity={0.9}
                                    onPress={() => router.push(nextStep.route as any)}
                                >
                                    <View style={styles.nextStepTopRow}>
                                        <View style={[styles.nextStepIconWrap, { backgroundColor: nextStep.iconBackground }]}>
                                            <MaterialCommunityIcons name={nextStep.icon} size={20} color={nextStep.iconColor} />
                                        </View>
                                        <View style={styles.nextStepCopy}>
                                            <Text style={[styles.nextStepEyebrow, { color: palette.textMuted }]}>Next step</Text>
                                            <Text style={[styles.nextStepTitle, { color: nextStep.titleColor }]}>{nextStep.title}</Text>
                                            <Text style={[styles.nextStepDescription, { color: palette.textSecondary }]}>{nextStep.description}</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.nextStepActionRow, { borderTopColor: palette.divider }]}>
                                        <Text style={[styles.nextStepActionText, { color: nextStep.iconColor }]}>{nextStep.cta}</Text>
                                        <View style={[styles.inlineArrowWrap, { backgroundColor: palette.surface }]}>
                                            <MaterialCommunityIcons name="arrow-right" size={16} color={nextStep.iconColor} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </Reveal>

                            <Reveal delay={140}>
                                <AlertsCard />
                            </Reveal>

                            <Reveal delay={190}>
                                {hasReservation && dashboard?.reservation ? (
                                        <TouchableOpacity
                                            style={[
                                                styles.reservationCard,
                                                {
                                                    backgroundColor: palette.surface,
                                                    borderColor: palette.border,
                                                    shadowColor: palette.shadow,
                                                },
                                            ]}
                                            activeOpacity={0.9}
                                            onPress={() => router.push('/(student)/reservation')}
                                        >
                                            <View style={styles.sectionHeaderRow}>
                                                <View>
                                                    <Text className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[1px]" style={{ color: palette.textMuted }}>
                                                        Reservation
                                                    </Text>
                                                    <Text className="text-[22px] font-extrabold tracking-[-0.5px]" style={{ color: palette.textPrimary }}>
                                                        Current room
                                                    </Text>
                                                </View>
                                                <View style={[styles.reservationStatusPill, { backgroundColor: reservationStatusTone.backgroundColor }]}>
                                                    <Text style={[styles.reservationStatusText, { color: reservationStatusTone.color }]}>
                                                        {formatReservationStatus(dashboard.reservation.status)}
                                                    </Text>
                                                </View>
                                            </View>

                                            <Text style={[styles.reservationHostelName, { color: palette.textPrimary }]}>
                                                {dashboard.reservation.hostel?.name ?? 'Assigned hostel'}
                                            </Text>

                                            <View style={styles.reservationDetailsRow}>
                                                <View
                                                    style={[
                                                        styles.reservationMetricCard,
                                                        {
                                                            backgroundColor: palette.surfaceMuted,
                                                            borderColor: palette.border,
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.reservationMetricLabel,
                                                            { color: palette.textMuted },
                                                        ]}
                                                    >
                                                        Room
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.reservationMetricValue,
                                                            { color: palette.textPrimary },
                                                        ]}
                                                    >
                                                        {dashboard.reservation.room?.roomNumber ?? '-'}
                                                    </Text>
                                                </View>

                                                <View
                                                    style={[
                                                        styles.reservationMetricCard,
                                                        {
                                                            backgroundColor: palette.surfaceMuted,
                                                            borderColor: palette.border,
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.reservationMetricLabel,
                                                            { color: palette.textMuted },
                                                        ]}
                                                    >
                                                        Occupancy
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.reservationMetricValue,
                                                            { color: palette.textPrimary },
                                                        ]}
                                                    >
                                                        {dashboard.reservation.room?.currentOccupancy ?? 0}/
                                                        {dashboard.reservation.room?.capacity ?? 0}
                                                    </Text>
                                                </View>
                                            </View>

                                            {(dashboard.reservation.groupMembers?.length ?? 0) > 0 ? (
                                                <Text
                                                    style={[
                                                        styles.groupSummary,
                                                        { color: palette.textSecondary },
                                                    ]}
                                                >
                                                    Group reservation with{' '}
                                                    {dashboard.reservation.groupMembers!.length + 1} members
                                                </Text>
                                            ) : null}

                                            <View style={[styles.reservationActionRow, { borderTopColor: palette.divider }]}>
                                                <Text style={[styles.reservationActionText, { color: palette.primary }]}>
                                                    View full reservation
                                                </Text>
                                                <View
                                                    style={[
                                                        styles.inlineArrowWrap,
                                                        { backgroundColor: palette.primarySoft },
                                                    ]}
                                                >
                                                    <MaterialCommunityIcons
                                                        name="arrow-right"
                                                        size={16}
                                                        color={palette.primary}
                                                    />
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ) : (
                                        <View
                                            style={[
                                                styles.stateCard,
                                                {
                                                    backgroundColor: palette.surface,
                                                    borderColor: palette.border,
                                                    shadowColor: palette.shadow,
                                                },
                                            ]}
                                        >
                                            <View style={[styles.stateIconWrap, { backgroundColor: palette.primarySoft }]}>
                                                <MaterialCommunityIcons name="bed-empty" size={26} color={palette.primary} />
                                            </View>
                                            <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>
                                                No room reserved yet
                                            </Text>
                                            <Text style={[styles.stateCopy, { color: palette.textSecondary }]}>
                                                Browse available hostels and secure your preferred room before the session fills up.
                                            </Text>
                                            <TouchableOpacity
                                                style={[styles.primaryButton, { backgroundColor: palette.primary }]}
                                                onPress={() => router.push('/(student)/hostels')}
                                                activeOpacity={0.9}
                                            >
                                                <MaterialCommunityIcons
                                                    name="home-search-outline"
                                                    size={16}
                                                    color="#FFFFFF"
                                                />
                                                <Text style={styles.primaryButtonText}>Browse hostels</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                            </Reveal>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    heroMetaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 9,
        backgroundColor: 'rgba(255,255,255,0.13)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
    },
    heroMetaText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    sessionPill: {
        alignSelf: 'flex-start',
        borderRadius: 999,
        maxWidth: '100%',
        minHeight: 36,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        justifyContent: 'center',
    },
    sessionPillText: {
        color: '#DCEBFF',
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '700',
    },
    avatarRing: {
        width: 78,
        height: 78,
        borderRadius: 39,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.34)',
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    avatarInner: {
        flex: 1,
        borderRadius: 34,
        backgroundColor: '#2F80ED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 34,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
    },
    heroSummaryBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
    },
    heroSummaryItem: {
        flex: 1,
        gap: 4,
    },
    heroSummaryDivider: {
        width: 1,
        alignSelf: 'stretch',
        marginHorizontal: 14,
        backgroundColor: 'rgba(255,255,255,0.16)',
    },
    heroSummaryLabel: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    heroSummaryValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    summaryCard: {
        borderRadius: 28,
        borderWidth: 1,
        padding: 18,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 10,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    sectionBadge: {
        borderRadius: 999,
        paddingHorizontal: 11,
        paddingVertical: 7,
    },
    sectionBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    summaryTile: {
        width: '48%',
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    summaryTileWide: {
        width: '100%',
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    summaryTileLabel: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    summaryTileValue: {
        fontSize: 17,
        fontWeight: '800',
        lineHeight: 24,
    },
    summaryTileWideValue: {
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 25,
    },
    summaryTileMeta: {
        fontSize: 12,
        lineHeight: 18,
        marginTop: 8,
    },
    nextStepCard: {
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    nextStepTopRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    nextStepIconWrap: {
        width: 46,
        height: 46,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextStepCopy: {
        flex: 1,
        gap: 4,
    },
    nextStepEyebrow: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    nextStepTitle: {
        fontSize: 15,
        fontWeight: '800',
    },
    nextStepDescription: {
        fontSize: 13,
        lineHeight: 19,
    },
    nextStepActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
    },
    nextStepActionText: {
        fontSize: 13,
        fontWeight: '800',
    },
    stateCard: {
        borderRadius: 28,
        borderWidth: 1,
        paddingHorizontal: 24,
        paddingVertical: 28,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 10,
    },
    stateIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    stateTitle: {
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    stateCopy: {
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
        marginBottom: 18,
    },
    primaryButton: {
        minHeight: 50,
        borderRadius: 18,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    reservationCard: {
        borderRadius: 28,
        borderWidth: 1,
        paddingHorizontal: 18,
        paddingVertical: 18,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 10,
    },
    reservationHostelName: {
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 28,
        marginBottom: 16,
    },
    reservationStatusPill: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    reservationStatusText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    reservationDetailsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    reservationMetricCard: {
        flex: 1,
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    reservationMetricLabel: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    reservationMetricValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    groupSummary: {
        fontSize: 13,
        lineHeight: 19,
        marginTop: 14,
    },
    reservationActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
    },
    reservationActionText: {
        fontSize: 13,
        fontWeight: '800',
    },
    inlineArrowWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
