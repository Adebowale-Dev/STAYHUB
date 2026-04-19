'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { authAPI } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Lock, Eye, EyeOff, Shield, AlertCircle, CheckCircle2, ArrowLeft, User as UserIcon, Bell, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
export default function StudentSettings() {
    const router = useRouter();
    const [changingPassword, setChangingPassword] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }
        setChangingPassword(true);
        setMessage(null);
        try {
            await authAPI.changePassword(passwordData.oldPassword, passwordData.newPassword, passwordData.confirmPassword);
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        }
        catch (error: unknown) {
            const err = error as {
                response?: {
                    data?: {
                        message?: string;
                    };
                };
            };
            setMessage({
                type: 'error',
                text: err?.response?.data?.message || 'Failed to change password'
            });
        }
        finally {
            setChangingPassword(false);
        }
    };
    return (<ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/student/dashboard')}>
                <ArrowLeft className="h-5 w-5"/>
              </Button>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Settings
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your account security and preferences
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push('/student/profile')}>
              <UserIcon className="h-4 w-4 mr-2"/>
              View Profile
            </Button>
          </div>

          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5"/>
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-6">
                {message && (<Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                    {message.type === 'success' ? (<CheckCircle2 className="h-4 w-4"/>) : (<AlertCircle className="h-4 w-4"/>)}
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>)}

                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Current Password</Label>
                  <div className="relative">
                    <Input id="oldPassword" type={showOldPassword ? 'text' : 'password'} value={passwordData.oldPassword} onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })} required className="pr-10" placeholder="Enter your current password"/>
                    <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {showOldPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                    </button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input id="newPassword" type={showNewPassword ? 'text' : 'password'} value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required minLength={6} className="pr-10" placeholder="Enter new password"/>
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {showNewPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Password must be at least 6 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required minLength={6} className="pr-10" placeholder="Confirm new password"/>
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword ? 'Changing Password...' : 'Change Password'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setMessage(null);
        }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5"/>
                Account Security
              </CardTitle>
              <CardDescription>
                Keep your account safe and secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0"/>
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Account Protected</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your account is secured with password authentication
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Security Tips</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0"/>
                    <span>Use a strong, unique password for your account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0"/>
                    <span>Never share your password with anyone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0"/>
                    <span>Change your password regularly, especially if you suspect unauthorized access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0"/>
                    <span>Always log out after using public or shared computers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0"/>
                    <span>Be cautious of phishing emails or suspicious links</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}
