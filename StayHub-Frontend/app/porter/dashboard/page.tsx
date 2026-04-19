'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { porterAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActionDropdown } from '@/components/ui/action-dropdown';
import { Users, CheckCircle, Clock, Home, UserCheck, UserX, AlertCircle, TrendingUp, Calendar, ArrowRight, FileText, DoorOpen, } from 'lucide-react';
interface PorterDashboardData {
    totalStudents?: number;
    checkedIn?: number;
    pendingCheckIn?: number;
    hostelName?: string;
    hostelCapacity?: number;
    todayCheckIns?: number;
    recentActivity?: Array<{
        _id: string;
        studentName: string;
        action: string;
        timestamp: string;
    }>;
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
export default function PorterDashboard() {
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<PorterDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchDashboardData();
    }, []);
    const fetchDashboardData = async () => {
        try {
            const [dashboardResponse, studentsResponse] = await Promise.all([
                porterAPI.getDashboard(),
                porterAPI.getStudents()
            ]);
            console.log('Dashboard API response:', dashboardResponse.data);
            console.log('Students API response:', studentsResponse.data);
            const dashboardInfo = dashboardResponse.data.data || dashboardResponse.data;
            const studentsData = studentsResponse.data.data || studentsResponse.data || [];
            const totalStudents = studentsData.length;
            const checkedIn = studentsData.filter((s: any) => s.checkInStatus === 'checked-in' ||
                s.checkInStatus === 'checked_in' ||
                s.reservationStatus === 'checked_in' ||
                s.reservationStatus === 'checked-in' ||
                s.status === 'checked-in' ||
                s.status === 'checked_in').length;
            const pendingCheckIn = studentsData.filter((s: any) => {
                const hasAssignment = s.assignedRoom || s.roomAssignment || s.reservation?.room;
                const isNotCheckedIn = !(s.checkInStatus === 'checked-in' ||
                    s.checkInStatus === 'checked_in' ||
                    s.reservationStatus === 'checked_in' ||
                    s.reservationStatus === 'checked-in' ||
                    s.status === 'checked-in' ||
                    s.status === 'checked_in');
                return hasAssignment && isNotCheckedIn;
            }).length;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayCheckIns = studentsData.filter((s: any) => {
                const checkInDate = s.checkInDate || s.reservation?.checkedInAt;
                if (!checkInDate)
                    return false;
                const date = new Date(checkInDate);
                date.setHours(0, 0, 0, 0);
                return date.getTime() === today.getTime();
            }).length;
            setDashboardData({
                ...dashboardInfo,
                totalStudents,
                checkedIn,
                pendingCheckIn,
                todayCheckIns
            });
        }
        catch (error) {
            console.error('Failed to fetch dashboard:', error);
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (<ProtectedRoute allowedRoles={['porter']}>
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
    const checkInPct = dashboardData?.totalStudents
        ? Math.round(((dashboardData.checkedIn || 0) / dashboardData.totalStudents) * 100)
        : 0;
    const occupancyPct = dashboardData?.hostelCapacity
        ? Math.round(((dashboardData.totalStudents || 0) / dashboardData.hostelCapacity) * 100)
        : 0;
    return (<ProtectedRoute allowedRoles={['porter']}>
      <DashboardLayout>
        <div className="space-y-6">
          
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Porter Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {dashboardData?.hostelName || 'Hostel'} — Manage student check-ins and operations
              </p>
            </div>
            <ActionDropdown title="Quick Actions" actions={[
            { label: 'Check-in Student', icon: UserCheck, onClick: () => router.push('/porter/checkin') },
            { label: 'View Students', icon: Users, onClick: () => router.push('/porter/students') },
            { label: 'Manage Rooms', icon: DoorOpen, onClick: () => router.push('/porter/rooms'), separator: true },
            { label: 'Reports', icon: FileText, onClick: () => router.push('/porter/reports') },
        ]}/>
          </div>

          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Students</p>
                  <p className="mt-2 text-3xl font-bold text-violet-600">{dashboardData?.totalStudents || 0}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Home className="h-3 w-3 text-muted-foreground"/>
                    <p className="text-xs text-muted-foreground">Assigned to hostel</p>
                  </div>
                  {dashboardData?.hostelCapacity && (<Badge variant="outline" className="mt-2 text-xs">{occupancyPct}% Occupancy</Badge>)}
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30">
                  <Users className="h-6 w-6 text-violet-600"/>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checked In</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">{dashboardData?.checkedIn || 0}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <UserCheck className="h-3 w-3 text-muted-foreground"/>
                    <p className="text-xs text-muted-foreground">Successfully checked in</p>
                  </div>
                  {dashboardData?.totalStudents && (<Badge variant="outline" className="mt-2 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">{checkInPct}% Complete</Badge>)}
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle className="h-6 w-6 text-emerald-600"/>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">{dashboardData?.pendingCheckIn || 0}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <UserX className="h-3 w-3 text-muted-foreground"/>
                    <p className="text-xs text-muted-foreground">Awaiting check-in</p>
                  </div>
                  {!!dashboardData?.pendingCheckIn && dashboardData.pendingCheckIn > 0 && (<Badge variant="outline" className="mt-2 text-xs bg-amber-50 text-amber-700 border-amber-200">Action Required</Badge>)}
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="h-6 w-6 text-amber-600"/>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today&apos;s Check-ins</p>
                  <p className="mt-2 text-3xl font-bold text-sky-600">{dashboardData?.todayCheckIns || 0}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground"/>
                    <p className="text-xs text-muted-foreground">Checked in today</p>
                  </div>
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-900/30">
                  <Calendar className="h-6 w-6 text-sky-600"/>
                </div>
              </div>
            </div>
          </div>

          
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-foreground">Check-In Progress</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dashboardData?.checkedIn || 0} of {dashboardData?.totalStudents || 0} students checked in
                </p>
              </div>
              <div className="text-2xl font-bold text-primary">{checkInPct}%</div>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-700" style={{ width: `${checkInPct}%` }}/>
            </div>
          </div>

          
          <div className="grid gap-4 lg:grid-cols-2">
            
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
              <div className="space-y-2.5">
                <QuickLink icon={UserCheck} label="Check-in Student" sub="Verify and check in a student" onClick={() => router.push('/porter/checkin')} iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-600"/>
                <QuickLink icon={Users} label="View All Students" sub="Browse student list and details" onClick={() => router.push('/porter/students')} iconBg="bg-violet-100 dark:bg-violet-900/30" iconColor="text-violet-600"/>
                <QuickLink icon={DoorOpen} label="Manage Rooms" sub="View and update room status" onClick={() => router.push('/porter/rooms')} iconBg="bg-sky-100 dark:bg-sky-900/30" iconColor="text-sky-600"/>
                <QuickLink icon={FileText} label="Reports" sub="View hostel activity reports" onClick={() => router.push('/porter/reports')} iconBg="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600"/>
              </div>
            </div>

            
            <div className="space-y-3">
              {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (<>
                  <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
                    {dashboardData.recentActivity.map((activity) => (<div key={activity._id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <UserCheck className="h-4 w-4 text-primary"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{activity.studentName}</p>
                          <p className="text-xs text-muted-foreground">{activity.action}</p>
                        </div>
                        <p className="text-xs text-muted-foreground flex-shrink-0">
                          {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>))}
                  </div>
                </>) : (<>
                  <h2 className="text-base font-semibold text-foreground">Porter Guide</h2>
                  <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-violet-50 dark:to-violet-950/10 p-5">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-primary"/>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Porter Responsibilities</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          As a porter, you are responsible for checking in students, maintaining hostel records,
                          and ensuring smooth daily operations. For any issues or emergencies, contact the hostel administrator immediately.
                        </p>
                        <Button size="sm" variant="outline" className="mt-3 rounded-xl text-xs gap-1.5" onClick={() => router.push('/porter/checkin')}>
                          <UserCheck className="h-3.5 w-3.5"/> Start Check-In
                        </Button>
                      </div>
                    </div>
                  </div>
                </>)}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}
