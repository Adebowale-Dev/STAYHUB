'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authAPI } from '../../services/api';
import useAuthStore from '../../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
    identifier: z.string().min(1, 'Email or matric number is required'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
    const router = useRouter();
    const { setAuth, setLoading, setError, error, isLoading } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors }, } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });
    const onSubmit = async (data: LoginFormData) => {
        await performLogin(data, 0);
    };
    const performLogin = async (data: LoginFormData, retryCount: number) => {
        try {
            setLoading(true);
            setError(null);
            const response = await authAPI.login(data);
            const { token, user } = response.data;
            const normalizedUser = {
                id: user.id || user._id,
                _id: user.id || user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                matricNumber: user.matricNumber || user.matricNo,
                matricNo: user.matricNo,
                firstLogin: user.firstLogin,
                profilePicture: user.profilePicture ?? null,
            };
            setAuth(normalizedUser, token);
            const redirectPath = useAuthStore.getState().getRedirectPath();
            router.replace(redirectPath);
        }
        catch (err: unknown) {
            const error = err as {
                response?: {
                    status?: number;
                    data?: {
                        message?: string;
                        error?: string;
                    };
                };
                code?: string;
                message?: string;
            };
            if (error.response?.status === 429 && retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 1000;
                setError(`Too many requests. Retrying in ${delay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return performLogin(data, retryCount + 1);
            }
            if (!error.response) {
                if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                    setError('Connection timeout. Please check if the backend server is running.');
                }
                else {
                    setError('Cannot connect to server. Please ensure the backend is running.');
                }
                return;
            }
            if (error.response?.status === 429) {
                setError('Too many login attempts. Please wait a moment and try again.');
            }
            else if (error.response?.status === 401) {
                setError('Invalid email/matric number or password.');
            }
            else {
                const message = error.response?.data?.message ||
                    error.response?.data?.error ||
                    'Login failed. Please try again.';
                setError(message);
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (<Alert variant="destructive" className="rounded-3xl border-destructive/30 bg-white/55 backdrop-blur-sm">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>)}

      <div className="space-y-2">
        <Label htmlFor="identifier" className="pl-3 text-sm font-medium text-slate-700">
          Email or Matric Number
        </Label>
        <Input id="identifier" placeholder="Enter your email or matric number" className="h-13 rounded-full border-white/55 bg-white/35 px-5 text-sm text-slate-800 placeholder:text-slate-500 shadow-sm backdrop-blur-sm" {...register('identifier')} disabled={isLoading}/>
        {errors.identifier && (<p className="pl-3 text-xs text-destructive">{errors.identifier.message}</p>)}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="pl-3 text-sm font-medium text-slate-700">
            Password
          </Label>
          <button type="button" onClick={() => router.push('/forgot-password')} className="pr-3 text-xs font-medium text-slate-700 transition-colors hover:text-slate-900" disabled={isLoading}>
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="h-13 rounded-full border-white/55 bg-white/35 px-5 pr-12 text-sm text-slate-800 placeholder:text-slate-500 shadow-sm backdrop-blur-sm" {...register('password')} disabled={isLoading}/>
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-800">
            {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
          </button>
        </div>
        {errors.password && (<p className="pl-3 text-xs text-destructive">{errors.password.message}</p>)}
      </div>

      <div className="space-y-3 pt-1">
        <Button type="submit" className="h-13 w-full rounded-full bg-blue-600 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700" disabled={isLoading}>
          {isLoading ? (<>
              <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
              Signing in...
            </>) : ('Login')}
        </Button>

        <Button type="button" variant="secondary" onClick={() => router.push('/forgot-password')} className="h-12 w-full rounded-full border border-slate-500/20 bg-slate-700/75 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-slate-800/85" disabled={isLoading}>
          Forgot Password
        </Button>
      </div>
    </form>);
}
