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
import { Shield, Lock, Eye, EyeOff, ArrowLeft, KeyRound, AlertCircle, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
export default function PorterSettings() {
    const router = useRouter();
    const [changingPassword, setChangingPassword] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
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
            console.log('Attempting to change password...');
            const response = await authAPI.changePassword(passwordData.oldPassword, passwordData.newPassword, passwordData.confirmPassword);
            console.log('Password change response:', response);
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        }
        catch (error: unknown) {
            console.error('Password change error:', error);
            const err = error as {
                response?: {
                    data?: {
                        message?: string;
                        error?: string;
                        errors?: Array<{
                            msg: string;
                            message: string;
                            path?: string;
                        }> | string;
                    };
                };
            };
            console.error('Error response data:', err?.response?.data);
            let errorMessage = 'Failed to change password';
            if (err?.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                const validationErrors = err.response.data.errors
                    .map((e: {
                    msg?: string;
                    message?: string;
                    path?: string;
                }) => e.msg || e.message || JSON.stringify(e))
                    .join(', ');
                errorMessage = validationErrors;
                console.error('Validation errors:', err.response.data.errors);
            }
            else {
                errorMessage = err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    'Failed to change password';
            }
            setMessage({
                type: 'error',
                text: errorMessage
            });
        }
        finally {
            setChangingPassword(false);
        }
    };
    return (<ProtectedRoute allowedRoles={["porter"]}>
      <DashboardLayout>
        <div className="space-y-6">
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/porter/dashboard')}>
              <ArrowLeft className="h-5 w-5"/>
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Settings
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your security and password settings
              </p>
            </div>
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
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {message && (<Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                    <AlertCircle className="h-4 w-4"/>
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>)}

                <div className="space-y-2">
                  <Label htmlFor="oldPassword" className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4"/>
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input id="oldPassword" type={showOldPassword ? 'text' : 'password'} value={passwordData.oldPassword} onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })} required className="pr-10"/>
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowOldPassword(!showOldPassword)}>
                      {showOldPassword ? (<EyeOff className="h-4 w-4 text-gray-500"/>) : (<Eye className="h-4 w-4 text-gray-500"/>)}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4"/>
                    New Password
                  </Label>
                  <div className="relative">
                    <Input id="newPassword" type={showNewPassword ? 'text' : 'password'} value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required className="pr-10"/>
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? (<EyeOff className="h-4 w-4 text-gray-500"/>) : (<Eye className="h-4 w-4 text-gray-500"/>)}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4"/>
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required className="pr-10"/>
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? (<EyeOff className="h-4 w-4 text-gray-500"/>) : (<Eye className="h-4 w-4 text-gray-500"/>)}
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={changingPassword} className="w-full">
                  {changingPassword ? 'Changing Password...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5"/>
                Security Tips
              </CardTitle>
              <CardDescription>
                Best practices for keeping your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>Use a strong password with at least 8 characters including numbers and symbols</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>Never share your password with anyone</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>Change your password regularly (at least every 3 months)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>Always log out when using shared or public computers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>Report any suspicious activity to the administrator immediately</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>
                Access other important pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.push('/porter/profile')}>
                  <User className="h-4 w-4 mr-2"/>
                  View Profile
                </Button>
                <Button variant="outline" onClick={() => router.push('/porter/dashboard')}>
                  <ArrowLeft className="h-4 w-4 mr-2"/>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          
          <Alert>
            <AlertCircle className="h-4 w-4"/>
            <AlertDescription>
              For other account changes or if you&apos;ve forgotten your password, please contact the hostel administrator.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}
