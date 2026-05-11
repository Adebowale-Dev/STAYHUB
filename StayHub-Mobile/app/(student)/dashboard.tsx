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
    const paymentToneColor = paymentPaid ? '#B8E0C0' : '#FFD08A';
    const reservationToneColor = hasReservation ? '#D6E7FF' : 'rgba(255,255,255,0.72)';
    const reservationLabel =
        reservationStatus === 'temporary'
            ? 'Invite pending'
            : hasReservation
                ? 'Room reserved'
                : 'No reservation';

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

                    <View className="flex-row gap-3">
                        <View style={styles.heroStatusCard}>
                            <MaterialCommunityIcons
                                name={paymentPaid ? 'check-circle-outline' : 'clock-outline'}
                                size={18}
                                color={paymentToneColor}
                            />
                            <View style={styles.heroStatusCopy}>
                                <Text
                                    style={[
                                        styles.heroStatusLabel,
                                        { color: paymentToneColor },
                                    ]}
                                >
                                    Payment
                                </Text>
                                <Text style={styles.heroStatusValue}>
                                    {paymentPaid ? 'Cleared' : 'Pending review'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.heroStatusCard}>
                            <MaterialCommunityIcons
                                name={hasReservation ? 'bed-outline' : 'bed-empty'}
                                size={18}
                                color={reservationToneColor}
                            />
                            <View style={styles.heroStatusCopy}>
                                <Text
                                    style={[
                                        styles.heroStatusLabel,
                                        { color: reservationToneColor },
                                    ]}
                                >
                                    Reservation
                                </Text>
                                <Text style={styles.heroStatusValue}>{reservationLabel}</Text>
                            </View>
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
                        <>
                            <Reveal delay={40}>
                                <View
                                    style={[
                                        styles.spotlightCard,
                                        {
                                            backgroundColor: palette.surface,
                                            borderColor: palette.border,
                                            shadowColor: palette.shadow,
                                        },
                                    ]}
                                >
                                    <View style={styles.spotlightHeader}>
                                        <View>
                                            <Text className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[1px]" style={{ color: palette.textMuted }}>
                                                At a glance
                                            </Text>
                                            <Text className="text-[22px] font-extrabold tracking-[-0.5px]" style={{ color: palette.textPrimary }}>
                                                StayHub snapshot
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.spotlightBadge,
                                                { backgroundColor: palette.primarySoft },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.spotlightBadgeText,
                                                    { color: palette.primary },
                                                ]}
                                            >
                                                Live
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.overviewGrid}>
                                        <View
                                            style={[
                                                styles.overviewCard,
                                                {
                                                    backgroundColor: palette.surfaceMuted,
                                                    borderColor: palette.border,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.overviewEyebrow,
                                                    { color: palette.textMuted },
                                                ]}
                                            >
                                                Outstanding fee
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.overviewValue,
                                                    { color: palette.textPrimary },
                                                ]}
                                            >
                                                {paymentPaid ? 'Paid in full' : formatAmountLabel(paymentAmount)}
                                            </Text>
                                        </View>

                                        <View
                                            style={[
                                                styles.overviewCard,
                                                {
                                                    backgroundColor: palette.surfaceMuted,
                                                    borderColor: palette.border,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.overviewEyebrow,
                                                    { color: palette.textMuted },
                                                ]}
                                            >
                                                Room status
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.overviewValue,
                                                    { color: palette.textPrimary },
                                                ]}
                                            >
                                                {formatReservationStatus(reservationStatus)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </Reveal>

                            {!paymentPaid ? (
                                <View className="mt-[22px]">
                                    <Reveal delay={100}>
                                        <TouchableOpacity
                                            style={[styles.paymentBanner, { backgroundColor: palette.warningSoft }]}
                                            activeOpacity={0.9}
                                            onPress={() => router.push('/(student)/payment')}
                                        >
                                            <View style={styles.paymentBannerLeft}>
                                                <View style={[styles.paymentBannerIcon, { backgroundColor: palette.surface }]}>
                                                    <MaterialCommunityIcons
                                                        name="alert-circle-outline"
                                                        size={20}
                                                        color={palette.warning}
                                                    />
                                                </View>
                                                <View style={styles.paymentBannerCopy}>
                                                    <Text style={[styles.paymentBannerTitle, { color: palette.warning }]}>
                                                        Payment still outstanding
                                                    </Text>
                                                    <Text style={[styles.paymentBannerSubtitle, { color: palette.textSecondary }]}>
                                                        {paymentAmount != null
                                                            ? `Amount due: ${formatAmountLabel(paymentAmount)}`
                                                            : 'Open payment to review the amount and complete checkout.'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={[styles.paymentBannerCta, { backgroundColor: palette.warning }]}>
                                                <Text style={styles.paymentBannerCtaText}>Pay now</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </Reveal>
                                </View>
                            ) : null}

                            <View className="mt-[22px]">
                                <Reveal delay={150}>
                                    <AlertsCard />
                                </Reveal>
                            </View>

                            <View className="mt-[22px]">
                                <Reveal delay={210}>
                                    <View className="mb-[14px]">
                                        <View>
                                            <Text className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[1px]" style={{ color: palette.textMuted }}>
                                                Reservation
                                            </Text>
                                            <Text className="text-[22px] font-extrabold tracking-[-0.5px]" style={{ color: palette.textPrimary }}>
                                                Current room snapshot
                                            </Text>
                                        </View>
                                    </View>

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
                                            <View style={styles.reservationCardHeader}>
                                                <View style={styles.reservationCardHeaderCopy}>
                                                    <Text
                                                        style={[
                                                            styles.reservationEyebrow,
                                                            { color: palette.textMuted },
                                                        ]}
                                                    >
                                                        Assigned hostel
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.reservationTitle,
                                                            { color: palette.textPrimary },
                                                        ]}
                                                    >
                                                        {dashboard.reservation.hostel?.name ?? 'Assigned hostel'}
                                                    </Text>
                                                </View>

                                                <View
                                                    style={[
                                                        styles.reservationStatusPill,
                                                        {
                                                            backgroundColor:
                                                                dashboard.reservation.status === 'confirmed'
                                                                    ? palette.successSoft
                                                                    : dashboard.reservation.status === 'cancelled'
                                                                        ? palette.dangerSoft
                                                                        : palette.warningSoft,
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.reservationStatusText,
                                                            {
                                                                color:
                                                                    dashboard.reservation.status === 'confirmed'
                                                                        ? '#2E7D32'
                                                                        : dashboard.reservation.status === 'cancelled'
                                                                            ? '#D92D20'
                                                                            : '#C2410C',
                                                            },
                                                        ]}
                                                    >
                                                        {formatReservationStatus(dashboard.reservation.status)}
                                                    </Text>
                                                </View>
                                            </View>

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
                        </>
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
    heroStatusCard: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
    },
    heroStatusCopy: {
        flex: 1,
        gap: 4,
    },
    heroStatusLabel: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    heroStatusValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    spotlightCard: {
        borderRadius: 28,
        borderWidth: 1,
        padding: 18,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 10,
    },
    spotlightHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    spotlightBadge: {
        borderRadius: 999,
        paddingHorizontal: 11,
        paddingVertical: 7,
    },
    spotlightBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    overviewGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    overviewCard: {
        flex: 1,
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    overviewEyebrow: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    overviewValue: {
        fontSize: 17,
        fontWeight: '800',
        lineHeight: 24,
    },
    paymentBanner: {
        backgroundColor: '#FFF3E4',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
    },
    paymentBannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    paymentBannerIcon: {
        width: 46,
        height: 46,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentBannerCopy: {
        flex: 1,
        gap: 4,
    },
    paymentBannerTitle: {
        color: '#9A3412',
        fontSize: 15,
        fontWeight: '800',
    },
    paymentBannerSubtitle: {
        color: '#B45309',
        fontSize: 12,
        lineHeight: 18,
    },
    paymentBannerCta: {
        borderRadius: 16,
        backgroundColor: '#C2410C',
        paddingHorizontal: 14,
        paddingVertical: 11,
    },
    paymentBannerCtaText: {
        color: '#FFFFFF',
        fontSize: 12,
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
    reservationCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    reservationCardHeaderCopy: {
        flex: 1,
    },
    reservationEyebrow: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    reservationTitle: {
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 28,
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
