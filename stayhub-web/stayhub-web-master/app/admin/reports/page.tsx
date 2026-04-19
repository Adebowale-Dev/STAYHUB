'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Users, Building2, CreditCard, TrendingUp, DoorOpen, UserCheck, Calendar, BarChart3 } from 'lucide-react';
interface DashboardStats {
    totalStudents: number;
    studentsPaid: number;
    studentsPending: number;
    totalHostels: number;
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    totalPorters: number;
}
interface Student {
    _id: string;
    name: string;
    email: string;
    matricNumber: string;
    department?: {
        name: string;
        college: {
            name: string;
        };
    };
    paymentStatus?: string;
    roomAllocation?: {
        hostel: {
            name: string;
        };
        room: {
            roomNumber: string;
        };
        bunkNumber?: number;
    };
    createdAt: string;
}
interface Hostel {
    _id: string;
    name: string;
    gender: string;
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    capacity: number;
    currentOccupants: number;
}
interface Payment {
    _id: string;
    student: {
        _id: string;
        name: string;
        matricNumber: string;
        email: string;
    };
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    reference?: string;
    paymentDate?: string;
    createdAt: string;
}
interface PaymentStats {
    totalRevenue: number;
    totalPaid: number;
    totalPending: number;
    totalFailed: number;
}
function ReportDonut({ segments, label, }: {
    segments: Array<{
        value: number;
        color: string;
        label: string;
    }>;
    label: string;
}) {
    const total = segments.reduce((s, d) => s + d.value, 0);
    const r = 52, cx = 65, cy = 65, sw = 20;
    const circ = 2 * Math.PI * r;
    let accumulated = 0;
    return (<div className="flex items-center gap-6">
      <svg viewBox="0 0 130 130" className="w-[130px] h-[130px] shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={sw} stroke="#e5e7eb" className="dark:stroke-zinc-700"/>
        {total > 0 &&
            segments.map((s, i) => {
                const arcLen = (s.value / total) * circ;
                const offset = accumulated;
                accumulated += arcLen;
                if (arcLen < 1)
                    return null;
                return (<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={sw} strokeDasharray={`${arcLen} ${circ}`} strokeDashoffset={-offset} style={{ transformOrigin: `${cx}px ${cy}px`, transform: 'rotate(-90deg)' }}/>);
            })}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="20" fontWeight="700" className="fill-foreground">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#9ca3af">{label}</text>
      </svg>

      <div className="flex-1 space-y-3">
        {segments.map((s, i) => (<div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }}/>
                <span className="text-muted-foreground">{s.label}</span>
              </div>
              <span className="font-bold text-foreground">
                {s.value}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  {total > 0 ? `(${((s.value / total) * 100).toFixed(0)}%)` : ''}
                </span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full" style={{ width: total > 0 ? `${(s.value / total) * 100}%` : '0%', background: s.color }}/>
            </div>
          </div>))}
      </div>
    </div>);
}
function HostelBarChart({ hostels }: {
    hostels: Array<{
        name: string;
        currentOccupants: number;
        capacity: number;
    }>;
}) {
    const data = hostels.slice(0, 8);
    if (data.length === 0)
        return <p className="text-sm text-muted-foreground py-4 text-center">No hostel data</p>;
    return (<div className="space-y-3">
      {data.map((h, i) => {
            const pct = h.capacity > 0 ? Math.min(100, (h.currentOccupants / h.capacity) * 100) : 0;
            const color = pct >= 80 ? '#f43f5e' : pct >= 50 ? '#f59e0b' : '#10b981';
            return (<div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate max-w-[160px]">{h.name}</span>
              <span className="font-bold text-foreground shrink-0 ml-2">
                {h.currentOccupants}/{h.capacity}
                <span className="text-xs font-normal text-muted-foreground ml-1">({pct.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }}/>
            </div>
          </div>);
        })}
      <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-emerald-500 inline-block"/> &lt;50%</span>
        <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-amber-500 inline-block"/> 50–79%</span>
        <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-rose-500 inline-block"/> ≥80%</span>
      </div>
    </div>);
}
    const normalizeStudentPaymentStatus = (status?: string | null): 'paid' | 'pending' | 'failed' => {
      const normalized = String(status || '').toLowerCase().trim();
      if (['paid', 'completed', 'success', 'successful'].includes(normalized)) {
        return 'paid';
      }
      if (['failed', 'cancelled'].includes(normalized)) {
        return 'failed';
      }
      return 'pending';
    };
export default function ReportsPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            const [statsRes, studentsRes, hostelsRes, paymentsRes, paymentStatsRes] = await Promise.all([
                adminAPI.getDashboard(),
                adminAPI.getStudents(),
                adminAPI.getHostels(),
                adminAPI.getPayments({ limit: 200 }),
                adminAPI.getPaymentStats(),
            ]);
            console.log('Students API Response:', studentsRes.data);
            console.log('Hostels API Response:', hostelsRes.data);
            const paymentsData = paymentsRes.data.data || paymentsRes.data || [];
            const transformedPayments = paymentsData.map((payment: any) => ({
              ...payment,
              student: payment.student ? {
                _id: payment.student._id,
                name: payment.student.name || [payment.student.firstName, payment.student.lastName].filter(Boolean).join(' ').trim() || 'N/A',
                matricNumber: payment.student.matricNumber || payment.student.matricNo || 'N/A',
                email: payment.student.email,
                level: payment.student.level,
                firstName: payment.student.firstName,
                lastName: payment.student.lastName,
              } : null,
              reference: payment.paymentReference,
              paymentDate: payment.datePaid || payment.createdAt,
            }));
            const sortedPayments = [...transformedPayments].sort((left: any, right: any) => {
              const leftTime = new Date(left.paymentDate || left.updatedAt || left.createdAt || 0).getTime();
              const rightTime = new Date(right.paymentDate || right.updatedAt || right.createdAt || 0).getTime();
              return rightTime - leftTime;
            });
            const paidStudentIds = new Set(sortedPayments
              .filter((payment: any) => normalizeStudentPaymentStatus(payment.status) === 'paid')
              .map((payment: any) => String(payment.student?._id || ''))
              .filter(Boolean));
            const failedStudentIds = new Set(sortedPayments
              .filter((payment: any) => normalizeStudentPaymentStatus(payment.status) === 'failed')
              .map((payment: any) => String(payment.student?._id || ''))
              .filter(Boolean));
            const studentsData = studentsRes.data.data || studentsRes.data || [];
            console.log('Students data array:', studentsData);
            const mappedStudents = studentsData.map((student: any) => {
              const studentId = String(student._id || '');
              let resolvedPaymentStatus = normalizeStudentPaymentStatus(student.paymentStatus || student.payment?.status);
              const fullName = [student.firstName, student.lastName].filter(Boolean).join(' ').trim();
              const displayName = student.name || fullName || 'N/A';
              const matricNumber = student.matricNumber || student.matricNo || 'N/A';

              // Some older records have completed payments in Payment collection but stale student.paymentStatus.
              if (studentId && paidStudentIds.has(studentId)) {
                resolvedPaymentStatus = 'paid';
              }
              else if (studentId && failedStudentIds.has(studentId) && resolvedPaymentStatus !== 'paid') {
                resolvedPaymentStatus = 'failed';
              }

              return {
                ...student,
                name: displayName,
                matricNumber,
                paymentStatus: resolvedPaymentStatus,
                roomAllocation: student.reservation ? {
                    hostel: student.reservation.hostel || student.reservation.bunk?.room?.hostel,
                    room: student.reservation.room || student.reservation.bunk?.room,
                    bunkNumber: student.reservation.bunk?.bunkNumber
                } : (student.assignedHostel && student.assignedRoom) ? {
                    hostel: student.assignedHostel,
                    room: student.assignedRoom,
                    bunkNumber: student.assignedBunk?.bunkNumber
                } : null
              };
            });
            console.log('Mapped students:', mappedStudents);
            console.log('Students with room allocation:', mappedStudents.filter((s: any) => s.roomAllocation));
            const hostelsData = hostelsRes.data.data || hostelsRes.data || [];
            console.log('Hostels data:', hostelsData);
            console.log('First hostel details:', JSON.stringify(hostelsData[0], null, 2));
            const mappedHostels = hostelsData.map((hostel: any) => {
                const studentsInHostel = mappedStudents.filter((s: any) => s.roomAllocation?.hostel?._id === hostel._id ||
                    s.roomAllocation?.hostel?.id === hostel._id);
                const currentOccupants = studentsInHostel.length;
                const occupiedRoomIds = new Set(studentsInHostel
                    .filter((s: any) => s.roomAllocation?.room?._id || s.roomAllocation?.room?.id)
                    .map((s: any) => s.roomAllocation.room._id || s.roomAllocation.room.id));
                const occupiedRooms = occupiedRoomIds.size;
                const totalRooms = hostel.totalRooms || 0;
                const capacity = hostel.capacity || totalRooms * 6;
                return {
                    ...hostel,
                    totalRooms,
                    occupiedRooms,
                    availableRooms: totalRooms - occupiedRooms,
                    capacity,
                    currentOccupants
                };
            });
            console.log('Mapped hostels:', mappedHostels);
            setStats(statsRes.data.data || statsRes.data);
            setStudents(mappedStudents);
            setHostels(mappedHostels);
            setPayments(sortedPayments);
            setPaymentStats(paymentStatsRes.data.data || paymentStatsRes.data);
        }
        catch (error) {
            console.error('Failed to load reports data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const exportToCSV = (data: unknown[], filename: string, headers: string[]) => {
        setExporting(true);
        try {
            const csvContent = [
                headers.join(','),
                ...(data as Record<string, unknown>[]).map(row => headers.map(header => {
                    const value = row[header];
                    const stringValue = typeof value === 'object' && value !== null
                        ? JSON.stringify(value).replace(/,/g, ';')
                        : String(value || '');
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }).join(','))
            ].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            alert(`✅ Report exported successfully as ${filename}.csv`);
        }
        catch (error) {
            console.error('Export failed:', error);
            alert('❌ Failed to export report. Please try again.');
        }
        finally {
            setExporting(false);
        }
    };
    const exportStudentsReport = () => {
        const data = students.map(s => ({
            name: s.name,
            matricNumber: s.matricNumber,
            email: s.email,
            college: s.department?.college?.name || 'N/A',
            department: s.department?.name || 'N/A',
            paymentStatus: s.paymentStatus || 'pending',
            hostel: s.roomAllocation?.hostel?.name || 'Not Allocated',
            room: s.roomAllocation?.room?.roomNumber || 'N/A',
            bunk: s.roomAllocation?.bunkNumber || 'N/A',
            registeredDate: new Date(s.createdAt).toLocaleDateString(),
        }));
        exportToCSV(data, 'students_report', ['name', 'matricNumber', 'email', 'college', 'department', 'paymentStatus', 'hostel', 'room', 'bunk', 'registeredDate']);
    };
    const exportHostelsReport = () => {
        const data = hostels.map(h => ({
            name: h.name,
            gender: h.gender,
            totalRooms: h.totalRooms,
            occupiedRooms: h.occupiedRooms,
            availableRooms: h.availableRooms,
            capacity: h.capacity,
            currentOccupants: h.currentOccupants,
            occupancyRate: h.capacity > 0 ? `${((h.currentOccupants / h.capacity) * 100).toFixed(1)}%` : '0%',
        }));
        exportToCSV(data, 'hostels_report', ['name', 'gender', 'totalRooms', 'occupiedRooms', 'availableRooms', 'capacity', 'currentOccupants', 'occupancyRate']);
    };
    const exportPaymentsReport = () => {
        const data = payments.map(p => ({
            studentName: p.student?.name || 'N/A',
            matricNumber: p.student?.matricNumber || 'N/A',
            email: p.student?.email || 'N/A',
            amount: p.amount,
            status: p.status,
            reference: p.reference || 'N/A',
            paymentDate: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A',
            createdDate: new Date(p.createdAt).toLocaleDateString(),
        }));
        exportToCSV(data, 'payments_report', ['studentName', 'matricNumber', 'email', 'amount', 'status', 'reference', 'paymentDate', 'createdDate']);
    };
    if (loading) {
        return (<ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <div className="h-10 w-10 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin"/>
              <p className="text-sm text-muted-foreground">Loading reports…</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>);
    }
    const studentsByPaymentStatus = {
      paid: students.filter(s => s.paymentStatus === 'paid').length,
        pending: students.filter(s => s.paymentStatus === 'pending').length,
        failed: students.filter(s => s.paymentStatus === 'failed').length,
    };
    const studentsByAllocation = {
        allocated: students.filter(s => s.roomAllocation).length,
        notAllocated: students.filter(s => !s.roomAllocation).length,
    };
    const totalRevenue = paymentStats?.totalRevenue ||
        payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
    const occupancyRate = stats && stats.totalRooms > 0
        ? ((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(1)
        : '0';
    return (<ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive system reports and data exports
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border rounded-xl px-4 py-2">
              <Calendar className="h-4 w-4 text-primary"/>
              <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Students</p>
                  <p className="mt-2 text-3xl font-bold text-violet-600">{stats?.totalStudents || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Registered students</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30">
                  <Users className="h-6 w-6 text-violet-600"/>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Revenue</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">₦{totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">From completed payments</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                  <TrendingUp className="h-6 w-6 text-emerald-600"/>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Room Occupancy</p>
                  <p className="mt-2 text-3xl font-bold text-orange-500">{occupancyRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats?.occupiedRooms || 0} of {stats?.totalRooms || 0} rooms</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/30">
                  <DoorOpen className="h-6 w-6 text-orange-500"/>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Hostels</p>
                  <p className="mt-2 text-3xl font-bold text-sky-600">{stats?.totalHostels || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active hostels</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-900/30">
                  <Building2 className="h-6 w-6 text-sky-600"/>
                </div>
              </div>
            </div>
          </div>

          
          <Tabs defaultValue="students" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="students">
                <Users className="h-4 w-4 mr-2"/>
                Students
              </TabsTrigger>
              <TabsTrigger value="hostels">
                <Building2 className="h-4 w-4 mr-2"/>
                Hostels
              </TabsTrigger>
              <TabsTrigger value="payments">
                <CreditCard className="h-4 w-4 mr-2"/>
                Payments
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2"/>
                Analytics
              </TabsTrigger>
            </TabsList>

            
            <TabsContent value="students" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Student Registration Report</h3>
                <Button onClick={exportStudentsReport} disabled={exporting}>
                  <Download className="h-4 w-4 mr-2"/>
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-card border border-border p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment Completed</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">{studentsByPaymentStatus.paid}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.totalStudents ? `${((studentsByPaymentStatus.paid / stats.totalStudents) * 100).toFixed(1)}% of total` : '0%'}
                  </p>
                </div>
                <div className="rounded-2xl bg-card border border-border p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment Pending</p>
                  <p className="mt-2 text-2xl font-bold text-amber-600">{studentsByPaymentStatus.pending}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.totalStudents ? `${((studentsByPaymentStatus.pending / stats.totalStudents) * 100).toFixed(1)}% of total` : '0%'}
                  </p>
                </div>
                <div className="rounded-2xl bg-card border border-border p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Room Allocated</p>
                  <p className="mt-2 text-2xl font-bold text-sky-600">{studentsByAllocation.allocated}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.totalStudents ? `${((studentsByAllocation.allocated / stats.totalStudents) * 100).toFixed(1)}% allocated` : '0%'}
                  </p>
                </div>
              </div>

              
              {(stats?.totalStudents ?? 0) > 0 && (<div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-foreground">Payment Overview</p>
                    <p className="text-xs text-muted-foreground">{stats?.totalStudents} students total</p>
                  </div>
                  <div className="flex h-4 w-full rounded-full overflow-hidden gap-px">
                    {studentsByPaymentStatus.paid > 0 && (<div className="bg-emerald-500 h-full transition-all" style={{ width: `${(studentsByPaymentStatus.paid / (stats?.totalStudents || 1)) * 100}%` }} title={`Completed: ${studentsByPaymentStatus.paid}`}/>)}
                    {studentsByPaymentStatus.pending > 0 && (<div className="bg-amber-500 h-full transition-all" style={{ width: `${(studentsByPaymentStatus.pending / (stats?.totalStudents || 1)) * 100}%` }} title={`Pending: ${studentsByPaymentStatus.pending}`}/>)}
                    {studentsByPaymentStatus.failed > 0 && (<div className="bg-rose-500 h-full transition-all" style={{ width: `${(studentsByPaymentStatus.failed / (stats?.totalStudents || 1)) * 100}%` }} title={`Failed: ${studentsByPaymentStatus.failed}`}/>)}
                  </div>
                  <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"/> Completed ({studentsByPaymentStatus.paid})</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500"/> Pending ({studentsByPaymentStatus.pending})</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500"/> Failed ({studentsByPaymentStatus.failed})</span>
                  </div>
                </div>)}

              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h4 className="font-semibold text-foreground">Recent Student Registrations</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Latest 10 registered students</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead>Name</TableHead>
                      <TableHead>Matric Number</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.slice(0, 10).map((student) => (<TableRow key={student._id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="font-mono text-sm">{student.matricNumber}</TableCell>
                        <TableCell className="text-sm">{student.department?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {student.paymentStatus === 'paid' && (<Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs">Paid</Badge>)}
                          {student.paymentStatus === 'failed' && (<Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1 text-xs">Failed</Badge>)}
                          {student.paymentStatus === 'pending' && (<Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-xs">Pending</Badge>)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {student.roomAllocation ? (<span className="text-emerald-600">{student.roomAllocation.hostel.name} - Room {student.roomAllocation.room.roomNumber}</span>) : (<span className="text-muted-foreground">Not allocated</span>)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            
            <TabsContent value="hostels" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Hostel Occupancy Report</h3>
                <Button onClick={exportHostelsReport} disabled={exporting}>
                  <Download className="h-4 w-4 mr-2"/>
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h4 className="font-semibold text-foreground">Hostel Statistics</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Detailed occupancy and capacity information</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead>Hostel Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Total Rooms</TableHead>
                      <TableHead>Occupied</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Occupants</TableHead>
                      <TableHead>Occupancy Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hostels.map((hostel) => {
            const occupancyRate = hostel.capacity > 0
                ? ((hostel.currentOccupants / hostel.capacity) * 100).toFixed(1)
                : '0';
            const isHighOccupancy = parseFloat(occupancyRate) >= 80;
            const isMediumOccupancy = parseFloat(occupancyRate) >= 50 && parseFloat(occupancyRate) < 80;
            return (<TableRow key={hostel._id}>
                          <TableCell className="font-medium">{hostel.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {hostel.gender === 'male' ? '♂ Male' : '♀ Female'}
                            </Badge>
                          </TableCell>
                          <TableCell>{hostel.totalRooms}</TableCell>
                          <TableCell className="text-orange-600 font-medium">{hostel.occupiedRooms}</TableCell>
                          <TableCell className="text-emerald-600 font-medium">{hostel.availableRooms}</TableCell>
                          <TableCell>{hostel.capacity}</TableCell>
                          <TableCell>{hostel.currentOccupants}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full ${isHighOccupancy
                    ? 'bg-red-500'
                    : isMediumOccupancy
                        ? 'bg-orange-500'
                        : 'bg-emerald-500'}`} style={{ width: `${occupancyRate}%` }}/>
                              </div>
                              <span className="text-sm font-medium w-12 text-right">{occupancyRate}%</span>
                            </div>
                          </TableCell>
                        </TableRow>);
        })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            
            <TabsContent value="payments" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Payment Transaction Report</h3>
                <Button onClick={exportPaymentsReport} disabled={exporting}>
                  <Download className="h-4 w-4 mr-2"/>
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-card border border-border p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Revenue</p>
                  <p className="mt-2 text-xl font-bold text-emerald-600">₦{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-card border border-border p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Completed</p>
                  <p className="mt-2 text-xl font-bold text-emerald-600">
                    {paymentStats?.totalPaid || payments.filter(p => p.status === 'completed').length}
                  </p>
                </div>
                <div className="rounded-2xl bg-card border border-border p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending</p>
                  <p className="mt-2 text-xl font-bold text-amber-600">
                    {paymentStats?.totalPending || payments.filter(p => p.status === 'pending').length}
                  </p>
                </div>
                <div className="rounded-2xl bg-card border border-border p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Failed</p>
                  <p className="mt-2 text-xl font-bold text-rose-600">
                    {paymentStats?.totalFailed || payments.filter(p => p.status === 'failed').length}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h4 className="font-semibold text-foreground">Recent Transactions</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Latest 15 payment records</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead>Student</TableHead>
                      <TableHead>Matric Number</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.slice(0, 15).map((payment) => (<TableRow key={payment._id}>
                        <TableCell className="font-medium">{payment.student?.name || 'N/A'}</TableCell>
                        <TableCell className="font-mono text-sm">{payment.student?.matricNumber || 'N/A'}</TableCell>
                        <TableCell className="font-semibold">₦{payment.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          {payment.status === 'completed' && (<Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs">Completed</Badge>)}
                          {payment.status === 'pending' && (<Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-xs">Pending</Badge>)}
                          {payment.status === 'failed' && (<Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1 text-xs">Failed</Badge>)}
                        </TableCell>
                        <TableCell>
                          {payment.reference ? (<code className="text-xs bg-muted px-2 py-1 rounded">{payment.reference}</code>) : (<span className="text-muted-foreground text-sm">-</span>)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.paymentDate
                ? new Date(payment.paymentDate).toLocaleDateString()
                : new Date(payment.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            
            <TabsContent value="analytics" className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">System Analytics</h3>

              
              <div className="grid gap-4 md:grid-cols-2">
                
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h4 className="font-semibold text-foreground">Student Payment Status</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-5">Breakdown of payment outcomes</p>
                  <ReportDonut label="students" segments={[
            { value: studentsByPaymentStatus.paid, color: '#10b981', label: 'Completed' },
            { value: studentsByPaymentStatus.pending, color: '#f59e0b', label: 'Pending' },
            { value: studentsByPaymentStatus.failed, color: '#f43f5e', label: 'Failed' },
        ]}/>
                </div>

                
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h4 className="font-semibold text-foreground">Room Occupancy</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-5">Occupied vs available rooms</p>
                  <ReportDonut label="rooms" segments={[
            { value: stats?.occupiedRooms || 0, color: '#f59e0b', label: 'Occupied' },
            { value: stats?.availableRooms || 0, color: '#10b981', label: 'Available' },
        ]}/>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total rooms</span>
                    <span className="font-bold text-foreground">{stats?.totalRooms || 0}</span>
                  </div>
                </div>
              </div>

              
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h4 className="font-semibold text-foreground">Hostel Occupancy Breakdown</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Capacity utilisation per hostel</p>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                    {hostels.length} hostel{hostels.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <HostelBarChart hostels={hostels}/>
              </div>

              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h4 className="font-semibold text-foreground">Room Allocation</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-5">Students with and without room assignments</p>
                  <ReportDonut label="students" segments={[
            { value: studentsByAllocation.allocated, color: '#6366f1', label: 'Allocated' },
            { value: studentsByAllocation.notAllocated, color: '#e5e7eb', label: 'Not allocated' },
        ]}/>
                </div>

                
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h4 className="font-semibold text-foreground mb-4">Quick Stats Summary</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2.5 border-b border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4"/>
                        <span className="text-sm">Report Generated</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between py-2.5 border-b border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserCheck className="h-4 w-4"/>
                        <span className="text-sm">Active Porters</span>
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        {stats?.totalPorters || 0}
                      </p>
                    </div>
                    <div className="flex items-center justify-between py-2.5 border-b border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4"/>
                        <span className="text-sm">Payment Success Rate</span>
                      </div>
                      <p className="text-sm font-bold text-emerald-600">
                        {payments.length > 0
            ? `${((payments.filter(p => p.status === 'completed').length / payments.length) * 100).toFixed(1)}%`
            : '0%'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4"/>
                        <span className="text-sm">Total Hostels</span>
                      </div>
                      <p className="text-sm font-bold text-foreground">{stats?.totalHostels || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}
