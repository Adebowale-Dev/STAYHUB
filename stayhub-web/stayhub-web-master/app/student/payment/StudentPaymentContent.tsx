'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { paymentAPI, studentAPI } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, CheckCircle2, XCircle, Clock, AlertCircle, DollarSign, Calendar, Building2, Info, KeyRound } from 'lucide-react';

interface PaymentInfo {
    amount: number;
    status: 'paid' | 'pending' | 'not-paid' | 'completed' | 'success' | string;
    reference?: string;
    paymentCode?: string;
    paidAt?: string;
    expiresAt?: string;
}

interface Reservation {
    _id: string;
    hostel: {
        _id: string;
        name: string;
    };
    room: {
        _id: string;
        roomNumber: string;
    };
    status: string;
}

export default function StudentPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [processing, setProcessing] = useState(false);
    const callbackStatus = searchParams.get('status');
    const callbackMessage = searchParams.get('message');
    const callbackReference = searchParams.get('reference');

    useEffect(() => {
        loadPaymentInfo();
    }, []);

    const loadPaymentInfo = async () => {
        try {
            setLoading(true);
            let resolvedAmount = 0;

            try {
                const amountRes = await paymentAPI.getAmount();
                const amount = amountRes.data?.amount || amountRes.data?.data?.amount || 0;
                if (amount > 0) {
                    resolvedAmount = amount;
                }
            }
            catch {
            }

            try {
                const statusRes = await paymentAPI.getStatus();
                const statusData = statusRes.data.data || statusRes.data;
                const mappedPaymentInfo = {
                    ...statusData,
                    status: statusData.paymentStatus || statusData.status || 'not-paid',
                    reference: statusData.reference || statusData.paymentReference,
                    paymentCode: statusData.paymentCode,
                    paidAt: statusData.paidAt || statusData.datePaid,
                };

                setPaymentInfo(mappedPaymentInfo);

                if (!resolvedAmount && statusData.amount > 0) {
                    resolvedAmount = statusData.amount;
                }
            }
            catch {
                setPaymentInfo({ amount: 0, status: 'not-paid' });
            }

            setPaymentAmount(resolvedAmount || 50000);

            try {
                const reservationRes = await studentAPI.getReservation();
                const reservationData = reservationRes.data.data || reservationRes.data;
                setReservation({
                    ...reservationData,
                    status: reservationData.reservationStatus || reservationData.status,
                    hostel: reservationData.hostel,
                    room: reservationData.room,
                });
            }
            catch {
            }
        }
        catch (error) {
            console.error('Failed to load payment info:', error);
        }
        finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (paymentInfo?.status === 'pending') {
            const confirmed = confirm('You already have a pending payment.\n\n' +
                'Creating a new payment will cancel the previous one.\n\n' +
                'Do you want to proceed with a new payment?');
            if (!confirmed) {
                return;
            }
        }

        try {
            setProcessing(true);
            console.log('Initializing payment with amount:', paymentAmount);
            const response = await paymentAPI.initialize(paymentAmount);
            console.log('Payment initialization response:', response.data);
            const data = response.data.data || response.data;
            const authorizationUrl = data.authorizationUrl || data.authorization_url;
            const reference = data.reference;

            if (!authorizationUrl) {
                throw new Error('Payment gateway URL not received from server');
            }

            console.log('Authorization URL:', authorizationUrl);
            console.log('Reference:', reference);

            if (reference) {
                localStorage.setItem('paymentReference', reference);
            }

            alert('Payment initialized successfully!\n\nCheck your email for the payment code. You will need to enter this code to complete verification.');
            window.location.href = authorizationUrl;
        }
        catch (error: any) {
            console.error('Failed to initialize payment:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            let errorMessage = 'Failed to initialize payment. ';

            if (error.response?.status === 400) {
                const backendMessage = error.response?.data?.message || '';

                if (backendMessage.includes('already completed payment') || backendMessage.includes('already paid')) {
                    alert('Payment Already Completed!\n\nYou have already paid for this semester. Refresh the page to see your payment status.');
                    loadPaymentInfo();
                    return;
                }

                errorMessage += backendMessage || 'Invalid payment request. ';

                if (error.response?.data?.error) {
                    errorMessage += error.response.data.error;
                }
            }
            else if (error.response?.status === 404) {
                errorMessage += 'Payment service not found. Please contact support.';
            }
            else {
                errorMessage += error.response?.data?.message || error.message || 'Please try again.';
            }

            alert('Payment Error: ' + errorMessage);
        }
        finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const normalizedStatus = status?.toLowerCase();
        const isPaid = normalizedStatus === 'paid' || normalizedStatus === 'completed' || normalizedStatus === 'success';
        const isPending = normalizedStatus === 'pending';
        const config = {
            paid: {
                variant: 'default' as const,
                icon: CheckCircle2,
                label: 'Paid',
                className: 'bg-green-50 text-green-700 border-green-200'
            },
            pending: {
                variant: 'secondary' as const,
                icon: Clock,
                label: 'Pending',
                className: 'bg-orange-50 text-orange-700 border-orange-200'
            },
            'not-paid': {
                variant: 'destructive' as const,
                icon: XCircle,
                label: 'Not Paid',
                className: 'bg-red-50 text-red-700 border-red-200'
            }
        };
        const statusKey = isPaid ? 'paid' : (isPending ? 'pending' : 'not-paid');
        const statusConfig = config[statusKey];
        const Icon = statusConfig.icon;

        return (
            <Badge variant="outline" className={statusConfig.className}>
                <Icon className="h-3 w-3 mr-1" />
                {statusConfig.label}
            </Badge>
        );
    };

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout>
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Loading payment information...</p>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <DashboardLayout>
                <div className="space-y-6 max-w-4xl mx-auto">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            Hostel Payment
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            Complete your payment to confirm your hostel reservation
                        </p>
                    </div>

                    {(callbackStatus === 'failed' || callbackStatus === 'error') && (
                        <Alert className="bg-red-50 border-red-200">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                                <div className="space-y-1">
                                    <p className="font-medium">{callbackMessage || 'Payment could not be completed.'}</p>
                                    {callbackReference && (
                                        <p className="text-sm">
                                            Reference: <code className="bg-red-100 px-1 rounded">{callbackReference}</code>
                                        </p>
                                    )}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {callbackStatus === 'success' && callbackMessage && (
                        <Alert className="bg-blue-50 border-blue-200">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                {callbackMessage}
                            </AlertDescription>
                        </Alert>
                    )}

                    {(paymentInfo?.status === 'paid' || paymentInfo?.status === 'completed' || paymentInfo?.status === 'success') && (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Payment completed successfully! Your hostel reservation is confirmed.
                            </AlertDescription>
                        </Alert>
                    )}

                    {paymentInfo?.status === 'pending' && (
                        <Alert className="bg-orange-50 border-orange-200">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                                <div className="space-y-2">
                                    <p className="font-medium">Your payment is pending verification.</p>
                                    <p className="text-sm">
                                        If you&apos;ve completed payment on the payment gateway, it may take a few minutes to reflect.
                                        {paymentInfo?.reference && (<span> Reference: <code className="bg-orange-100 px-1 rounded">{paymentInfo.reference}</code></span>)}
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        <Button size="sm" variant="outline" onClick={() => loadPaymentInfo()} className="text-orange-700 border-orange-300 hover:bg-orange-100">
                                            Refresh Status
                                        </Button>
                                        <Button size="sm" onClick={() => router.push('/student/payment/verify')} className="bg-orange-600 hover:bg-orange-700">
                                            <KeyRound className="h-4 w-4 mr-1" />
                                            Enter Payment Code
                                        </Button>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {!reservation && (
                        <Alert className="bg-blue-50 border-blue-200">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                <div className="space-y-1">
                                    <p>Your room allocation has not been loaded yet, but you can still complete your payment now.</p>
                                    <p className="text-sm">
                                        If you have not chosen a room yet, you can still
                                        <Button variant="link" className="p-0 h-auto ml-1 text-blue-800" onClick={() => router.push('/student/hostels')}>
                                            browse available hostels
                                        </Button>
                                        .
                                    </p>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Payment Details
                                </CardTitle>
                                <CardDescription>
                                    Hostel accommodation fee
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b">
                                    <span className="text-sm text-muted-foreground">Amount Due</span>
                                    <span className="text-2xl font-bold">
                                        N{paymentAmount.toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-muted-foreground">Payment Status</span>
                                    {getStatusBadge(paymentInfo?.status || 'not-paid')}
                                </div>

                                {paymentInfo?.reference && (
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-muted-foreground">Reference</span>
                                        <span className="text-sm font-mono">{paymentInfo.reference}</span>
                                    </div>
                                )}

                                {paymentInfo?.paidAt && (
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Paid On
                                        </span>
                                        <span className="text-sm">
                                            {new Date(paymentInfo.paidAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                )}

                                {paymentInfo?.expiresAt && paymentInfo.status !== 'paid' && (
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Payment Deadline
                                        </span>
                                        <span className="text-sm text-orange-600 font-medium">
                                            {new Date(paymentInfo.expiresAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {reservation && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Reservation Details
                                    </CardTitle>
                                    <CardDescription>
                                        Your hostel allocation
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Hostel</p>
                                            <p className="font-medium">{reservation.hostel?.name || 'N/A'}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Room Number</p>
                                            <p className="font-medium">Room {reservation.room?.roomNumber || 'N/A'}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Reservation Status</p>
                                            <Badge variant="secondary" className="capitalize">
                                                {reservation.status || 'N/A'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <Alert className="bg-blue-50 border-blue-200">
                                        <Info className="h-4 w-4 text-blue-600" />
                                        <AlertDescription className="text-sm text-blue-800">
                                            Complete payment to confirm your reservation and gain access to the hostel.
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {paymentInfo?.status !== 'paid' &&
                        paymentInfo?.status !== 'completed' &&
                        paymentInfo?.status !== 'success' &&
                        (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Make Payment</CardTitle>
                                    <CardDescription>
                                        Pay securely using your debit card, bank transfer, or other supported Paystack options
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-muted rounded-lg p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Total Amount</span>
                                            <span className="text-2xl font-bold">N{paymentAmount.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <Button onClick={handlePayment} disabled={processing} className="w-full gap-2" size="lg">
                                        <DollarSign className="h-5 w-5" />
                                        {processing ? 'Processing...' : paymentInfo?.status === 'pending' ? 'Retry Payment' : 'Proceed to Payment'}
                                    </Button>

                                    <p className="text-xs text-center text-muted-foreground">
                                        You will be redirected to a secure payment gateway to complete your transaction
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                    {paymentInfo?.status !== 'paid' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Payment Instructions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                    <li>Click the "Proceed to Payment" button above</li>
                                    <li>You will be redirected to our secure payment gateway</li>
                                    <li>Enter your card details or select bank transfer option</li>
                                    <li>Complete the payment authorization</li>
                                    <li>You will be redirected back after successful payment</li>
                                    <li>Your payment will be verified automatically</li>
                                </ol>

                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs">
                                        Please ensure you complete the payment within the deadline to avoid losing your reservation.
                                        If you encounter any issues, contact the hostel administrator immediately.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
