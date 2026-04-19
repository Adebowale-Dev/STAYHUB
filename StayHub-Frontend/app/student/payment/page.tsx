import { Suspense } from 'react';
import StudentPaymentContent from './StudentPaymentContent';

export default function StudentPaymentPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-4xl py-12 text-sm text-muted-foreground">Loading payment page...</div>}>
            <StudentPaymentContent />
        </Suspense>
    );
}
