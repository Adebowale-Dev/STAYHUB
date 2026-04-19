'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { ActionDropdown } from '@/components/ui/action-dropdown';
import { Badge } from '@/components/ui/badge';
import { Ticket, CreditCard, Building2, Home, FileText, Settings, CheckCircle2, Clock, AlertCircle, MapPin, Users, Bed, User } from 'lucide-react';
interface Reservation {
    _id: string;
    hostel: {
        name: string;
        location: string;
    };
    room: {
        roomNumber: string;
        floor: number;
    };
    status: string;
}
interface Payment {
    _id: string;
    amount: number;
    status: string;
    reference?: string;
    paymentDate?: string;
}
interface StudentDashboardData {
    hasReservation?: boolean;
    hasPaid?: boolean;
    availableHostels?: number;
    reservation?: Reservation;
    payment?: Payment;
    profile?: {
        firstName?: string;
        lastName?: string;
        name?: string;
        matricNo?: string;
        matricNumber?: string;
        email: string;
        phoneNumber?: string;
        address?: string;
        dateOfBirth?: string;
        gender?: string;
        college?: {
            name: string;
        };
        department?: {
            name: string;
        };
        level?: string | number;
    };
    student?: {
        name: string;
        matricNumber: string;
        email: string;
        college?: string;
        department?: string;
    };
}
export default function StudentDashboard() {
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchDashboardData();
    }, []);
    const fetchDashboardData = async (retryCount = 0) => {
        try {
            const response = await studentAPI.getDashboard();
            console.log('Dashboard API Response:', response.data);
            const data = response.data.data || response.data;
            console.log('Dashboard Data:', data);
            console.log('Profile:', data?.profile);
            console.log('Student Name:', data?.profile?.name || `${data?.profile?.firstName || ''} ${data?.profile?.lastName || ''}`.trim());
            const mappedData = {
                ...data,
                hasPaid: data.paymentStatus === 'paid' || data.hasPaid,
                hasReservation: data.reservationStatus === 'temporary' ||
                    data.reservationStatus === 'checked_in' ||
                    data.reservationStatus === 'confirmed' ||
                    data.hasReservation
            };
            console.log('Mapped Data:', { hasPaid: mappedData.hasPaid, hasReservation: mappedData.hasReservation });
            setDashboardData(mappedData);
        }
        catch (error: any) {
            console.error('Failed to fetch dashboard:', error);
            if (error.response?.status === 429 && retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchDashboardData(retryCount + 1);
            }
        }
        finally {
            setLoading(false);
        }
    };
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
            case 'confirmed':
                return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
            case 'temporary':
            case 'pending':
                return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
            case 'failed':
            case 'cancelled':
                return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
        }
    };
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
            case 'confirmed':
                return <CheckCircle2 className="h-4 w-4"/>;
            case 'temporary':
            case 'pending':
                return <Clock className="h-4 w-4"/>;
            case 'failed':
            case 'cancelled':
                return <AlertCircle className="h-4 w-4"/>;
            default:
                return <Ticket className="h-4 w-4"/>;
        }
    };
    const isProfileComplete = () => {
        if (!dashboardData?.profile)
            return false;
        const profile = dashboardData.profile;
        const requiredFields = [
            profile.firstName || profile.name,
            profile.email,
            profile.phoneNumber,
            profile.address,
            profile.dateOfBirth,
            profile.gender,
            profile.matricNo || profile.matricNumber,
            profile.level,
            profile.college,
            profile.department
        ];
        return requiredFields.every(field => field && field !== '');
    };
    const getCompletionProgress = () => {
        let completed = 0;
        const total = 3;
        if (isProfileComplete())
            completed++;
        if (dashboardData?.hasPaid)
            completed++;
        if (dashboardData?.hasReservation)
            completed++;
        return Number(((completed / total) * 100).toFixed(2));
    };
    if (loading) {
        return (<ProtectedRoute allowedRoles={["student"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <div className="h-10 w-10 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin"/>
              <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>);
    }
    const completionProgress = getCompletionProgress();
    return (<ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="space-y-6">
          
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {dashboardData?.profile?.firstName || dashboardData?.student?.name?.split(' ')[0] || 'Student'} 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {(dashboardData?.profile?.matricNo || dashboardData?.student?.matricNumber) && `${dashboardData?.profile?.matricNo || dashboardData?.student?.matricNumber} • `}
                {dashboardData?.profile?.department?.name || dashboardData?.student?.department || 'Manage your hostel accommodation'}
              </p>
            </div>
            <ActionDropdown title="Quick Actions" actions={[
            { label: 'Browse Hostels', icon: Home, onClick: () => router.push('/student/hostels') },
            { label: 'View Reservation', icon: FileText, onClick: () => router.push('/student/reservation'), separator: true },
            { label: 'Settings', icon: Settings, onClick: () => router.push('/student/settings') },
        ]}/>
          </div>

          
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-foreground">Setup Progress</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Complete your accommodation setup</p>
              </div>
              <div className="text-2xl font-bold text-primary">{completionProgress}%</div>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden mb-4">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-700" style={{ width: `${completionProgress}%` }}/>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
            {
                label: 'Profile',
                done: isProfileComplete(),
                icon: User,
                doneText: 'Complete',
                pendingText: 'Incomplete',
                bg: 'bg-violet-100 dark:bg-violet-900/30',
                color: 'text-violet-600',
            },
            {
                label: 'Payment',
                done: dashboardData?.hasPaid,
                icon: CreditCard,
                doneText: 'Completed',
                pendingText: 'Pending',
                bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                color: 'text-emerald-600',
            },
            {
                label: 'Reservation',
                done: dashboardData?.hasReservation,
                icon: Ticket,
                doneText: 'Active',
                pendingText: 'Not started',
                bg: 'bg-sky-100 dark:bg-sky-900/30',
                color: 'text-sky-600',
            },
        ].map((step) => {
            const Icon = step.icon;
            return (<div key={step.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                    <div className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ${step.done ? step.bg : 'bg-muted'}`}>
                      {step.done
                    ? <CheckCircle2 className={`h-4.5 w-4.5 ${step.color}`}/>
                    : <Icon className="h-4 w-4 text-muted-foreground"/>}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{step.label}</p>
                      <p className={`text-xs ${step.done ? step.color : 'text-muted-foreground'}`}>
                        {step.done ? step.doneText : step.pendingText}
                      </p>
                    </div>
                  </div>);
        })}
            </div>
          </div>

          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            
            <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reservation</p>
                  <p className="mt-1.5 text-xl font-bold text-foreground">
                    {dashboardData?.reservation?.status === 'temporary'
            ? 'Pending Approval'
            : dashboardData?.hasReservation
                ? 'Active'
                : 'No Reservation'}
                  </p>
                  {dashboardData?.reservation && (<Badge variant="outline" className={`mt-1.5 gap-1 text-xs ${getStatusColor(dashboardData.reservation.status)}`}>
                      {getStatusIcon(dashboardData.reservation.status)}
                      <span className="capitalize">{dashboardData.reservation.status}</span>
                    </Badge>)}
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
                  <Ticket className="h-5 w-5 text-indigo-600"/>
                </div>
              </div>
              {dashboardData?.reservation ? (<div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3 mt-3">
                  <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5"/> {dashboardData.reservation.hostel.name}</div>
                  <div className="flex items-center gap-2"><Bed className="h-3.5 w-3.5"/> Room {dashboardData.reservation.room.roomNumber}, Floor {dashboardData.reservation.room.floor}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5"/> {dashboardData.reservation.hostel.location}</div>
                </div>) : (<p className="text-xs text-muted-foreground mt-2">Browse available hostels to make a reservation</p>)}
              <Button size="sm" variant="outline" className="w-full mt-4 rounded-xl text-xs gap-2" onClick={() => router.push('/student/reservation')}>
                <Ticket className="h-3.5 w-3.5"/> View Details
              </Button>
            </div>

            
            <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</p>
                  <p className={`mt-1.5 text-xl font-bold ${dashboardData?.hasPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {dashboardData?.hasPaid ? 'Paid' : 'Pending'}
                  </p>
                  {dashboardData?.payment && (<Badge variant="outline" className={`mt-1.5 gap-1 text-xs ${getStatusColor(dashboardData.payment.status)}`}>
                      {getStatusIcon(dashboardData.payment.status)}
                      <span className="capitalize">{dashboardData.payment.status}</span>
                    </Badge>)}
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${dashboardData?.hasPaid ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                  <CreditCard className={`h-5 w-5 ${dashboardData?.hasPaid ? 'text-emerald-600' : 'text-amber-600'}`}/>
                </div>
              </div>
              {dashboardData?.payment ? (<div className="space-y-1.5 text-xs border-t border-border pt-3 mt-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold">₦{dashboardData.payment.amount.toLocaleString()}</span></div>
                  {dashboardData.payment.reference && <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><code className="font-mono text-xs">{dashboardData.payment.reference.slice(0, 12)}…</code></div>}
                  {dashboardData.payment.paymentDate && <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(dashboardData.payment.paymentDate).toLocaleDateString()}</span></div>}
                </div>) : (<p className="text-xs text-muted-foreground mt-2">Payment required to proceed with hostel selection</p>)}
              {!dashboardData?.hasPaid && (<Button size="sm" className="w-full mt-4 rounded-xl text-xs gap-2" onClick={() => router.push('/student/payment')}>
                  <CreditCard className="h-3.5 w-3.5"/> Make Payment
                </Button>)}
            </div>

            
            <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available Hostels</p>
                  <p className="mt-1.5 text-3xl font-bold text-sky-600">{dashboardData?.availableHostels || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Ready for booking</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-900/30">
                  <Building2 className="h-5 w-5 text-sky-600"/>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full mt-4 rounded-xl text-xs gap-2" onClick={() => router.push('/student/hostels')}>
                <Home className="h-3.5 w-3.5"/> Browse Hostels
              </Button>
            </div>
          </div>

          
          {(!isProfileComplete() || !dashboardData?.hasPaid || !dashboardData?.hasReservation) && (<div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-violet-50 dark:to-violet-950/10 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary"/>
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Next Steps</h2>
                  <p className="text-xs text-muted-foreground">Complete these steps to secure your accommodation</p>
                </div>
              </div>
              <div className="space-y-3">
                {!isProfileComplete() && (<div className="flex items-start gap-3 p-3 rounded-xl bg-card">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">Complete Your Profile</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Fill in all required information in your profile</p>
                      <Button variant="outline" size="sm" className="mt-2 rounded-lg text-xs gap-1.5" onClick={() => router.push('/student/profile')}>
                        <User className="h-3.5 w-3.5"/> Go to Profile
                      </Button>
                    </div>
                  </div>)}
                {!dashboardData?.hasPaid && (<div className="flex items-start gap-3 p-3 rounded-xl bg-card">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                      {isProfileComplete() ? '1' : '2'}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">Complete Payment</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isProfileComplete() ? 'Pay your accommodation fee to unlock hostel selection' : 'Available after profile completion'}
                      </p>
                    </div>
                  </div>)}
                {!dashboardData?.hasReservation && (<div className="flex items-start gap-3 p-3 rounded-xl bg-card">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                      {isProfileComplete() && dashboardData?.hasPaid ? '1' : isProfileComplete() || dashboardData?.hasPaid ? '2' : '3'}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">Select Your Hostel</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isProfileComplete() && dashboardData?.hasPaid ? 'Browse available hostels and make your reservation' : 'Available after profile completion and payment'}
                      </p>
                    </div>
                  </div>)}
              </div>
            </div>)}
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}
