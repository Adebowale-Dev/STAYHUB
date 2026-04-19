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
    return (<div className="force-light min-h-screen relative overflow-hidden">

      
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="wave-left" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 L 0.84,0 C 1.08,0.12 0.60,0.38 0.84,0.5 C 1.08,0.62 0.60,0.88 0.84,1 L 0,1 Z"/>
          </clipPath>
        </defs>
      </svg>

      
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1400&q=80" alt="" aria-hidden="true" className="h-full w-full object-cover scale-110" style={{ filter: 'blur(18px)' }} loading="eager"/>
        <div className="absolute inset-0 dark:bg-slate-900/72"/>
      </div>

      
      <div className="absolute inset-y-0 left-0 w-full lg:w-[57%] hidden lg:flex flex-col justify-between p-10 z-10" style={{
            clipPath: 'url(#wave-left)',
        }}>
        
        <img src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1400&q=80" alt="Student accommodation" className="absolute inset-0 h-full w-full object-cover" loading="eager"/>
        
        <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.04) 35%, rgba(0,0,0,0.50) 72%, rgba(0,0,0,0.78) 100%)',
        }}/>

        
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/25">
            <Building2 className="h-5 w-5 text-white"/>
          </div>
          <span className="text-xl font-bold text-white tracking-tight drop-shadow">StayHub</span>
        </div>

        
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-3 drop-shadow-md">
            Smart Hostel<br />Management Hub
          </h1>
          <p className="text-sm text-white/75 max-w-xs leading-relaxed">
            Manage rooms, students, payments, and check-ins all from one unified platform.
          </p>
        </div>
      </div>

      
      <div className="relative z-20 min-h-screen flex flex-col">

        
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground"/>
          </div>
          <span className="text-lg font-bold text-foreground">StayHub</span>
        </div>

        
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 lg:pl-[58%] lg:pr-12">
          <div className="w-full max-w-sm">

            
            <div className="mb-6 hidden lg:flex items-center justify-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground"/>
              </div>
              <span className="text-lg font-bold text-foreground">StayHub</span>
            </div>

            
            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-7 shadow-lg">

              
              <div className="mb-6 hidden lg:block">
                <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in to your account to continue
                </p>
              </div>

              
              <div className="mb-6 lg:hidden">
                <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                <p className="mt-1 text-sm text-muted-foreground">Sign in to continue</p>
              </div>

              <LoginForm />
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} StayHub · All rights reserved
            </p>
          </div>
        </div>
      </div>

    </div>);
}
