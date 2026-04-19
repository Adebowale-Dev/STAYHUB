import { Building2 } from 'lucide-react';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
export default function ForgotPasswordPage() {
    return (<div className="force-light min-h-screen flex items-center justify-center relative overflow-hidden">

      
      <img src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1400&q=80" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover scale-110" style={{ filter: 'blur(18px)' }}/>

      
      <div className="absolute inset-0 dark:bg-slate-900/65"/>

      
      <div className="relative z-10 w-full max-w-sm mx-auto px-4 py-12">

        
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground"/>
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">StayHub</span>
        </div>

        
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-7 shadow-lg">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Forgot password?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <ForgotPasswordForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/50">
          © {new Date().getFullYear()} StayHub · All rights reserved
        </p>
      </div>

    </div>);
}
