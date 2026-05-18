'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
    const router = useRouter();
    const { isAuthenticated, getRedirectPath } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace(getRedirectPath());
        }
    }, [isAuthenticated, router, getRedirectPath]);

    if (isAuthenticated)
        return null;

    return (
        <div className="force-light relative min-h-screen overflow-hidden">
            <img
                src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1600&q=80"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
            />

            <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
                <div className="w-full max-w-md rounded-3xl border border-white/30 bg-white/60 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="mb-8 flex flex-col items-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-sm">
                            <Building2 className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Sign in to continue to StayHub
                        </p>
                    </div>

                    <LoginForm />
                </div>
            </div>
        </div>
    );
}
