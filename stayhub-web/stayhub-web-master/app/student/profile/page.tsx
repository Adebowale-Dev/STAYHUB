'use client';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { authAPI } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveMediaUrl } from '@/lib/media';
import useAuthStore from '@/store/useAuthStore';
import { User, Mail, Phone, MapPin, Calendar, Building2, GraduationCap, CreditCard, Home, AlertCircle, Camera, CheckCircle2, ArrowLeft, Settings, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
interface StudentProfile {
    _id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
    matricNumber?: string;
    matricNo?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    address?: string;
    profilePicture?: string | null;
    college?: {
        _id: string;
        name: string;
    };
    department?: {
        _id: string;
        name: string;
    };
    level?: string | number;
    gender?: string;
    paymentStatus?: string;
    reservationStatus?: string;
    createdAt: string;
    reservation?: {
        _id: string;
        hostel: {
            _id: string;
            name: string;
            location?: string;
        };
        room: {
            _id: string;
            roomNumber: string;
            floor?: number;
        };
        bunk?: {
            _id: string;
            bunkNumber: number;
        };
        status: string;
    };
}
export default function StudentProfile() {
    const router = useRouter();
    const setAuthUser = useAuthStore((state) => state.setUser);
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pictureAction, setPictureAction] = useState<'uploading' | 'removing' | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [editedProfile, setEditedProfile] = useState<{
        name?: string;
        email?: string;
        phoneNumber?: string;
        address?: string;
        dateOfBirth?: string;
        gender?: string;
        matricNumber?: string;
        level?: string;
    }>({});
    const syncStoredUser = (profileData: StudentProfile) => {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
            return;
        }
        const fallbackName = profileData.name?.trim() ||
            `${profileData.firstName || currentUser.firstName || ''} ${profileData.lastName || currentUser.lastName || ''}`.trim();
        const [derivedFirstName = currentUser.firstName || '', ...derivedLastNameParts] = fallbackName.split(' ').filter(Boolean);
        setAuthUser({
            ...currentUser,
            id: profileData._id || currentUser.id,
            _id: profileData._id || currentUser._id,
            email: profileData.email || currentUser.email,
            firstName: profileData.firstName || currentUser.firstName || derivedFirstName,
            lastName: profileData.lastName || currentUser.lastName || derivedLastNameParts.join(' '),
            matricNumber: profileData.matricNumber || currentUser.matricNumber,
            matricNo: profileData.matricNo || currentUser.matricNo,
            profilePicture: profileData.profilePicture ?? null,
        });
    };
    const buildEditedProfile = (profileData: StudentProfile) => ({
        name: profileData.name || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
        email: profileData.email || '',
        phoneNumber: profileData.phoneNumber || '',
        address: profileData.address || '',
        dateOfBirth: profileData.dateOfBirth || '',
        gender: profileData.gender || '',
        matricNumber: profileData.matricNo || profileData.matricNumber || '',
        level: profileData.level?.toString() || '',
    });
    const applyProfileUpdate = (profileData: StudentProfile) => {
        setProfile(profileData);
        setEditedProfile(buildEditedProfile(profileData));
        syncStoredUser(profileData);
    };
    const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
        const axiosError = error as {
            response?: {
                status?: number;
                data?: {
                    message?: string;
                };
            };
        };
        if (axiosError.response?.status === 404) {
            return 'Profile upload endpoint not found. Restart the backend server if it was just updated.';
        }
        return axiosError.response?.data?.message || fallbackMessage;
    };
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authAPI.getProfile();
                console.log('Profile API Response:', response.data);
                const profileData = response.data.user || response.data.data || response.data;
                console.log('Profile Data:', profileData);
                setProfile(profileData);
                setEditedProfile({
                    name: profileData.name || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
                    email: profileData.email || '',
                    phoneNumber: profileData.phoneNumber || '',
                    address: profileData.address || '',
                    dateOfBirth: profileData.dateOfBirth || '',
                    gender: profileData.gender || '',
                    matricNumber: profileData.matricNo || profileData.matricNumber || '',
                    level: profileData.level?.toString() || '',
                });
                const currentUser = useAuthStore.getState().user;
                if (currentUser) {
                    const fallbackName = profileData.name?.trim() ||
                        `${profileData.firstName || currentUser.firstName || ''} ${profileData.lastName || currentUser.lastName || ''}`.trim();
                    const [derivedFirstName = currentUser.firstName || '', ...derivedLastNameParts] = fallbackName.split(' ').filter(Boolean);
                    setAuthUser({
                        ...currentUser,
                        id: profileData._id || currentUser.id,
                        _id: profileData._id || currentUser._id,
                        email: profileData.email || currentUser.email,
                        firstName: profileData.firstName || currentUser.firstName || derivedFirstName,
                        lastName: profileData.lastName || currentUser.lastName || derivedLastNameParts.join(' '),
                        matricNumber: profileData.matricNumber || currentUser.matricNumber,
                        matricNo: profileData.matricNo || currentUser.matricNo,
                        profilePicture: profileData.profilePicture ?? null,
                    });
                }
            }
            catch (error) {
                console.error('Failed to fetch profile:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [setAuthUser]);
    const handleEdit = () => {
        setEditing(true);
        setEditedProfile(profile ? buildEditedProfile(profile) : {});
    };
    const handleCancel = () => {
        setEditing(false);
        setEditedProfile(profile ? buildEditedProfile(profile) : {});
    };
    const handleSave = async () => {
        setSaving(true);
        try {
            const updatePayload = {
                name: editedProfile.name,
                email: editedProfile.email,
                phoneNumber: editedProfile.phoneNumber,
                address: editedProfile.address,
                dateOfBirth: editedProfile.dateOfBirth,
                gender: editedProfile.gender,
                matricNo: editedProfile.matricNumber,
                level: editedProfile.level ? parseInt(editedProfile.level) : undefined,
            };
            const response = await authAPI.updateProfile(updatePayload);
            const updatedProfile = response.data.user || response.data.data || response.data;
            applyProfileUpdate(updatedProfile);
            setEditing(false);
            alert('Profile updated successfully!');
        }
        catch (error: unknown) {
            console.error('Failed to update profile:', error);
            alert(getApiErrorMessage(error, 'Failed to update profile. Please try again.'));
        }
        finally {
            setSaving(false);
        }
    };
    const handlePictureSelection = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload a JPEG, PNG, or WebP image.');
            event.target.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be 5 MB or smaller.');
            event.target.value = '';
            return;
        }
        const formData = new FormData();
        formData.append('picture', file);
        setPictureAction('uploading');
        try {
            const response = await authAPI.uploadProfilePicture(formData);
            const updatedProfile = response.data.user ||
                response.data.data?.student ||
                response.data.student ||
                response.data.data;
            applyProfileUpdate(updatedProfile);
            alert('Profile picture updated successfully!');
        }
        catch (error) {
            console.error('Failed to upload profile picture:', error);
            alert(getApiErrorMessage(error, 'Failed to upload profile picture. Please try again.'));
        }
        finally {
            setPictureAction(null);
            event.target.value = '';
        }
    };
    const handleRemovePicture = async () => {
        if (!profile?.profilePicture) {
            return;
        }
        setPictureAction('removing');
        try {
            const response = await authAPI.updateProfile({ profilePicture: null });
            const updatedProfile = response.data.user || response.data.data || response.data;
            applyProfileUpdate(updatedProfile);
            alert('Profile picture removed successfully!');
        }
        catch (error) {
            console.error('Failed to remove profile picture:', error);
            alert(getApiErrorMessage(error, 'Failed to remove profile picture. Please try again.'));
        }
        finally {
            setPictureAction(null);
        }
    };
    const handleInputChange = (field: 'name' | 'email' | 'phoneNumber' | 'address' | 'dateOfBirth' | 'gender' | 'matricNumber' | 'level', value: string) => {
        setEditedProfile({ ...editedProfile, [field]: value });
    };
    const profilePictureUrl = resolveMediaUrl(profile?.profilePicture);
    const profileDisplayName = profile?.name || 'Student';
    const getStatusBadge = (status?: string) => {
        if (!status)
            return null;
        const colors = {
            completed: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
            pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
            failed: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
            confirmed: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
            cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
        };
        const icons = {
            completed: CheckCircle2,
            confirmed: CheckCircle2,
            pending: AlertCircle,
            failed: AlertCircle,
            cancelled: AlertCircle,
        };
        const color = colors[status as keyof typeof colors] || colors.pending;
        const Icon = icons[status as keyof typeof icons] || AlertCircle;
        return (<Badge variant="outline" className={color}>
        <Icon className="h-3 w-3 mr-1"/>
        <span className="capitalize">{status}</span>
      </Badge>);
    };
    if (loading) {
        return (<ProtectedRoute allowedRoles={["student"]}>
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
                  My Profile
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  View your personal and academic information
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
                </>) : (<>
                  <Button variant="outline" onClick={handleEdit}>
                    <User className="h-4 w-4 mr-2"/>
                    Edit Profile
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/student/settings')}>
                    <Settings className="h-4 w-4 mr-2"/>
                    Settings
                  </Button>
                </>)}
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-800 shadow-lg">
                    {profilePictureUrl ? (<AvatarImage src={profilePictureUrl} alt={`${profileDisplayName} profile picture`} className="object-cover"/>) : null}
                    <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600">
                      <User className="h-16 w-16"/>
                    </AvatarFallback>
                  </Avatar>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePictureSelection} disabled={pictureAction !== null}/>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={pictureAction !== null}>
                      <Camera className="mr-2 h-4 w-4"/>
                      {pictureAction === 'uploading'
                    ? 'Uploading...'
                    : profile?.profilePicture
                        ? 'Change Photo'
                        : 'Add Photo'}
                    </Button>
                    {profile?.profilePicture ? (<Button type="button" variant="ghost" size="sm" onClick={handleRemovePicture} disabled={pictureAction !== null} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50">
                        <Trash2 className="mr-2 h-4 w-4"/>
                        {pictureAction === 'removing' ? 'Removing...' : 'Remove'}
                      </Button>) : null}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    JPEG, PNG, or WebP up to 5 MB
                  </p>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col gap-3 mb-3">
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {profile?.name}
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <GraduationCap className="h-4 w-4 text-blue-500"/>
                      <span className="font-medium">Matric:</span>
                      <span>{profile?.matricNo || profile?.matricNumber}</span>
                    </div>
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
                    {profile?.level && (<div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <GraduationCap className="h-4 w-4 text-blue-500"/>
                        <span className="font-medium">Level:</span>
                        <span>{profile.level}</span>
                      </div>)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          
          {profile?.reservation && (<Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-500"/>
                  Hostel Assignment
                </CardTitle>
                <CardDescription>
                  Your assigned room details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <Building2 className="h-4 w-4"/>
                      Hostel Name
                    </Label>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                      <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        {profile.reservation.hostel.name}
                      </p>
                      {profile.reservation.hostel.location && (<p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          {profile.reservation.hostel.location}
                        </p>)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <Home className="h-4 w-4"/>
                      Room Number
                    </Label>
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md">
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {profile.reservation.room.roomNumber}
                      </p>
                      {profile.reservation.room.floor && (<p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Floor {profile.reservation.room.floor}
                        </p>)}
                    </div>
                  </div>

                  {profile.reservation.bunk && (<div className="space-y-2">
                      <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                        <Home className="h-4 w-4"/>
                        Bunk Number
                      </Label>
                      <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-md">
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {profile.reservation.bunk.bunkNumber}
                        </p>
                      </div>
                    </div>)}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1"/>
                    {profile.reservation.status === 'checked_in' ? 'Checked In' : 'Reserved'}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => router.push('/student/reservation')}>
                    View Full Details
                  </Button>
                </div>
              </CardContent>
            </Card>)}

          <div className="grid gap-6 md:grid-cols-2">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5"/>
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <User className="h-4 w-4"/>
                    Full Name
                  </Label>
                  <Input value={editing ? (editedProfile.name || '') : (profile?.name || '')} onChange={(e) => handleInputChange('name', e.target.value)} disabled={!editing} className={!editing ? 'bg-gray-50 dark:bg-gray-900' : ''}/>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <Mail className="h-4 w-4"/>
                    Email Address
                  </Label>
                  <Input value={editing ? (editedProfile.email || '') : (profile?.email || '')} onChange={(e) => handleInputChange('email', e.target.value)} disabled={!editing} className={!editing ? 'bg-gray-50 dark:bg-gray-900' : ''}/>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <Phone className="h-4 w-4"/>
                    Phone Number
                  </Label>
                  <Input value={editing ? (editedProfile.phoneNumber || '') : (profile?.phoneNumber || 'Not provided')} onChange={(e) => handleInputChange('phoneNumber', e.target.value)} disabled={!editing} className={!editing ? 'bg-gray-50 dark:bg-gray-900' : ''} placeholder={editing ? 'Enter phone number' : ''}/>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <Calendar className="h-4 w-4"/>
                    Date of Birth
                  </Label>
                  <Input type={editing ? 'date' : 'text'} value={editing
            ? (editedProfile.dateOfBirth ? new Date(editedProfile.dateOfBirth).toISOString().split('T')[0] : '')
            : (profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided')} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} disabled={!editing} className={!editing ? 'bg-gray-50 dark:bg-gray-900' : ''}/>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <User className="h-4 w-4"/>
                    Gender
                  </Label>
                  {editing ? (<select value={editedProfile.gender || ''} onChange={(e) => handleInputChange('gender', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" aria-label="Select gender">
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>) : (<Input value={profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not provided'} disabled className="bg-gray-50 dark:bg-gray-900"/>)}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <MapPin className="h-4 w-4"/>
                    Address
                  </Label>
                  <Input value={editing ? (editedProfile.address || '') : (profile?.address || 'Not provided')} onChange={(e) => handleInputChange('address', e.target.value)} disabled={!editing} className={!editing ? 'bg-gray-50 dark:bg-gray-900' : ''} placeholder={editing ? 'Enter your address' : ''}/>
                </div>
              </CardContent>
            </Card>

            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5"/>
                  Academic Information
                </CardTitle>
                <CardDescription>
                  Your college and department details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <GraduationCap className="h-4 w-4"/>
                    Matriculation Number
                  </Label>
                  <Input value={editing ? (editedProfile.matricNumber || '') : (profile?.matricNo || profile?.matricNumber || '')} onChange={(e) => handleInputChange('matricNumber', e.target.value)} disabled={!editing} className={!editing ? 'bg-gray-50 dark:bg-gray-900' : ''}/>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <Building2 className="h-4 w-4"/>
                    College
                  </Label>
                  <Input value={profile?.college?.name || 'Not assigned'} disabled className="bg-gray-50 dark:bg-gray-900"/>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <GraduationCap className="h-4 w-4"/>
                    Department
                  </Label>
                  <Input value={profile?.department?.name || 'Not assigned'} disabled className="bg-gray-50 dark:bg-gray-900"/>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <GraduationCap className="h-4 w-4"/>
                    Level
                  </Label>
                  {editing ? (<select value={editedProfile.level || ''} onChange={(e) => handleInputChange('level', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" aria-label="Select level">
                      <option value="">Select level</option>
                      <option value="100">100 Level</option>
                      <option value="200">200 Level</option>
                      <option value="300">300 Level</option>
                      <option value="400">400 Level</option>
                      <option value="500">500 Level</option>
                    </select>) : (<Input value={profile?.level ? `${profile.level} Level` : 'Not provided'} disabled className="bg-gray-50 dark:bg-gray-900"/>)}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <Calendar className="h-4 w-4"/>
                    Account Created
                  </Label>
                  <Input value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'} disabled className="bg-gray-50 dark:bg-gray-900"/>
                </div>
              </CardContent>
            </Card>
          </div>

          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5"/>
                Accommodation Status
              </CardTitle>
              <CardDescription>
                Your payment and reservation status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 rounded-lg border bg-gray-50 dark:bg-gray-900 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold">
                      <CreditCard className="h-5 w-5 text-blue-500"/>
                      Payment Status
                    </Label>
                    {getStatusBadge(profile?.paymentStatus)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profile?.paymentStatus === 'completed'
            ? 'Your payment has been verified and confirmed'
            : 'Complete payment to proceed with hostel selection'}
                  </p>
                </div>

                <div className="p-6 rounded-lg border bg-gray-50 dark:bg-gray-900 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold">
                      <Home className="h-5 w-5 text-blue-500"/>
                      Reservation Status
                    </Label>
                    {getStatusBadge(profile?.reservationStatus)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profile?.reservationStatus === 'confirmed'
            ? 'Your hostel reservation is confirmed'
            : 'No active reservation yet'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4"/>
            <AlertDescription>
              You can update your personal information using the &quot;Edit Profile&quot; button above. 
              For password and security settings, visit the <button onClick={() => router.push('/student/settings')} className="font-medium underline">Settings page</button>.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}
