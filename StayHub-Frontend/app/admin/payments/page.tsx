'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Search, CheckCircle, Clock, X, TrendingUp } from 'lucide-react';
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
function getMonthlyData(payments: Payment[]) {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return {
            label: d.toLocaleDateString('en-US', { month: 'short' }),
            year: d.getFullYear(),
            month: d.getMonth(),
            completed: 0,
            pending: 0,
            failed: 0,
        };
    });
    payments.forEach((p) => {
        const date = new Date(p.paymentDate || p.createdAt);
        const bucket = months.find((m) => m.year === date.getFullYear() && m.month === date.getMonth());
        if (bucket)
            bucket[p.status]++;
    });
    return months;
}
function PaymentDonut({ completed, pending, failed, }: {
    completed: number;
    pending: number;
    failed: number;
}) {
    const total = completed + pending + failed;
    const r = 52, cx = 65, cy = 65, sw = 20;
    const circ = 2 * Math.PI * r;
    const cl = total > 0 ? (completed / total) * circ : 0;
    const pl = total > 0 ? (pending / total) * circ : 0;
    const fl = total > 0 ? (failed / total) * circ : 0;
    const segments = [
        { len: cl, offset: 0, color: '#10b981' },
        { len: pl, offset: cl, color: '#f59e0b' },
        { len: fl, offset: cl + pl, color: '#f43f5e' },
    ].filter((s) => s.len > 1);
    return (<svg viewBox="0 0 130 130" className="w-[130px] h-[130px] shrink-0">
      
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={sw} stroke="#e5e7eb" className="dark:stroke-zinc-700"/>
      {total > 0 &&
            segments.map((s, i) => (<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={sw} strokeDasharray={`${s.len} ${circ}`} strokeDashoffset={-s.offset} style={{ transformOrigin: `${cx}px ${cy}px`, transform: 'rotate(-90deg)' }}/>))}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="20" fontWeight="700" className="fill-foreground">
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#9ca3af">
        payments
      </text>
    </svg>);
}
type MonthlyItem = ReturnType<typeof getMonthlyData>[number];
function MonthlyBarChart({ data }: {
    data: MonthlyItem[];
}) {
    const maxVal = Math.max(1, ...data.map((d) => d.completed + d.pending + d.failed));
    const W = 400, H = 160;
    const padL = 28, padB = 26, padT = 10, padR = 8;
    const cW = W - padL - padR;
    const cH = H - padT - padB;
    const groupW = cW / 6;
    const barW = 10, gap = 2;
    const totalBarW = 3 * barW + 2 * gap;
    const barOffset = (groupW - totalBarW) / 2;
    const scaleY = (v: number) => cH - (v / maxVal) * cH;
    const barH = (v: number) => Math.max(2, (v / maxVal) * cH);
    const yTicks = [0, Math.ceil(maxVal / 2), maxVal];
    return (<svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      
      {yTicks.map((v, i) => {
            const y = padT + scaleY(v);
            return (<g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e5e7eb" strokeWidth="0.6" className="dark:stroke-zinc-700"/>
            <text x={padL - 5} y={y + 3} textAnchor="end" fontSize="8" fill="#9ca3af">
              {v}
            </text>
          </g>);
        })}

      
      {data.map((d, i) => {
            const gx = padL + i * groupW + barOffset;
            const mx = padL + i * groupW + groupW / 2;
            return (<g key={i}>
            
            <rect x={gx} y={padT + scaleY(d.completed)} width={barW} height={barH(d.completed)} fill="#10b981" rx="2" opacity={d.completed === 0 ? 0.2 : 1}/>
            
            <rect x={gx + barW + gap} y={padT + scaleY(d.pending)} width={barW} height={barH(d.pending)} fill="#f59e0b" rx="2" opacity={d.pending === 0 ? 0.2 : 1}/>
            
            <rect x={gx + 2 * (barW + gap)} y={padT + scaleY(d.failed)} width={barW} height={barH(d.failed)} fill="#f43f5e" rx="2" opacity={d.failed === 0 ? 0.2 : 1}/>
            
            <text x={mx} y={H - padB + 14} textAnchor="middle" fontSize="9" fill="#9ca3af">
              {d.label}
            </text>
          </g>);
        })}
    </svg>);
}
export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState<PaymentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
    const [amountDialogOpen, setAmountDialogOpen] = useState(false);
    const [newAmount, setNewAmount] = useState('');
    const [updatingAmount, setUpdatingAmount] = useState(false);
    const [currentAmount, setCurrentAmount] = useState(0);
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async (retryCount = 0) => {
        try {
            setLoading(true);
            let paymentsData: Payment[] = [];
            try {
                const paymentsResponse = await adminAPI.getPayments();
                paymentsData = paymentsResponse.data.data || paymentsResponse.data || [];
                setPayments(paymentsData);
            }
            catch (paymentError: unknown) {
                console.error('Failed to load payments:', paymentError);
                const err = paymentError as {
                    response?: {
                        status?: number;
                    };
                };
                if (err.response?.status === 429 && retryCount < 3) {
                    await new Promise((r) => setTimeout(r, Math.pow(2, retryCount) * 1000));
                    return loadData(retryCount + 1);
                }
            }
            await new Promise((r) => setTimeout(r, 500));
            try {
                const statsResponse = await adminAPI.getPaymentStats();
                setStats(statsResponse.data.data || statsResponse.data || {});
            }
            catch (statsError: unknown) {
                console.error('Failed to load payment stats:', statsError);
                const err = statsError as {
                    response?: {
                        status?: number;
                    };
                };
                if (err.response?.status === 429 && retryCount < 3) {
                    await new Promise((r) => setTimeout(r, Math.pow(2, retryCount) * 1000));
                    return loadData(retryCount + 1);
                }
            }
            await new Promise((r) => setTimeout(r, 500));
            try {
                const amountResponse = await adminAPI.getPaymentAmount();
                const amount = amountResponse.data.data?.amount || amountResponse.data?.amount;
                if (amount)
                    setCurrentAmount(amount);
            }
            catch {
                if (paymentsData.length > 0)
                    setCurrentAmount(paymentsData[0].amount || 0);
            }
        }
        catch (error) {
            console.error('Failed to load payments data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleUpdateAmount = async () => {
        const amount = parseFloat(newAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        setUpdatingAmount(true);
        try {
            await adminAPI.setPaymentAmount(amount);
            try {
                const verifyResponse = await adminAPI.getPaymentAmount();
                const savedAmount = verifyResponse.data.data?.amount || verifyResponse.data?.amount;
                setCurrentAmount(savedAmount || amount);
            }
            catch {
                setCurrentAmount(amount);
            }
            alert('Payment amount updated successfully!');
            setAmountDialogOpen(false);
            setNewAmount('');
            await loadData();
        }
        catch (err: unknown) {
            const error = err as {
                response?: {
                    data?: {
                        message?: string;
                        error?: string;
                        status?: number;
                    };
                };
                message?: string;
            };
            if (error?.response?.data?.status === 404) {
                alert('⚠️ Payment amount configuration is not yet implemented in the backend.');
            }
            else {
                alert(`Error: ${error?.response?.data?.message || error?.message || 'Failed to update payment amount.'}`);
            }
        }
        finally {
            setUpdatingAmount(false);
        }
    };
    const filteredPayments = payments.filter((payment) => {
        const matchesSearch = (payment.student?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (payment.student?.matricNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (payment.student?.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (payment.reference?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const displayStats = {
        totalRevenue: stats?.totalRevenue || payments.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount, 0),
        totalPaid: stats?.totalPaid || payments.filter((p) => p.status === 'completed').length,
        totalPending: stats?.totalPending || payments.filter((p) => p.status === 'pending').length,
        totalFailed: stats?.totalFailed || payments.filter((p) => p.status === 'failed').length,
    };
    const monthlyData = getMonthlyData(payments);
    const totalPayments = displayStats.totalPaid + displayStats.totalPending + displayStats.totalFailed;
    const successRate = totalPayments > 0 ? Math.round((displayStats.totalPaid / totalPayments) * 100) : 0;
    if (loading) {
        return (<ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <div className="h-10 w-10 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin"/>
              <p className="text-sm text-muted-foreground">Loading payments…</p>
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
              <h1 className="text-2xl font-bold text-foreground">Payment Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track student payments and manage payment settings
              </p>
            </div>
            <Button onClick={() => setAmountDialogOpen(true)} className="gap-2">
              <CreditCard className="h-4 w-4"/>
              Set Payment Amount
            </Button>
          </div>

          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Revenue</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">₦{displayStats.totalRevenue.toLocaleString()}</p>
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Completed</p>
                  <p className="mt-2 text-2xl font-bold text-sky-600">{displayStats.totalPaid}</p>
                  <p className="text-xs text-muted-foreground mt-1">Successfully paid</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-900/30">
                  <CheckCircle className="h-6 w-6 text-sky-600"/>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending</p>
                  <p className="mt-2 text-2xl font-bold text-amber-600">{displayStats.totalPending}</p>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="h-6 w-6 text-amber-600"/>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Failed</p>
                  <p className="mt-2 text-2xl font-bold text-rose-600">{displayStats.totalFailed}</p>
                  <p className="text-xs text-muted-foreground mt-1">Payment failed</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30">
                  <X className="h-6 w-6 text-rose-500"/>
                </div>
              </div>
            </div>
          </div>

          
          <div className="grid gap-4 lg:grid-cols-2">

            
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold text-foreground">Payment Status</h2>
              <p className="text-xs text-muted-foreground mt-0.5 mb-5">Overall distribution by status</p>

              <div className="flex items-center gap-8">
                <PaymentDonut completed={displayStats.totalPaid} pending={displayStats.totalPending} failed={displayStats.totalFailed}/>

                <div className="flex-1 space-y-3">
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0"/>
                        <span className="text-muted-foreground">Completed</span>
                      </div>
                      <span className="font-bold text-foreground">{displayStats.totalPaid}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: totalPayments > 0 ? `${(displayStats.totalPaid / totalPayments) * 100}%` : '0%' }}/>
                    </div>
                  </div>

                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0"/>
                        <span className="text-muted-foreground">Pending</span>
                      </div>
                      <span className="font-bold text-foreground">{displayStats.totalPending}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: totalPayments > 0 ? `${(displayStats.totalPending / totalPayments) * 100}%` : '0%' }}/>
                    </div>
                  </div>

                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0"/>
                        <span className="text-muted-foreground">Failed</span>
                      </div>
                      <span className="font-bold text-foreground">{displayStats.totalFailed}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-rose-500" style={{ width: totalPayments > 0 ? `${(displayStats.totalFailed / totalPayments) * 100}%` : '0%' }}/>
                    </div>
                  </div>

                  
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">Success rate</p>
                    <p className="text-2xl font-bold text-emerald-600">{successRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-foreground">Monthly Trend</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Payment activity over last 6 months</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-emerald-500"/> Done
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-amber-500"/> Pending
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-rose-500"/> Failed
                  </span>
                </div>
              </div>

              <div className="w-full aspect-[5/2]">
                <MonthlyBarChart data={monthlyData}/>
              </div>
            </div>
          </div>

          
          {currentAmount > 0 && (<div className="rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Accommodation Fee</p>
                <p className="text-2xl font-bold text-primary mt-0.5">₦{currentAmount.toLocaleString()}</p>
              </div>
              <Button variant="outline" onClick={() => setAmountDialogOpen(true)} className="gap-2 border-primary/30 hover:bg-primary/10">
                <CreditCard className="h-4 w-4"/>
                Update Amount
              </Button>
            </div>)}

          
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="Search by name, matric number, email, or reference..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl"/>
              </div>
              <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
                  <SelectValue placeholder="Filter by status"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-foreground">Payment Records</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            {filteredPayments.length === 0 ? (<div className="text-center py-16">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <CreditCard className="h-7 w-7 text-muted-foreground"/>
                </div>
                <p className="font-semibold text-muted-foreground">No payments found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filters</p>
              </div>) : (<Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-10 text-xs">#</TableHead>
                    <TableHead className="text-xs">Student</TableHead>
                    <TableHead className="text-xs">Matric Number</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Reference</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment, index) => (<TableRow key={payment._id} className="hover:bg-muted/20">
                      <TableCell className="text-muted-foreground text-sm">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{payment.student?.name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{payment.student?.email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{payment.student?.matricNumber || 'N/A'}</TableCell>
                      <TableCell className="font-bold text-sm">₦{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        {payment.reference ? (<code className="text-xs bg-muted px-2 py-1 rounded-lg">{payment.reference}</code>) : (<span className="text-muted-foreground text-sm">—</span>)}
                      </TableCell>
                      <TableCell>
                        {payment.status === 'pending' && (<Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 gap-1 text-xs">
                            <Clock className="h-3 w-3"/> Pending
                          </Badge>)}
                        {payment.status === 'completed' && (<Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1 text-xs">
                            <CheckCircle className="h-3 w-3"/> Completed
                          </Badge>)}
                        {payment.status === 'failed' && (<Badge variant="outline" className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 gap-1 text-xs">
                            <X className="h-3 w-3"/> Failed
                          </Badge>)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.paymentDate
                    ? new Date(payment.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : new Date(payment.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>)}
          </div>
        </div>

        
        <Dialog open={amountDialogOpen} onOpenChange={setAmountDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Set Payment Amount</DialogTitle>
              <DialogDescription>
                Update the hostel accommodation fee for students
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {currentAmount > 0 && (<div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <p className="text-xs font-medium text-muted-foreground">Current Amount</p>
                  <p className="text-2xl font-bold text-primary mt-1">₦{currentAmount.toLocaleString()}</p>
                </div>)}
              <div className="space-y-2">
                <label className="text-sm font-medium">New Payment Amount (₦)</label>
                <Input type="number" placeholder="Enter amount (e.g., 50000)" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} min="0" step="1000" className="rounded-xl"/>
                <p className="text-xs text-muted-foreground">
                  This amount will automatically update for all students who haven&apos;t paid yet
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAmountDialogOpen(false)} className="flex-1 rounded-xl" disabled={updatingAmount}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAmount} className="flex-1 rounded-xl" disabled={!newAmount || updatingAmount}>
                {updatingAmount ? 'Updating…' : 'Update Amount'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>);
}
