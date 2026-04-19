'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/useAuthStore';
interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: Array<'admin' | 'student' | 'porter'>;
}
export default function ProtectedRoute({ children, allowedRoles = [] }: ProtectedRouteProps) {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsClient(true), 0);
        return () => clearTimeout(timer);
    }, []);
    useEffect(() => {
        if (!isClient)
            return;
        if (!isAuthenticated || !user) {
            router.replace('/login');
            return;
        }
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            const redirectPath = useAuthStore.getState().getRedirectPath();
            router.replace(redirectPath);
        }
    }, [isAuthenticated, user, allowedRoles, router, isClient]);
    if (!isClient) {
        return (<div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>);
    }
    if (!isAuthenticated || !user) {
        return null;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return null;
    }
    return <>{children}</>;
}
