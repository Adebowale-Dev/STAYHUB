'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { authAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export default function ForgotPasswordForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { register, handleSubmit, formState: { errors }, } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });
    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            setIsLoading(true);
            setError(null);
            await authAPI.forgotPassword(data.email);
            setSuccess(true);
        }
        catch (err: unknown) {
            const error = err as {
                response?: {
                    data?: {
                        message?: string;
                    };
                };
            };
            const message = error.response?.data?.message || 'Failed to send reset email';
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    };
    if (success) {
        return (<div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600"/>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Check your email</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We&apos;ve sent a password reset link to your email address.
          </p>
        </div>
        <Button onClick={() => router.push('/login')} className="w-full h-11 rounded-xl">
          Back to Login
        </Button>
      </div>);
    }
    return (<div className="space-y-5">
      {error && (<Alert variant="destructive" className="rounded-xl border-destructive/50 bg-destructive/5">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>)}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email Address
          </Label>
          <Input id="email" type="email" placeholder="your.email@example.com" className="h-11 rounded-xl text-sm" {...register('email')} disabled={isLoading}/>
          {errors.email && (<p className="text-xs text-destructive">{errors.email.message}</p>)}
        </div>

        <Button type="submit" className="w-full h-11 rounded-xl text-sm font-semibold" disabled={isLoading}>
          {isLoading ? (<>
              <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
              Sending...
            </>) : (<>
              <Mail className="mr-2 h-4 w-4"/>
              Send Reset Link
            </>)}
        </Button>
      </form>

      <button type="button" onClick={() => router.push('/login')} className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5"/>
        Back to login
      </button>
    </div>);
}
