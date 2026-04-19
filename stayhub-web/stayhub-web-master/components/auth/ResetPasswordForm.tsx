'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { authAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
const resetPasswordSchema = z
    .object({
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Use uppercase, lowercase, and a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export default function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { register, handleSubmit, formState: { errors }, } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });
    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            setError('Reset link is invalid or incomplete.');
            return;
        }
        try {
            setIsLoading(true);
            setError(null);
            await authAPI.resetPassword(token, data.password);
            setSuccess(true);
        }
        catch (err: unknown) {
            const apiError = err as {
                response?: {
                    data?: {
                        message?: string;
                    };
                };
            };
            setError(apiError.response?.data?.message || 'Failed to reset password');
        }
        finally {
            setIsLoading(false);
        }
    };
    if (success) {
        return (<div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600"/>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Password updated</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your password has been reset successfully. You can sign in now.
          </p>
        </div>
        <Button onClick={() => router.push('/login')} className="h-11 w-full rounded-xl">
          Back to Login
        </Button>
      </div>);
    }
    return (<div className="space-y-5">
      {!token && (<Alert variant="destructive" className="rounded-xl border-destructive/50 bg-destructive/5">
          <AlertDescription className="text-sm">
            Reset link is missing a token. Request a new password reset email.
          </AlertDescription>
        </Alert>)}

      {error && (<Alert variant="destructive" className="rounded-xl border-destructive/50 bg-destructive/5">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>)}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            New Password
          </Label>
          <Input id="password" type="password" placeholder="Enter a strong password" className="h-11 rounded-xl text-sm" {...register('password')} disabled={isLoading || !token}/>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirm Password
          </Label>
          <Input id="confirmPassword" type="password" placeholder="Re-enter your password" className="h-11 rounded-xl text-sm" {...register('confirmPassword')} disabled={isLoading || !token}/>
          {errors.confirmPassword && (<p className="text-xs text-destructive">{errors.confirmPassword.message}</p>)}
        </div>

        <Button type="submit" className="h-11 w-full rounded-xl text-sm font-semibold" disabled={isLoading || !token}>
          {isLoading ? (<>
              <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
              Resetting...
            </>) : (<>
              <KeyRound className="mr-2 h-4 w-4"/>
              Reset Password
            </>)}
        </Button>
      </form>

      <button type="button" onClick={() => router.push('/login')} className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5"/>
        Back to login
      </button>
    </div>);
}
