'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Users, CreditCard, Building2, DoorOpen, CheckCircle, Clock, UserCheck, ArrowRight, TrendingUp, Home, LogIn, LogOut, } from 'lucide-react';
import useAdminStore from '@/store/useAdminStore';
import useAuthStore from '@/store/useAuthStore';
import { adminAPI } from '@/services/api';
interface StatCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
    iconBg: string;
    iconColor: string;
    accent?: string;
}
function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, accent }: StatCardProps) {
    return (<div className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${accent ?? 'text-foreground'}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`}/>
        </div>
      </div>
    </div>);
}
function QuickLink({ icon: Icon, label, sub, onClick, iconBg, iconColor, }: {
    icon: React.ComponentType<{
        className?: string;
    }>;
    label: string;
    sub: string;
    onClick: () => void;
    iconBg: string;
    iconColor: string;
}) {
    return (<button onClick={onClick} className="flex items-center gap-4 w-full rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200 group text-left">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`}/>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all"/>
    </button>);
}
export default function AdminDashboard() {
    const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
    const { dashboardStats, statsLoading, setDashboardStats, setStatsLoading } = useAdminStore();
    useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      return;
    }

        const fetchDashboardData = async () => {
            try {
                setStatsLoading(true);
                const response = await adminAPI.getDashboard();
                setDashboardStats(response.data.data);
            }
      catch (error: any) {
        const status = error?.response?.status;
        if (status !== 401 && status !== 403) {
          console.error('Failed to fetch dashboard:', error);
        }
            }
            finally {
                setStatsLoading(false);
            }
        };
        fetchDashboardData();
  }, [isAuthenticated, user?.role, setDashboardStats, setStatsLoading]);
    const stats = dashboardStats;
    const paidPct = stats?.totalStudents && stats.totalStudents > 0
        ? Math.round((stats.studentsPaid / stats.totalStudents) * 100)
        : 0;
    const occupancyPct = stats?.totalRooms && stats.totalRooms > 0
        ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100)
        : 0;
    if (statsLoading) {
        return (<ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <div className="h-10 w-10 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin"/>
              <p className="text-sm text-muted-foreground">Loading dashboard…</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>);
    }
    return (<ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {user?.firstName || 'Admin'} 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Here&apos;s a full overview of your accommodation system.
              </p>
            </div>
          </div>

          
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Total Students" value={stats?.totalStudents ?? 0} sub="Registered" icon={Users} iconBg="bg-violet-100 dark:bg-violet-900/30" iconColor="text-violet-600" accent="text-violet-600"/>
            <StatCard label="Students Paid" value={stats?.studentsPaid ?? 0} sub={`${paidPct}% rate`} icon={LogIn} iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-600" accent="text-emerald-600"/>
            <StatCard label="Total Rooms" value={stats?.totalRooms ?? 0} sub="All rooms" icon={DoorOpen} iconBg="bg-sky-100 dark:bg-sky-900/30" iconColor="text-sky-600" accent="text-sky-600"/>
            <StatCard label="Available Rooms" value={stats?.availableRooms ?? 0} sub="Ready to book" icon={CheckCircle} iconBg="bg-teal-100 dark:bg-teal-900/30" iconColor="text-teal-600" accent="text-teal-600"/>
            <StatCard label="Occupied Rooms" value={stats?.occupiedRooms ?? 0} sub={`${occupancyPct}% full`} icon={LogOut} iconBg="bg-orange-100 dark:bg-orange-900/30" iconColor="text-orange-500" accent="text-orange-500"/>
          </div>

          
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Hostels" value={stats?.totalHostels ?? 0} sub="Active hostels" icon={Building2} iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-600"/>
            <StatCard label="Total Porters" value={stats?.totalPorters ?? 0} sub="Active porters" icon={UserCheck} iconBg="bg-pink-100 dark:bg-pink-900/30" iconColor="text-pink-600"/>
            <StatCard label="Pending Payments" value={stats?.studentsPending ?? 0} sub="Awaiting payment" icon={Clock} iconBg="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600"/>
            <StatCard label="Payment Rate" value={`${paidPct}%`} sub="Of all students" icon={TrendingUp} iconBg="bg-primary/10" iconColor="text-primary" accent="text-primary"/>
          </div>

          
          <div className="grid gap-4 lg:grid-cols-2">
            
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
              <div className="space-y-2.5">
                <QuickLink icon={Users} label="Manage Students" sub="View and edit student records" onClick={() => router.push('/admin/dashboard/students')} iconBg="bg-violet-100 dark:bg-violet-900/30" iconColor="text-violet-600"/>
                <QuickLink icon={Building2} label="Manage Colleges" sub="View departments and colleges" onClick={() => router.push('/admin/colleges')} iconBg="bg-sky-100 dark:bg-sky-900/30" iconColor="text-sky-600"/>
                <QuickLink icon={Home} label="Manage Hostels" sub="View hostel details and rooms" onClick={() => router.push('/admin/dashboard/hostels')} iconBg="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600"/>
                <QuickLink icon={UserCheck} label="Manage Porters" sub="Create and assign porters" onClick={() => router.push('/admin/porters')} iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-600"/>
              </div>
            </div>

            
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-foreground">Payment Overview</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Student payment status</p>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground"/>
              </div>

              
              <div className="mb-5">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground font-medium">Payment completion</span>
                  <span className="font-bold text-foreground">{paidPct}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-700" style={{ width: `${paidPct}%` }}/>
                </div>
              </div>

              
              <div className="space-y-3 mb-5">
                {[
            { label: 'Total Students', value: stats?.totalStudents ?? 0, color: 'bg-muted-foreground/30', text: '' },
            { label: 'Successfully Paid', value: stats?.studentsPaid ?? 0, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Pending Payment', value: stats?.studentsPending ?? 0, color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
        ].map((item) => (<div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color}`}/>
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${item.text || 'text-foreground'}`}>
                      {item.value}
                    </span>
                  </div>))}
              </div>

              <Button className="w-full gap-2" onClick={() => router.push('/admin/payments')}>
                View All Payments
                <ArrowRight className="h-4 w-4"/>
              </Button>
            </div>
          </div>

          
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-foreground">Room Occupancy Status</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stats?.occupiedRooms ?? 0} of {stats?.totalRooms ?? 0} rooms are occupied
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/rooms')} className="gap-2 text-xs">
                <DoorOpen className="h-3.5 w-3.5"/>
                Manage Rooms
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
            { label: 'Total Rooms', value: stats?.totalRooms ?? 0, pct: 100, color: 'bg-primary' },
            { label: 'Occupied', value: stats?.occupiedRooms ?? 0, pct: occupancyPct, color: 'bg-orange-500' },
            { label: 'Available', value: stats?.availableRooms ?? 0, pct: 100 - occupancyPct, color: 'bg-emerald-500' },
        ].map((item) => (<div key={item.label} className="text-center">
                  <div className="relative flex items-center justify-center mb-2">
                    <svg className="h-20 w-20 -rotate-90">
                      <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/50"/>
                      <circle cx="40" cy="40" r="30" fill="none" strokeWidth="8" strokeDasharray={`${(item.pct / 100) * 2 * Math.PI * 30} ${2 * Math.PI * 30}`} className={item.color.replace('bg-', 'stroke-')} strokeLinecap="round"/>
                    </svg>
                    <span className="absolute text-lg font-bold text-foreground">{item.value}</span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground/60">{item.pct}%</p>
                </div>))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}
