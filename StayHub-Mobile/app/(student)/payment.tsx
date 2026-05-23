import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { ActivityIndicator, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Paystack, paystackProps } from 'react-native-paystack-webview';
import { paymentAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { APP_CONFIG, PAYSTACK_CONFIG } from '../../constants/config';
import { Reveal } from '../../components/ui/Reveal';
import type { PaymentStatus } from '../../types';
import { getStudentPalette } from '../../constants/design';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useStudentTabSwipe } from '../../components/ui/StudentTabSwipe';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function PaymentScreen() {
    const [status, setStatus] = useState<PaymentStatus | null>(null);
    const [amountDue, setAmountDue] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [paystackRef, setPaystackRef] = useState('');
    const [paystackAmt, setPaystackAmt] = useState(0);
    const [verifyCode, setVerifyCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const user = useAuthStore((s) => s.user);
    const theme = useTheme();
    const palette = getStudentPalette(theme.dark);
    const insets = useSafeAreaInsets();
    const paystackWebViewRef = useRef<paystackProps.PayStackRef>(null);
    const useBrowserCheckout = APP_CONFIG.IS_EXPO_GO;
    const swipeHandlers = useStudentTabSwipe('payment');
    const bottomContentPadding = Math.max(insets.bottom + 96, 116);
    const headerTop = insets.top + 18;
    const headerHeight =60;

    const loadData = async () => {
        setError(false);
        try {
            const [statusRes, amountRes] = await Promise.allSettled([
                paymentAPI.getStatus(),
                paymentAPI.getAmount(),
            ]);

            if (statusRes.status === 'fulfilled') {
                const data = (statusRes.value.data as any).data ?? statusRes.value.data;
                setStatus(data);
            }

            if (amountRes.status === 'fulfilled') {
                const amt =
                    (amountRes.value.data as any).data?.amount ??
                    (amountRes.value.data as any).amount ??
                    null;
                setAmountDue(typeof amt === 'number' ? amt : null);
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
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleInitializePayment = async () => {
        setInitializing(true);
        try {
            const amt = amountDue ?? 0;
            const initRes = await paymentAPI.initialize(amt);
            const initData = (initRes.data as any).data ?? initRes.data;
            const reference = initData.reference ?? '';
            const authorizationUrl =
                typeof initData.authorizationUrl === 'string'
                    ? initData.authorizationUrl.trim()
                    : '';
            setPaystackAmt(amt);
            setPaystackRef(reference);

            if (useBrowserCheckout && authorizationUrl) {
                await Linking.openURL(authorizationUrl);
                Alert.alert(
                    'Continue Payment',
                    'Paystack opened in your browser. Complete payment there, then return here and refresh your status.',
                );
                return;
            }

            if (!paystackWebViewRef.current?.startTransaction && authorizationUrl) {
                await Linking.openURL(authorizationUrl);
                Alert.alert(
                    'Continue Payment',
                    'The embedded checkout is unavailable in this session, so payment was opened in your browser.',
                );
                return;
            }

            paystackWebViewRef.current?.startTransaction();
        }
        catch (e: any) {
            Alert.alert('Error', e.response?.data?.message ?? 'Failed to initialize payment.');
        }
        finally {
            setInitializing(false);
        }
    };

    const handlePaystackSuccess = async (res: any) => {
        const ref = res?.transactionRef?.reference ?? paystackRef;
        try {
            await paymentAPI.verifyReference(ref);
            Alert.alert('Payment Successful', 'Your payment has been verified.');
            loadData();
        }
        catch {
            Alert.alert(
                'Verification Pending',
                'Payment received. Verification is being processed. Please refresh shortly.',
            );
            loadData();
        }
    };

    const handleVerifyCode = async () => {
        if (!verifyCode.trim()) {
            Alert.alert('Error', 'Please enter a payment code.');
            return;
        }

        setVerifying(true);
        try {
            await paymentAPI.verifyWithCode(verifyCode.trim());
            Alert.alert('Success', 'Payment code verified successfully.');
            setVerifyCode('');
            loadData();
        }
        catch (e: any) {
            Alert.alert('Error', e.response?.data?.message ?? 'Invalid or expired payment code.');
        }
        finally {
            setVerifying(false);
        }
    };

    const isPaid = status?.status === 'paid';
    const isFailed = status?.status === 'failed';
    const displayAmount = status?.amount ?? amountDue;
    const formattedAmount =
        displayAmount != null ? `NGN ${displayAmount.toLocaleString()}` : 'Pending';
    const heroStatusColor = isPaid ? palette.success : isFailed ? palette.danger : palette.warning;
    const heroStatusBg = isPaid
        ? palette.successSoft
        : isFailed
            ? palette.dangerSoft
            : palette.warningSoft;
    const heroStatusIcon: IconName = isPaid
        ? 'check-circle-outline'
        : isFailed
            ? 'close-circle-outline'
            : 'clock-outline';
    const heroStatusLabel = isPaid ? 'Paid' : isFailed ? 'Failed' : 'Pending';

    if (loading) {
        return (
            <LoadingSpinner
                title="Loading payment details"
                message="We are checking your current fee status and recent verification updates."
            />
        );
    }

    return (
        <View className="flex-1" style={{ backgroundColor: palette.pageBackground }}>
            <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={palette.surface} />
            <View style={[styles.fixedHeaderShell, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
                <View style={[styles.fixedHeader, { paddingTop: headerTop }]}>
                    <Text style={[styles.fixedTitle, { color: palette.textPrimary }]}>{formattedAmount}</Text>
                    {/* <Text style={[styles.fixedSubtitle, { color: palette.textSecondary }]}>
                        Pay online or confirm an offline payment code from one place.
                    </Text> */}
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingTop: headerTop + headerHeight, paddingBottom: bottomContentPadding }}
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
                <View className="px-[18px] pt-[18px]">
                    <Text style={[styles.heroLead, { color: palette.textSecondary }]}>
                        Pay online or confirm an offline payment code from one place.
                    </Text>
                    <View style={styles.heroStatusWrap}>
                        <View style={[styles.statusChip, { backgroundColor: heroStatusBg }]}>
                            <MaterialCommunityIcons
                                name={heroStatusIcon}
                                size={14}
                                color={heroStatusColor}
                            />
                            <Text style={[styles.statusChipText, { color: heroStatusColor }]}>
                                {heroStatusLabel}
                            </Text>
                        </View>

                        {status?.paidAt ? (
                            <View
                                style={[
                                    styles.heroDatePill,
                                    {
                                        backgroundColor: palette.surfaceMuted,
                                        borderColor: palette.border,
                                    },
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name="calendar-check-outline"
                                    size={14}
                                    color={palette.textPrimary}
                                />
                                <Text style={[styles.heroDateText, { color: palette.textPrimary }]}>
                                    Paid{' '}
                                    {new Date(status.paidAt).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                <View className="-mt-[6px] px-[18px]">
                    {error ? (
                        <Reveal delay={60}>
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
                                    <View style={[styles.stateIcon, { backgroundColor: palette.dangerSoft }]}>
                                        <MaterialCommunityIcons name="wifi-off" size={24} color={palette.danger} />
                                    </View>
                                <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>
                                    Could not load payment info
                                </Text>
                                <Text style={[styles.stateCopy, { color: palette.textSecondary }]}>
                                    Check your connection and refresh to try again.
                                </Text>
                                <TouchableOpacity
                                    style={[styles.primaryBtn, { backgroundColor: palette.primary }]}
                                    onPress={() => {
                                        setLoading(true);
                                        loadData();
                                    }}
                                    activeOpacity={0.9}
                                >
                                    <MaterialCommunityIcons name="refresh" size={15} color="#FFFFFF" />
                                    <Text style={styles.primaryBtnText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        </Reveal>
                    ) : null}

                    {!error && isPaid ? (
                        <View className="mt-[22px]">
                            <Reveal delay={100}>
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
                                    <View style={styles.successBanner}>
                                        <View style={[styles.successIconCircle, { backgroundColor: palette.success }]}>
                                            <MaterialCommunityIcons name="check" size={26} color="#FFFFFF" />
                                        </View>
                                        <Text style={[styles.successTitle, { color: palette.textPrimary }]}>
                                            Payment confirmed
                                        </Text>
                                        <Text style={[styles.successSubtitle, { color: palette.textSecondary }]}>
                                            Your hostel fee has been received and verified successfully.
                                        </Text>
                                    </View>

                                    {[
                                        {
                                            icon: 'cash' as IconName,
                                            label: 'Amount Paid',
                                            value: formattedAmount,
                                            highlight: true,
                                        },
                                        ...(status?.reference
                                            ? [
                                                {
                                                    icon: 'identifier' as IconName,
                                                    label: 'Reference',
                                                    value: status.reference,
                                                    mono: true,
                                                },
                                            ]
                                            : []),
                                        ...(status?.paidAt
                                            ? [
                                                {
                                                    icon: 'calendar-check' as IconName,
                                                    label: 'Date',
                                                    value: new Date(status.paidAt).toLocaleDateString('en-GB', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    }),
                                                },
                                            ]
                                            : []),
                                    ].map((row, index, arr) => (
                                        <View key={row.label}>
                                            <View
                                                style={[
                                                    styles.receiptRow,
                                                    {
                                                        backgroundColor: palette.surfaceMuted,
                                                        borderColor: palette.border,
                                                    },
                                                ]}
                                            >
                                                <View style={[styles.receiptIconBox, { backgroundColor: palette.primarySoft }]}>
                                                    <MaterialCommunityIcons
                                                        name={row.icon}
                                                        size={16}
                                                        color={palette.primary}
                                                    />
                                                </View>
                                                <View style={styles.receiptCopy}>
                                                    <Text style={[styles.receiptLabel, { color: palette.textMuted }]}>
                                                        {row.label}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.receiptValue,
                                                            { color: row.highlight ? palette.primary : palette.textPrimary },
                                                            row.mono && styles.monoText,
                                                        ]}
                                                    >
                                                        {row.value}
                                                    </Text>
                                                </View>
                                            </View>
                                            {index < arr.length - 1 ? <View style={{ height: 10 }} /> : null}
                                        </View>
                                    ))}
                                </View>
                            </Reveal>
                        </View>
                    ) : null}

                    {!error && isFailed ? (
                        <View className="mt-[22px]">
                            <Reveal delay={140}>
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
                                    <View style={[styles.stateIcon, { backgroundColor: palette.dangerSoft }]}>
                                        <MaterialCommunityIcons name="close" size={24} color={palette.danger} />
                                    </View>
                                    <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>
                                        Payment failed
                                    </Text>
                                    <Text style={[styles.stateCopy, { color: palette.textSecondary }]}>
                                        Your last payment was unsuccessful. Try again or verify with a payment code.
                                    </Text>
                                </View>
                            </Reveal>
                        </View>
                    ) : null}

                    {!error && !isPaid ? (
                        <View className="mt-[22px]">
                            <Reveal delay={190}>
                                <Text className="mb-3 text-[11px] font-extrabold uppercase tracking-[1px]" style={{ color: palette.textMuted }}>
                                    Pay online
                                </Text>
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
                                        <View style={[styles.cardIconBox, { backgroundColor: palette.primarySoft }]}>
                                            <MaterialCommunityIcons
                                                name="credit-card-outline"
                                                size={20}
                                                color={palette.primary}
                                            />
                                        </View>
                                        <View style={styles.cardHeaderCopy}>
                                            <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>
                                                Pay with Paystack
                                            </Text>
                                            <Text style={[styles.cardSub, { color: palette.textSecondary }]}>
                                                Card, transfer, or USSD
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={[styles.cardHint, { color: palette.textSecondary }]}>
                                        {useBrowserCheckout
                                            ? 'Expo Go will open Paystack in your browser. Return here after payment and refresh your status.'
                                            : "You'll be redirected to Paystack's secure checkout to complete payment."}
                                    </Text>

                                    <TouchableOpacity
                                        style={[
                                            styles.primaryBtn,
                                            styles.fullBtn,
                                            { backgroundColor: palette.primary },
                                            initializing && styles.disabledButton,
                                        ]}
                                        onPress={handleInitializePayment}
                                        disabled={initializing}
                                        activeOpacity={0.9}
                                    >
                                        {initializing ? (
                                            <ActivityIndicator size={16} color="#FFFFFF" />
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons
                                                    name="lock-outline"
                                                    size={16}
                                                    color="#FFFFFF"
                                                />
                                                <Text style={styles.primaryBtnText}>
                                                    Pay {formattedAmount} securely
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </Reveal>
                        </View>
                    ) : null}

                    {!error && !isPaid ? (
                        <View className="mt-[22px]">
                            <Reveal delay={250}>
                                <Text className="mb-3 text-[11px] font-extrabold uppercase tracking-[1px]" style={{ color: palette.textMuted }}>
                                    Verify payment
                                </Text>
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
                                        <View style={[styles.cardIconBox, { backgroundColor: palette.successSoft }]}>
                                            <MaterialCommunityIcons
                                                name="key-outline"
                                                size={20}
                                                color={palette.success}
                                            />
                                        </View>
                                        <View style={styles.cardHeaderCopy}>
                                            <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>
                                                Verify with code
                                            </Text>
                                            <Text style={[styles.cardSub, { color: palette.textSecondary }]}>
                                                For bursary or offline payment confirmation
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={[styles.cardHint, { color: palette.textSecondary }]}>
                                        Enter the code issued by the bursary or finance office to confirm your payment.
                                    </Text>

                                    <TextInput
                                        mode="outlined"
                                        label="Payment Code"
                                        value={verifyCode}
                                        onChangeText={setVerifyCode}
                                        autoCapitalize="characters"
                                        disabled={verifying}
                                        style={styles.codeInput}
                                        outlineColor={palette.border}
                                        activeOutlineColor={palette.primary}
                                        left={<TextInput.Icon icon="key" />}
                                    />

                                    <TouchableOpacity
                                        style={[
                                            styles.secondaryBtn,
                                            styles.fullBtn,
                                            { backgroundColor: palette.primarySoft },
                                            verifying && styles.disabledButton,
                                        ]}
                                        onPress={handleVerifyCode}
                                        disabled={verifying}
                                        activeOpacity={0.9}
                                    >
                                        {verifying ? (
                                            <ActivityIndicator size={16} color={palette.primary} />
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons
                                                    name="check-circle-outline"
                                                    size={16}
                                                    color={palette.primary}
                                                />
                                                <Text style={[styles.secondaryBtnText, { color: palette.primary }]}>
                                                    Verify code
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </Reveal>
                        </View>
                    ) : null}
                </View>
            </ScrollView>

            {user && !useBrowserCheckout ? (
                <Paystack
                    paystackKey={PAYSTACK_CONFIG.PUBLIC_KEY}
                    amount={paystackAmt}
                    billingEmail={user.email ?? `${user.matricNumber}@stayhub.app`}
                    billingName={`${user.firstName} ${user.lastName}`}
                    refNumber={paystackRef}
                    activityIndicatorColor={palette.primary}
                    onCancel={() => Alert.alert('Cancelled', 'Payment was cancelled.')}
                    onSuccess={handlePaystackSuccess}
                    autoStart={false}
                    ref={paystackWebViewRef as any}
                />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    fixedHeaderShell: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        borderBottomWidth: 1,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    fixedHeader: {
        paddingHorizontal: 18,
        paddingBottom: 20,
        alignItems: 'center',
    },
    fixedTitle: {
        fontSize: 30,
        lineHeight: 36,
        fontWeight: '800',
        letterSpacing: -0.7,
        textAlign: 'center',
    },
    fixedSubtitle: {
        fontSize: 14,
        lineHeight: 22,
        marginTop: 6,
        textAlign: 'center',
    },
    heroLead: {
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'center',
    },
    heroStatusWrap: {
        alignItems: 'center',
        gap: 12,
        marginTop: 30,
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
    },
    statusChipText: {
        fontSize: 13,
        fontWeight: '800',
    },
    heroDatePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 9,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
    },
    heroDateText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    card: {
        borderRadius: 28,
        borderWidth: 1,
        padding: 18,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    cardIconBox: {
        width: 46,
        height: 46,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardHeaderCopy: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 4,
    },
    cardSub: {
        fontSize: 12,
        lineHeight: 18,
    },
    cardHint: {
        fontSize: 13,
        lineHeight: 20,
    },
    successBanner: {
        alignItems: 'center',
        marginBottom: 18,
    },
    successIconCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#43A047',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 6,
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },
    receiptRow: {
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    receiptIconBox: {
        width: 38,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    receiptCopy: {
        flex: 1,
    },
    receiptLabel: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    receiptValue: {
        fontSize: 15,
        fontWeight: '800',
    },
    monoText: {
        fontFamily: 'monospace',
        fontSize: 12,
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
    stateIcon: {
        width: 54,
        height: 54,
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
    fullBtn: {
        marginTop: 16,
    },
    primaryBtn: {
        minHeight: 50,
        borderRadius: 18,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
    },
    secondaryBtn: {
        minHeight: 50,
        borderRadius: 18,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    secondaryBtnText: {
        fontWeight: '800',
        fontSize: 14,
    },
    disabledButton: {
        opacity: 0.72,
    },
    codeInput: {
        marginTop: 16,
        backgroundColor: 'transparent',
    },
});
