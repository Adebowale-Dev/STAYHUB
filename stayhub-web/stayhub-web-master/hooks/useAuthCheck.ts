'use client';
import { useEffect, useRef } from 'react';
import useAuthStore from '@/store/useAuthStore';
import { authAPI } from '@/services/api';
export function useAuthCheck() {
    const { isAuthenticated, token, logout } = useAuthStore();
    const hasChecked = useRef(false);
    useEffect(() => {
        const verifyToken = async () => {
            if (hasChecked.current)
                return;
            if (!isAuthenticated || !token)
                return;
            hasChecked.current = true;
            try {
                await authAPI.getProfile();
            }
            catch {
                console.log('Token expired or invalid, logging out');
                logout();
            }
        };
        verifyToken();
    }, [isAuthenticated, token, logout]);
    return { isAuthenticated };
}
