'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { authAPI } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Building2, Shield, Calendar, Clock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
interface PorterProfile {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    assignedHostel?: {
        _id: string;
        name: string;
        capacity?: number;
        location?: string;
    };
    employeeId?: string;
    joinedDate?: string;
    status?: string;
    shiftSchedule?: {
        morning?: string;
        afternoon?: string;
        evening?: string;
    };
}
export default function PorterProfile() {
    const router = useRouter();
    const [profile, setProfile] = useState<PorterProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    useEffect(() => {
        fetchProfile();
    }, []);
    const fetchProfile = async () => {
        try {
            const response = await authAPI.getProfile();
            console.log('Profile API response:', response.data);
            const rawData = response.data.data || response.data;
            console.log('Raw profile data:', rawData);
            const userData = rawData.user || rawData;
            const profileData: PorterProfile = {
                _id: userData._id,
                name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name,
                email: userData.email,
                phoneNumber: userData.phoneNumber,
                assignedHostel: userData.assignedHostel,
                employeeId: userData.employeeId,
                joinedDate: userData.joinedDate || userData.createdAt,
                status: userData.status,
                shiftSchedule: userData.shiftSchedule
            };
            console.log('Mapped profile data:', profileData);
            setProfile(profileData);
            setPhoneNumber(profileData.phoneNumber || '');
        }
        catch (error) {
            console.error('Failed to fetch profile:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleEdit = () => {
        setEditing(true);
    };
    const handleCancel = () => {
        setEditing(false);
        setPhoneNumber(profile?.phoneNumber || '');
    };
    const handleSave = async () => {
        setSaving(true);
        try {
            if (profile) {
                setProfile({ ...profile, phoneNumber });
            }
            setEditing(false);
            alert('Phone number updated successfully!');
        }
        catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile. Please try again.');
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (<ProtectedRoute allowedRoles={["porter"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>);
    }
    return (<ProtectedRoute allowedRoles={["porter"]}>
      <DashboardLayout>
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/porter/dashboard')}>
                <ArrowLeft className="h-5 w-5"/>
              </Button>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  My Profile
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  View your porter information and assigned hostel
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {editing ? (<>
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>) : (<Button variant="outline" onClick={handleEdit}>
                  <Phone className="h-4 w-4 mr-2"/>
                  Update Phone
                </Button>)}
            </div>
          </div>

          
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="h-32 w-32 border-4 border-white dark:border-gray-800 shadow-lg rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <User className="h-16 w-16 text-gray-600 dark:text-gray-400"/>
              </div>
              <div className="flex-1">
                <div className="flex flex-col gap-3 mb-3">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {profile?.name}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                      <User className="h-3 w-3 mr-1"/>
                      Porter
                    </Badge>
                    {profile?.status && (<Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1"/>
                        <span className="capitalize">{profile.status}</span>
                      </Badge>)}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {profile?.employeeId && (<div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <User className="h-4 w-4 text-blue-500"/>
                      <span className="font-medium">Employee ID:</span>
                      <span>{profile.employeeId}</span>
                    </div>)}
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Mail className="h-4 w-4 text-blue-500"/>
                    <span className="font-medium">Email:</span>
                    <span className="truncate">{profile?.email}</span>
                  </div>
                  {profile?.phoneNumber && (<div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Phone className="h-4 w-4 text-blue-500"/>
                      <span className="font-medium">Phone:</span>
                      <span>{profile.phoneNumber}</span>
                    </div>)}
                  {profile?.joinedDate && (<div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Calendar className="h-4 w-4 text-blue-500"/>
                      <span className="font-medium">Joined:</span>
                      <span>{new Date(profile.joinedDate).toLocaleDateString()}</span>
                    </div>)}
                </div>
              </div>
            </div>
          </CardContent>

          <div className="grid gap-6 md:grid-cols-2">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5"/>
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <User className="h-4 w-4"/>
                    Full Name
                  </Label>
                  <Input value={profile?.name || ''} disabled className="bg-gray-50 dark:bg-gray-900"/>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <Mail className="h-4 w-4"/>
                    Email Address
                  </Label>
                  <Input value={profile?.email || ''} disabled className="bg-gray-50 dark:bg-gray-900"/>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <Phone className="h-4 w-4"/>
                    Phone Number
                  </Label>
                  <Input value={editing ? phoneNumber : (profile?.phoneNumber || 'Not provided')} onChange={(e) => setPhoneNumber(e.target.value)} disabled={!editing} className={!editing ? 'bg-gray-50 dark:bg-gray-900' : ''} placeholder={editing ? 'Enter phone number' : ''}/>
                  {editing && (<p className="text-xs text-gray-500 dark:text-gray-400">
                      This is the only field you can update
                    </p>)}
                </div>

                {profile?.employeeId && (<div className="space-y-2">
                    <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <User className="h-4 w-4"/>
                      Employee ID
                    </Label>
                    <Input value={profile.employeeId} disabled className="bg-gray-50 dark:bg-gray-900"/>
                  </div>)}

                {profile?.joinedDate && (<div className="space-y-2">
                    <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <Calendar className="h-4 w-4"/>
                      Joined Date
                    </Label>
                    <Input value={new Date(profile.joinedDate).toLocaleDateString()} disabled className="bg-gray-50 dark:bg-gray-900"/>
                  </div>)}
              </CardContent>
            </Card>

            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5"/>
                  Assigned Hostel
                </CardTitle>
                <CardDescription>
                  Your hostel assignment details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.assignedHostel ? (<>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                        <Building2 className="h-4 w-4"/>
                        Hostel Name
                      </Label>
                      <Input value={profile.assignedHostel.name} disabled className="bg-gray-50 dark:bg-gray-900"/>
                    </div>

                    {profile.assignedHostel.capacity && (<div className="space-y-2">
                        <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                          <User className="h-4 w-4"/>
                          Capacity
                        </Label>
                        <Input value={`${profile.assignedHostel.capacity} students`} disabled className="bg-gray-50 dark:bg-gray-900"/>
                      </div>)}

                    {profile.assignedHostel.location && (<div className="space-y-2">
                        <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                          <Building2 className="h-4 w-4"/>
                          Location
                        </Label>
                        <Input value={profile.assignedHostel.location} disabled className="bg-gray-50 dark:bg-gray-900"/>
                      </div>)}

                    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        You are responsible for managing check-ins and operations for this hostel.
                      </AlertDescription>
                    </Alert>
                  </>) : (<Alert>
                    <Building2 className="h-4 w-4"/>
                    <AlertDescription>
                      No hostel assigned yet. Please contact the administrator.
                    </AlertDescription>
                  </Alert>)}
              </CardContent>
            </Card>
          </div>

          
          {profile?.shiftSchedule && (<Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5"/>
                  Shift Schedule
                </CardTitle>
                <CardDescription>
                  Your daily working hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {profile.shiftSchedule.morning && (<div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                        <Label className="font-semibold text-gray-900 dark:text-white">Morning Shift</Label>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{profile.shiftSchedule.morning}</p>
                    </div>)}

                  {profile.shiftSchedule.afternoon && (<div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                        <Label className="font-semibold text-gray-900 dark:text-white">Afternoon Shift</Label>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{profile.shiftSchedule.afternoon}</p>
                    </div>)}

                  {profile.shiftSchedule.evening && (<div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                        <Label className="font-semibold text-gray-900 dark:text-white">Evening Shift</Label>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{profile.shiftSchedule.evening}</p>
                    </div>)}
                </div>
              </CardContent>
            </Card>)}

          
          <Alert>
            <User className="h-4 w-4"/>
            <AlertDescription>
              Your name, email, and hostel assignment are managed by the administrator. 
              If you need to update these details, please contact the hostel administrator.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}
