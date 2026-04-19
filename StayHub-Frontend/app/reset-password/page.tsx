import { Suspense } from 'react';
import { Building2 } from 'lucide-react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
export default function ResetPasswordPage() {
    return (<div className="force-light relative flex min-h-screen items-center justify-center overflow-hidden">
      <img src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1400&q=80" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover" style={{ filter: 'blur(18px)' }}/>

      <div className="absolute inset-0 dark:bg-slate-900/65"/>

      <div className="relative z-10 mx-auto w-full max-w-sm px-4 py-12">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground"/>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">StayHub</span>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-7 shadow-lg backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Reset password</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Choose a new password for your StayHub account.
            </p>
          </div>

          <Suspense fallback={<div className="text-sm text-muted-foreground">Loading reset form...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/50">
          © {new Date().getFullYear()} StayHub · All rights reserved
        </p>
      </div>
    </div>);
}
