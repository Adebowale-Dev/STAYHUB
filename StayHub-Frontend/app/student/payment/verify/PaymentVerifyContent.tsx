'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { paymentAPI } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, Home, CreditCard, KeyRound, Info, Mail } from 'lucide-react';

type PageStatus = 'input' | 'verifying' | 'success' | 'failed';

export default function PaymentVerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<PageStatus>('input');
    const [paymentCode, setPaymentCode] = useState('');
    const [message, setMessage] = useState('');
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    const [resending, setResending] = useState(false);
    const callbackReference = searchParams.get('reference');

    useEffect(() => {
        const incomingMessage = searchParams.get('message');
        if (incomingMessage) {
            setMessage(incomingMessage);
        }
    }, [searchParams]);

    const handleVerifyPayment = async () => {
        if (!paymentCode.trim()) {
            alert('Please enter the 6-character payment code');
            return;
        }
        if (paymentCode.trim().length !== 6) {
            alert('Payment code must be exactly 6 characters');
            return;
        }

        try {
            setStatus('verifying');
            const response = await paymentAPI.verifyWithCode(paymentCode.trim().toUpperCase());
            const data = response.data.data || response.data;

            if (data.status === 'paid' || data.status === 'completed' || data.status === 'success') {
                setStatus('success');
                setMessage('Payment verified successfully!');
                setPaymentDetails(data);
                return;
            }

            setStatus('failed');
            setMessage(data.message || 'Payment verification failed');
        }
        catch (error: any) {
            setStatus('failed');

            if (error.response?.status === 404) {
                setMessage('Invalid payment code. Please check and try again.');
            }
            else if (error.response?.status === 400) {
                setMessage(error.response?.data?.message || error.response?.data?.error || 'Payment code is invalid or expired.');
            }
            else if (error.response?.status === 401) {
                setMessage('Session expired. Please log in again.');
            }
            else {
                setMessage(error.response?.data?.message || 'Failed to verify payment. Please try again or contact support.');
            }
        }
    };

    const handleResendCode = async () => {
        try {
            setResending(true);
            await paymentAPI.resendCode();
            setMessage('A fresh payment code has been sent to your email.');
        }
        catch (error: any) {
            setMessage(error.response?.data?.message || 'Could not resend payment code right now.');
        }
        finally {
            setResending(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['student']}>
            <DashboardLayout>
                <div className="max-w-2xl mx-auto py-12">
                    {status === 'input' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <KeyRound className="h-6 w-6" />
                                    Verify Payment
                                </CardTitle>
                                <CardDescription>
                                    Enter the 6-character payment code sent to your email
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {message && (
                                    <Alert className="bg-blue-50 border-blue-200">
                                        <Info className="h-4 w-4 text-blue-600" />
                                        <AlertDescription className="text-blue-800">
                                            <div className="space-y-1">
                                                <p>{message}</p>
                                                {callbackReference && (
                                                    <p className="text-sm">
                                                        Reference: <code className="bg-blue-100 px-1 rounded">{callbackReference}</code>
                                                    </p>
                                                )}
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <Alert className="bg-blue-50 border-blue-200">
                                    <Mail className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-blue-800">
                                        <p className="font-medium mb-1">Check your email for the payment code</p>
                                        <p className="text-sm">
                                            After completing payment on the gateway, a 6-character verification code was sent to your registered email address.
                                        </p>
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-3">
                                    <Label htmlFor="paymentCode" className="text-base">
                                        Payment Code
                                    </Label>
                                    <Input
                                        id="paymentCode"
                                        type="text"
                                        placeholder="Enter 6-character code (e.g., ABC123)"
                                        value={paymentCode}
                                        onChange={(e) => {
                                            const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                            if (value.length <= 6) {
                                                setPaymentCode(value);
                                            }
                                        }}
                                        className="text-center text-2xl font-mono tracking-widest h-14"
                                        maxLength={6}
                                        autoFocus
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Code must be exactly 6 characters (letters and numbers)
                                    </p>
                                </div>

                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription className="text-sm">
                                        <p className="font-medium mb-1">Haven&apos;t received the code?</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            <li>Check your spam or junk folder</li>
                                            <li>Make sure you completed the payment successfully</li>
                                            <li>Contact support if you do not receive it within 10 minutes</li>
                                        </ul>
                                    </AlertDescription>
                                </Alert>

                                <div className="flex justify-end">
                                    <Button variant="outline" onClick={handleResendCode} disabled={resending}>
                                        {resending ? 'Resending...' : 'Resend Code'}
                                    </Button>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button variant="outline" onClick={() => router.push('/student/payment')} className="flex-1">
                                        Back to Payment
                                    </Button>
                                    <Button onClick={handleVerifyPayment} disabled={paymentCode.length !== 6} className="flex-1">
                                        Verify Payment
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {status === 'verifying' && (
                        <Card>
                            <CardContent className="pt-12 pb-12 text-center">
                                <Loader2 className="h-16 w-16 mx-auto mb-6 animate-spin text-primary" />
                                <h2 className="text-2xl font-bold mb-2">Verifying Payment</h2>
                                <p className="text-muted-foreground">
                                    Please wait while we confirm your payment code...
                                </p>
                                <p className="text-sm text-muted-foreground mt-2 font-mono">
                                    Code: {paymentCode}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {status === 'success' && (
                        <Card>
                            <CardContent className="pt-12 pb-12">
                                <div className="text-center space-y-6">
                                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-green-700 mb-2">
                                            Payment Verified!
                                        </h2>
                                        <p className="text-muted-foreground">
                                            {message}
                                        </p>
                                    </div>

                                    {paymentDetails && (
                                        <div className="bg-green-50 rounded-lg p-6 space-y-3 text-left max-w-md mx-auto border border-green-200">
                                            <div className="flex justify-between items-center border-b border-green-200 pb-3">
                                                <span className="text-sm text-green-700 font-medium">Payment Details</span>
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            </div>

                                            {paymentDetails.amount && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Amount Paid</span>
                                                    <span className="font-bold text-green-700">NGN {paymentDetails.amount.toLocaleString()}</span>
                                                </div>
                                            )}

                                            {paymentDetails.reference && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Reference</span>
                                                    <span className="font-mono text-sm">{paymentDetails.reference}</span>
                                                </div>
                                            )}

                                            {paymentDetails.paymentCode && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Payment Code</span>
                                                    <span className="font-mono text-sm font-bold">{paymentDetails.paymentCode}</span>
                                                </div>
                                            )}

                                            {paymentDetails.paidAt && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Date</span>
                                                    <span className="text-sm">
                                                        {new Date(paymentDetails.paidAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <Alert className="bg-green-50 border-green-200 text-left">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="text-green-800">
                                            <p className="font-medium mb-1">Payment Confirmed</p>
                                            <p className="text-sm">
                                                Your hostel accommodation fee has been successfully verified.
                                                Your reservation is now confirmed and active.
                                            </p>
                                        </AlertDescription>
                                    </Alert>

                                    <div className="flex gap-3 justify-center pt-4">
                                        <Button onClick={() => router.push('/student/dashboard')} variant="outline" className="gap-2">
                                            <Home className="h-4 w-4" />
                                            Go to Dashboard
                                        </Button>
                                        <Button onClick={() => router.push('/student/reservation')} className="gap-2">
                                            View Reservation
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {status === 'failed' && (
                        <Card>
                            <CardContent className="pt-12 pb-12">
                                <div className="text-center space-y-6">
                                    <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                                        <XCircle className="h-12 w-12 text-red-600" />
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-red-700 mb-2">
                                            Verification Failed
                                        </h2>
                                        <p className="text-muted-foreground">
                                            {message}
                                        </p>
                                    </div>

                                    <Alert className="bg-red-50 border-red-200 text-left">
                                        <XCircle className="h-4 w-4 text-red-600" />
                                        <AlertDescription className="text-red-800">
                                            <p className="font-medium mb-2">What to do next:</p>
                                            <ul className="list-disc list-inside space-y-1 text-sm">
                                                <li>Double-check the payment code from your email</li>
                                                <li>Ensure you completed the payment successfully</li>
                                                <li>Check your email spam folder for the code</li>
                                                <li>If you are sure the code is correct, contact support</li>
                                            </ul>
                                        </AlertDescription>
                                    </Alert>

                                    <div className="flex gap-3 justify-center pt-4">
                                        <Button
                                            onClick={() => {
                                                setStatus('input');
                                                setPaymentCode('');
                                            }}
                                            variant="outline"
                                            className="gap-2"
                                        >
                                            Try Again
                                        </Button>
                                        <Button onClick={() => router.push('/student/payment')} className="gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            Back to Payment
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
