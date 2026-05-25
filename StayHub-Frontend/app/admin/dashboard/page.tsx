'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from 'recharts';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Users, Building2, DoorOpen, CheckCircle, Clock, UserCheck, ArrowRight, TrendingUp, Home, LogIn, LogOut, } from 'lucide-react';
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
}
function StatCard({ label, value, sub, icon: Icon, iconBg }: StatCardProps) {
    return (<div className="rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl sm:h-12 sm:w-12 ${iconBg}`}>
          <Icon className="h-5 w-5 text-foreground sm:h-6 sm:w-6"/>
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
      catch (error: unknown) {
        const status = typeof error === 'object' && error !== null && 'response' in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;
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
    const occupancyChartData = [
        { label: 'Total', rooms: stats?.totalRooms ?? 0 },
        { label: 'Occupied', rooms: stats?.occupiedRooms ?? 0 },
        { label: 'Available', rooms: stats?.availableRooms ?? 0 },
    ];
    const occupancyChartConfig = {
        rooms: {
            label: 'Rooms',
            color: 'var(--primary)',
        },
    } satisfies ChartConfig;
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
          
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                Welcome back, {user?.firstName || 'Admin'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Here&apos;s a full overview of your accommodation system.
              </p>
            </div>
          </div>

          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            <StatCard label="Total Students" value={stats?.totalStudents ?? 0} sub="Registered" icon={Users} iconBg="bg-violet-100 dark:bg-violet-900/30"/>
            <StatCard label="Students Paid" value={stats?.studentsPaid ?? 0} sub={`${paidPct}% rate`} icon={LogIn} iconBg="bg-emerald-100 dark:bg-emerald-900/30"/>
            <StatCard label="Total Rooms" value={stats?.totalRooms ?? 0} sub="All rooms" icon={DoorOpen} iconBg="bg-sky-100 dark:bg-sky-900/30"/>
            <StatCard label="Available Rooms" value={stats?.availableRooms ?? 0} sub="Ready to book" icon={CheckCircle} iconBg="bg-teal-100 dark:bg-teal-900/30"/>
            <StatCard label="Occupied Rooms" value={stats?.occupiedRooms ?? 0} sub={`${occupancyPct}% full`} icon={LogOut} iconBg="bg-orange-100 dark:bg-orange-900/30"/>
          </div>

          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4">
            <StatCard label="Total Hostels" value={stats?.totalHostels ?? 0} sub="Active hostels" icon={Building2} iconBg="bg-indigo-100 dark:bg-indigo-900/30"/>
            <StatCard label="Total Porters" value={stats?.totalPorters ?? 0} sub="Active porters" icon={UserCheck} iconBg="bg-pink-100 dark:bg-pink-900/30"/>
            <StatCard label="Pending Payments" value={stats?.studentsPending ?? 0} sub="Awaiting payment" icon={Clock} iconBg="bg-amber-100 dark:bg-amber-900/30"/>
            <StatCard label="Payment Rate" value={`${paidPct}%`} sub="Of all students" icon={TrendingUp} iconBg="bg-primary/10"/>
          </div>

          
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
                <QuickLink icon={Users} label="Manage Students" sub="View and edit student records" onClick={() => router.push('/admin/dashboard/students')} iconBg="bg-violet-100 dark:bg-violet-900/30" iconColor="text-violet-600"/>
                <QuickLink icon={Building2} label="Manage Colleges" sub="View departments and colleges" onClick={() => router.push('/admin/colleges')} iconBg="bg-sky-100 dark:bg-sky-900/30" iconColor="text-sky-600"/>
                <QuickLink icon={Home} label="Manage Hostels" sub="View hostel details and rooms" onClick={() => router.push('/admin/dashboard/hostels')} iconBg="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600"/>
                <QuickLink icon={UserCheck} label="Manage Porters" sub="Create and assign porters" onClick={() => router.push('/admin/porters')} iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-600"/>
              </div>
            </div>

            
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
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

          
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="min-w-0">
                <CardTitle>Room Occupancy Status</CardTitle>
                <CardDescription>
                  {stats?.occupiedRooms ?? 0} of {stats?.totalRooms ?? 0} rooms are occupied
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/rooms')} className="w-full gap-2 text-xs sm:w-auto">
                <DoorOpen className="h-3.5 w-3.5"/>
                Manage Rooms
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-center">
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {[
                    { label: 'Total Rooms', value: stats?.totalRooms ?? 0 },
                    { label: 'Occupied', value: stats?.occupiedRooms ?? 0 },
                    { label: 'Available', value: stats?.availableRooms ?? 0 },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mx-auto w-full min-w-0 max-w-2xl">
                  <ChartContainer config={occupancyChartConfig} className="h-[220px] w-full sm:h-[260px] md:h-[280px] lg:h-[300px]">
                    <BarChart
                      accessibilityLayer
                      data={occupancyChartData}
                      margin={{
                        top: 18,
                        left: 0,
                        right: 8,
                        bottom: 4,
                      }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        tickMargin={8}
                        axisLine={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Bar dataKey="rooms" fill="var(--color-rooms)" radius={8} barSize={32}>
                        <LabelList
                          dataKey="rooms"
                          position="top"
                          offset={6}
                          className="fill-foreground"
                          fontSize={10}
                        />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1.5 pt-0 text-sm">
              <div className="flex gap-2 leading-none font-medium">
                Occupancy currently at {occupancyPct}% <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-xs leading-none text-muted-foreground">
                Comparing total rooms against occupied and available capacity
              </div>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}
