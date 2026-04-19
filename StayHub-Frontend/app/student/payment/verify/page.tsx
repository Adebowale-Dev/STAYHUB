import { Suspense } from 'react';
import PaymentVerifyContent from './PaymentVerifyContent';

export default function PaymentVerifyPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-2xl py-12 text-sm text-muted-foreground">Loading payment verification...</div>}>
            <PaymentVerifyContent />
        </Suspense>
    );
}
