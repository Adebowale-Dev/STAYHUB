'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
interface User {
    id: string;
    _id?: string;
    email: string;
    role: 'admin' | 'student' | 'porter';
    firstName?: string;
    lastName?: string;
    matricNumber?: string;
    matricNo?: string;
    firstLogin?: boolean;
    profilePicture?: string | null;
}
interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}
interface AuthActions {
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    setAuth: (user: User, token: string) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    logout: () => void;
    getRole: () => string | undefined;
    isAdmin: () => boolean;
    isStudent: () => boolean;
    isPorter: () => boolean;
    getRedirectPath: () => string;
}
type AuthStore = AuthState & AuthActions;
const useAuthStore = create<AuthStore>()(persist((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setToken: (token) => set({ token }),
    setAuth: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
        error: null,
    }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
    }),
    getRole: () => get().user?.role,
    isAdmin: () => get().user?.role === 'admin',
    isStudent: () => get().user?.role === 'student',
    isPorter: () => get().user?.role === 'porter',
    getRedirectPath: () => {
        const role = get().user?.role;
        switch (role) {
            case 'admin':
                return '/admin/dashboard';
            case 'student':
                return '/student/dashboard';
            case 'porter':
                return '/porter/dashboard';
            default:
                return '/login';
        }
    },
}), {
    name: 'auth-storage',
    partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
    }),
}));
export default useAuthStore;
export type { User, AuthState, AuthActions, AuthStore };
