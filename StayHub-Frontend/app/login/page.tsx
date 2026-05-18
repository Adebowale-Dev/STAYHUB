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
                <div className="w-full max-w-md rounded-3xl border border-white/40 bg-white/82 px-6 py-7 shadow-2xl backdrop-blur-md sm:px-8 sm:py-8">
                    <div className="mb-6 flex flex-col items-center text-center">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/55 shadow-sm backdrop-blur">
                            <Building2 className="h-7 w-7 text-slate-800" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
                            STAYHUB
                        </h1>
                        <p className="mt-2 text-xl font-medium text-slate-700">
                            Welcome Back!
                        </p>
                    </div>

                    <LoginForm />
                </div>
            </div>
        </div>
    );
}
