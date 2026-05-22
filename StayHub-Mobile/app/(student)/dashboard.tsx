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

type QuickAction = {
    label: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    route: string;
};

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
    const bottomContentPadding = Math.max(insets.bottom + 88, 104);

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
                } catch {
                    setPaymentAmount(null);
                }
            } else {
                setPaymentAmount(null);
            }
        } catch {
            setError(true);
        } finally {
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
        [user?.firstName, user?.lastName]
    );

    const department = user?.department
        ? typeof user.department === 'object'
            ? (user.department as any).name
            : user.department
        : null;

    const paymentPaid = dashboard?.paymentStatus === 'paid';
    const reservationStatus = dashboard?.reservationStatus ?? dashboard?.reservation?.status ?? null;
    const hasReservation = dashboard?.hasReservation ?? false;

    const paymentSummary = paymentPaid ? 'Paid in full' : 'Pending payment';
    const reservationSummary =
        reservationStatus === 'temporary'
            ? 'Invite pending'
            : hasReservation
              ? 'Room reserved'
              : 'No reservation';

    const nextStep = !paymentPaid
        ? {
              title: 'Complete your payment',
              description:
                  paymentAmount != null
                      ? `Outstanding fee: ${formatAmountLabel(paymentAmount)}. Complete payment to continue your room process.`
                      : 'Open payment to review your accommodation fee and continue.',
              icon: 'credit-card-outline' as const,
              route: '/(student)/payment',
              cta: 'Open payment',
          }
        : reservationStatus === 'temporary'
          ? {
                title: 'Review your room invite',
                description:
                    'You have a pending reservation invite waiting for approval. Review it before the approval window closes.',
                icon: 'email-check-outline' as const,
                route: '/(student)/reservation',
                cta: 'Review invite',
            }
          : !hasReservation
            ? {
                  title: 'Reserve a room',
                  description:
                      'Browse available hostels and secure a room that matches your session and profile.',
                  icon: 'home-search-outline' as const,
                  route: '/(student)/hostels',
                  cta: 'Browse hostels',
              }
            : {
                  title: 'Manage your reservation',
                  description:
                      'Your room is already assigned. Open your reservation to review occupants, invite status, and final details.',
                  icon: 'bed-outline' as const,
                  route: '/(student)/reservation',
                  cta: 'View reservation',
              };

    const quickActions: QuickAction[] = [
        { label: 'Hostels', icon: 'home-city-outline', route: '/(student)/hostels' },
        { label: 'Reservation', icon: 'bed-outline', route: '/(student)/reservation' },
        { label: 'Payment', icon: 'credit-card-outline', route: '/(student)/payment' },
    ];

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
            <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={palette.surface} />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: bottomContentPadding }}
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
                    variant="surface"
                    title={`${getGreeting()}, ${user?.firstName ?? 'Student'}`}
                    subtitle="Track your payment, reservation, and room progress from one place."
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
                    <View
                        style={[
                            styles.heroInfoPanel,
                            {
                                backgroundColor: palette.surface,
                                borderColor: palette.border,
                            },
                        ]}
                    >
                        <View style={styles.heroInfoStack}>
                            <View style={styles.heroInfoRow}>
                                {department ? (
                                    <View
                                        style={[
                                            styles.heroInfoBadge,
                                            styles.heroInfoBadgeWide,
                                            {
                                                backgroundColor: palette.surfaceMuted,
                                                borderColor: palette.border,
                                            },
                                        ]}
                                    >
                                    <View
                                        style={[
                                            styles.heroInfoIconWrap,
                                            { backgroundColor: palette.primarySoft },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="school-outline"
                                            size={14}
                                            color={palette.primary}
                                        />
                                    </View>
                                    <Text style={[styles.heroInfoText, { color: palette.textPrimary }]}>
                                            {department}
                                            {user?.level ? ` - ${user.level} Level` : ''}
                                        </Text>
                                    </View>
                                ) : null}

                                {user?.matricNumber ? (
                                    <View
                                        style={[
                                            styles.heroInfoBadge,
                                            {
                                                backgroundColor: palette.surfaceMuted,
                                                borderColor: palette.border,
                                            },
                                        ]}
                                    >
                                    <View
                                        style={[
                                            styles.heroInfoIconWrap,
                                            { backgroundColor: palette.primarySoft },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="card-account-details-outline"
                                            size={14}
                                            color={palette.primary}
                                        />
                                    </View>
                                    <Text style={[styles.heroInfoText, { color: palette.textPrimary }]}>
                                        {user.matricNumber}
                                    </Text>
                                    </View>
                                ) : null}
                            </View>

                            {dashboard?.currentSession ? (
                                <View
                                    style={[
                                        styles.sessionCard,
                                        {
                                            backgroundColor: palette.surfaceMuted,
                                            borderColor: palette.border,
                                        },
                                    ]}
                                >
                                    <Text style={[styles.sessionLabel, { color: palette.textSecondary }]}>
                                        Current session
                                    </Text>
                                    <Text style={[styles.sessionValue, { color: palette.textPrimary }]}>
                                        {dashboard.currentSession}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                </StudentHero>

                <View style={styles.content}>
                    {error ? (
                        <View
                            style={[
                                styles.card,
                                styles.centerCard,
                                {
                                    backgroundColor: palette.surface,
                                    borderColor: palette.border,
                                    shadowColor: palette.shadow,
                                },
                            ]}
                        >
                            <View style={[styles.stateIconWrap, { backgroundColor: palette.dangerSoft }]}>
                                <MaterialCommunityIcons name="wifi-off" size={22} color={palette.danger} />
                            </View>
                            <Text style={[styles.cardTitle, styles.centerText, { color: palette.textPrimary }]}>
                                Could not load your dashboard
                            </Text>
                            <Text style={[styles.cardCopy, styles.centerText, { color: palette.textSecondary }]}>
                                Check your connection and try again.
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
                                <View style={styles.sectionHeader}>
                                    <View>
                                        <Text style={[styles.sectionEyebrow, { color: palette.textMuted }]}>
                                            Overview
                                        </Text>
                                        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                                            Your status
                                        </Text>
                                    </View>
                                    <View style={[styles.livePill, { backgroundColor: palette.primarySoft }]}>
                                        <Text style={[styles.livePillText, { color: palette.primary }]}>Live</Text>
                                    </View>
                                </View>

                                <View style={styles.statsGrid}>
                                    <View
                                        style={[
                                            styles.statTile,
                                            {
                                                backgroundColor: palette.surfaceMuted,
                                                borderColor: palette.border,
                                            },
                                        ]}
                                    >
                                        <Text style={[styles.statLabel, { color: palette.textMuted }]}>
                                            Payment
                                        </Text>
                                        <Text style={[styles.statValue, { color: palette.textPrimary }]}>
                                            {paymentSummary}
                                        </Text>
                                        <Text style={[styles.statMeta, { color: palette.textSecondary }]}>
                                            {paymentPaid
                                                ? 'No outstanding fee'
                                                : formatAmountLabel(paymentAmount)}
                                        </Text>
                                    </View>

                                    <View
                                        style={[
                                            styles.statTile,
                                            {
                                                backgroundColor: palette.surfaceMuted,
                                                borderColor: palette.border,
                                            },
                                        ]}
                                    >
                                        <Text style={[styles.statLabel, { color: palette.textMuted }]}>
                                            Reservation
                                        </Text>
                                        <Text style={[styles.statValue, { color: palette.textPrimary }]}>
                                            {formatReservationStatus(reservationStatus)}
                                        </Text>
                                        <Text style={[styles.statMeta, { color: palette.textSecondary }]}>
                                            {hasReservation ? 'Room tracked in StayHub' : 'No room selected yet'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.card,
                                    styles.nextStepCard,
                                    {
                                        backgroundColor: palette.surface,
                                        borderColor: palette.border,
                                        shadowColor: palette.shadow,
                                    },
                                ]}
                                activeOpacity={0.9}
                                onPress={() => router.push(nextStep.route as any)}
                            >
                                <View
                                    style={[
                                        styles.nextStepIconWrap,
                                        { backgroundColor: palette.primarySoft },
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={nextStep.icon}
                                        size={20}
                                        color={palette.primary}
                                    />
                                </View>
                                <View style={styles.nextStepCopy}>
                                    <Text style={[styles.sectionEyebrow, { color: palette.textMuted }]}>
                                        Next Step
                                    </Text>
                                    <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>
                                        {nextStep.title}
                                    </Text>
                                    <Text style={[styles.cardCopy, { color: palette.textSecondary }]}>
                                        {nextStep.description}
                                    </Text>
                                </View>
                                <View style={styles.nextStepFooter}>
                                    <Text style={[styles.nextStepAction, { color: palette.primary }]}>
                                        {nextStep.cta}
                                    </Text>
                                    <MaterialCommunityIcons name="arrow-right" size={18} color={palette.primary} />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.quickActionsRow}>
                                {quickActions.map((action) => (
                                    <TouchableOpacity
                                        key={action.label}
                                        style={[
                                            styles.quickAction,
                                            {
                                                backgroundColor: palette.surface,
                                                borderColor: palette.border,
                                                shadowColor: palette.shadow,
                                            },
                                        ]}
                                        activeOpacity={0.88}
                                        onPress={() => router.push(action.route as any)}
                                    >
                                        <View
                                            style={[
                                                styles.quickActionIcon,
                                                { backgroundColor: palette.primarySoft },
                                            ]}
                                        >
                                            <MaterialCommunityIcons
                                                name={action.icon}
                                                size={18}
                                                color={palette.primary}
                                            />
                                        </View>
                                        <Text style={[styles.quickActionText, { color: palette.textPrimary }]}>
                                            {action.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <AlertsCard />

                            {hasReservation && dashboard?.reservation ? (
                                <TouchableOpacity
                                    style={[
                                        styles.card,
                                        {
                                            backgroundColor: palette.surface,
                                            borderColor: palette.border,
                                            shadowColor: palette.shadow,
                                        },
                                    ]}
                                    activeOpacity={0.9}
                                    onPress={() => router.push('/(student)/reservation')}
                                >
                                    <View style={styles.sectionHeader}>
                                        <View>
                                            <Text style={[styles.sectionEyebrow, { color: palette.textMuted }]}>
                                                Reservation
                                            </Text>
                                            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                                                Current room
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.statusPill,
                                                {
                                                    backgroundColor:
                                                        reservationStatus === 'confirmed'
                                                            ? palette.successSoft
                                                            : reservationStatus === 'temporary'
                                                              ? palette.warningSoft
                                                              : palette.primarySoft,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusPillText,
                                                    {
                                                        color:
                                                            reservationStatus === 'confirmed'
                                                                ? palette.success
                                                                : reservationStatus === 'temporary'
                                                                  ? palette.warning
                                                                  : palette.primary,
                                                    },
                                                ]}
                                            >
                                                {reservationSummary}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={[styles.roomTitle, { color: palette.textPrimary }]}>
                                        {dashboard.reservation.hostel?.name ?? 'Assigned hostel'}
                                    </Text>

                                    <View style={styles.statsGrid}>
                                        <View
                                            style={[
                                                styles.statTile,
                                                {
                                                    backgroundColor: palette.surfaceMuted,
                                                    borderColor: palette.border,
                                                },
                                            ]}
                                        >
                                            <Text style={[styles.statLabel, { color: palette.textMuted }]}>
                                                Room
                                            </Text>
                                            <Text style={[styles.statValue, { color: palette.textPrimary }]}>
                                                {dashboard.reservation.room?.roomNumber ?? '-'}
                                            </Text>
                                        </View>

                                        <View
                                            style={[
                                                styles.statTile,
                                                {
                                                    backgroundColor: palette.surfaceMuted,
                                                    borderColor: palette.border,
                                                },
                                            ]}
                                        >
                                            <Text style={[styles.statLabel, { color: palette.textMuted }]}>
                                                Occupancy
                                            </Text>
                                            <Text style={[styles.statValue, { color: palette.textPrimary }]}>
                                                {dashboard.reservation.room?.currentOccupancy ?? 0}/
                                                {dashboard.reservation.room?.capacity ?? 0}
                                            </Text>
                                        </View>
                                    </View>

                                    {(dashboard.reservation.groupMembers?.length ?? 0) > 0 ? (
                                        <Text style={[styles.groupText, { color: palette.textSecondary }]}>
                                            Group reservation with{' '}
                                            {dashboard.reservation.groupMembers!.length + 1} members
                                        </Text>
                                    ) : null}
                                </TouchableOpacity>
                            ) : (
                                <View
                                    style={[
                                        styles.card,
                                        styles.centerCard,
                                        {
                                            backgroundColor: palette.surface,
                                            borderColor: palette.border,
                                            shadowColor: palette.shadow,
                                        },
                                    ]}
                                >
                                    <View style={[styles.stateIconWrap, { backgroundColor: palette.primarySoft }]}>
                                        <MaterialCommunityIcons
                                            name="bed-empty"
                                            size={22}
                                            color={palette.primary}
                                        />
                                    </View>
                                    <Text style={[styles.cardTitle, styles.centerText, { color: palette.textPrimary }]}>
                                        No room reserved yet
                                    </Text>
                                    <Text style={[styles.cardCopy, styles.centerText, { color: palette.textSecondary }]}>
                                        Browse available hostels and reserve a space before your preferred options fill up.
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
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 18,
        paddingTop: 14,
        gap: 18,
    },
    avatarRing: {
        width: 68,
        height: 68,
        borderRadius: 34,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    avatarInner: {
        flex: 1,
        borderRadius: 30,
        backgroundColor: '#2F80ED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    heroInfoPanel: {
        marginTop: 18,
        borderRadius: 22,
        padding: 12,
        borderWidth: 1,
    },
    heroInfoStack: {
        gap: 10,
    },
    heroInfoRow: {
        flexDirection: 'row',
        gap: 10,
    },
    heroInfoBadge: {
        flex: 1,
        minHeight: 46,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    heroInfoBadgeWide: {
        flex: 1.2,
    },
    heroInfoIconWrap: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroInfoText: {
        fontSize: 12,
        fontWeight: '700',
        flexShrink: 1,
    },
    sessionCard: {
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
    },
    sessionLabel: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    sessionValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    card: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 18,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 22,
        elevation: 8,
    },
    centerCard: {
        alignItems: 'center',
    },
    centerText: {
        textAlign: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    sectionEyebrow: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    livePill: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    livePillText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statTile: {
        flex: 1,
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 22,
    },
    statMeta: {
        fontSize: 12,
        lineHeight: 18,
        marginTop: 6,
    },
    nextStepCard: {
        gap: 14,
    },
    nextStepIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextStepCopy: {
        gap: 4,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    cardCopy: {
        fontSize: 13,
        lineHeight: 20,
        marginTop: 6,
    },
    nextStepFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    nextStepAction: {
        fontSize: 13,
        fontWeight: '800',
    },
    quickActionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    quickAction: {
        flex: 1,
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 6,
    },
    quickActionIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    quickActionText: {
        fontSize: 13,
        fontWeight: '700',
    },
    stateIconWrap: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    primaryButton: {
        marginTop: 18,
        minHeight: 48,
        borderRadius: 16,
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
    statusPill: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    roomTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 14,
    },
    groupText: {
        fontSize: 13,
        lineHeight: 19,
        marginTop: 14,
    },
});
