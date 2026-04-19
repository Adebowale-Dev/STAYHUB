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
      {error && (<Alert variant="destructive" className="rounded-xl border-destructive/50 bg-destructive/5">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>)}

      <div className="space-y-1.5">
        <Label htmlFor="identifier" className="text-sm font-medium text-foreground">
          Email or Matric Number
        </Label>
        <Input id="identifier" placeholder="admin@example.com or BU22CSC1005" className="h-11 rounded-xl text-sm" {...register('identifier')} disabled={isLoading}/>
        {errors.identifier && (<p className="text-xs text-destructive">{errors.identifier.message}</p>)}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </Label>
          <button type="button" onClick={() => router.push('/forgot-password')} className="text-xs text-primary hover:text-primary/80 transition-colors font-medium" disabled={isLoading}>
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="h-11 rounded-xl pr-12 text-sm" {...register('password')} disabled={isLoading}/>
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
          </button>
        </div>
        {errors.password && (<p className="text-xs text-destructive">{errors.password.message}</p>)}
      </div>

      <Button type="submit" className="w-full h-11 rounded-xl text-sm font-semibold" disabled={isLoading}>
        {isLoading ? (<>
            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
            Signing in...
          </>) : ('Sign In')}
      </Button>
    </form>);
}
