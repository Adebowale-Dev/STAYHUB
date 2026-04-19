'use client';
import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminAPI } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { BellRing, Building2, GraduationCap, History, Home, Mail, Megaphone, Search, Send, Smartphone, User, Users, } from 'lucide-react';
interface CollegeOption {
    _id: string;
    name: string;
    code?: string;
}
interface HostelOption {
    _id: string;
    name: string;
    code?: string;
}
interface StudentSearchResult {
    _id: string;
    firstName: string;
    lastName: string;
    matricNo: string;
    email: string;
    level?: number;
    college?: {
        _id: string;
        name: string;
        code?: string;
    };
}
interface NotificationHistoryItem {
    _id: string;
    mode: 'test' | 'broadcast';
    title: string;
    message: string;
    type: 'warning' | 'info' | 'error' | 'success';
    destination?: string;
    forceEmail?: boolean;
    status: 'completed' | 'partial' | 'failed';
    stats?: {
        recipients?: number;
        inboxSaved?: number;
        pushAttempted?: number;
        pushDelivered?: number;
        emailSent?: number;
    };
    target?: {
        scope?: 'student' | 'hostel' | 'college' | 'department' | 'level' | 'all';
        label?: string;
        level?: number | null;
    };
    createdBy?: {
        _id: string;
        name: string;
        email?: string;
    } | null;
    recipientSample?: Array<{
        student?: string;
        name?: string;
        matricNo?: string;
        email?: string;
        inboxSaved?: boolean;
        pushAttempted?: boolean;
        pushDelivered?: boolean;
        emailSent?: boolean;
    }>;
    createdAt: string;
}
const TYPE_STYLES: Record<NotificationHistoryItem['type'], {
    badge: string;
    label: string;
}> = {
    info: {
        badge: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
        label: 'Info',
    },
    success: {
        badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        label: 'Success',
    },
    warning: {
        badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        label: 'Warning',
    },
    error: {
        badge: 'bg-red-500/10 text-red-600 border-red-500/20',
        label: 'Error',
    },
};
const DESTINATION_OPTIONS = [
    { value: '/student/notifications', label: 'Notification Center' },
    { value: '/student/reservation', label: 'Reservation Page' },
    { value: '/student/payment', label: 'Payment Page' },
    { value: '/student/profile', label: 'Profile Page' },
    { value: '/student/hostels', label: 'Hostels Page' },
];
const LEVEL_OPTIONS = ['100', '200', '300', '400', '500'];
const normalizeList = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) {
        return value as T[];
    }
    if (value && typeof value === 'object') {
        const objectValue = value as Record<string, unknown>;
        if (Array.isArray(objectValue.data)) {
            return objectValue.data as T[];
        }
        if (Array.isArray(objectValue.hostels)) {
            return objectValue.hostels as T[];
        }
        if (Array.isArray(objectValue.colleges)) {
            return objectValue.colleges as T[];
        }
    }
    return [];
};
class AdminNotificationsErrorBoundary extends React.Component<{
    children: React.ReactNode;
}, {
    hasError: boolean;
}> {
    constructor(props: {
        children: React.ReactNode;
    }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error: Error) {
        console.error('Admin notifications page crashed:', error);
    }
    render() {
        if (this.state.hasError) {
            return (<DashboardLayout>
          <div className="flex min-h-[60vh] items-center justify-center px-4">
            <div className="max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
              <h1 className="text-xl font-semibold text-foreground">
                Admin Notifications
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This page hit a client-side error. Refresh the page once, and if it
                still happens the new fallback is active so the rest of the admin
                app stays usable.
              </p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </div>
        </DashboardLayout>);
        }
        return this.props.children;
    }
}
function AdminNotificationsPageContent() {
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchingStudents, setSearchingStudents] = useState(false);
    const [notificationApiMessage, setNotificationApiMessage] = useState<string | null>(null);
    const [mode, setMode] = useState<'test' | 'broadcast'>('test');
    const [historyFilter, setHistoryFilter] = useState<'all' | 'test' | 'broadcast'>('all');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<NotificationHistoryItem['type']>('info');
    const [destination, setDestination] = useState('/student/notifications');
    const [forceEmail, setForceEmail] = useState(false);
    const [broadcastScope, setBroadcastScope] = useState<'all' | 'hostel' | 'college' | 'level'>('all');
    const [selectedHostelId, setSelectedHostelId] = useState('all');
    const [selectedCollegeId, setSelectedCollegeId] = useState('all');
    const [selectedLevel, setSelectedLevel] = useState('100');
    const [studentSearch, setStudentSearch] = useState('');
    const [studentResults, setStudentResults] = useState<StudentSearchResult[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
    const [colleges, setColleges] = useState<CollegeOption[]>([]);
    const [hostels, setHostels] = useState<HostelOption[]>([]);
    const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
    useEffect(() => {
        loadPageData();
    }, []);
    useEffect(() => {
        loadHistory(historyFilter);
    }, [historyFilter]);
    useEffect(() => {
        if (mode !== 'test') {
            return;
        }
        if (selectedStudent && studentSearch.trim() === '') {
            setStudentResults([]);
            return;
        }
        const query = studentSearch.trim();
        if (query.length < 2) {
            setStudentResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                setSearchingStudents(true);
                const response = await adminAPI.search({
                    query,
                    type: 'students',
                    limit: 8,
                });
                const results = response.data?.results?.students || response.data?.data?.students || [];
                setStudentResults(Array.isArray(results) ? results : []);
            }
            catch (error) {
                console.error('Failed to search students:', error);
                setStudentResults([]);
            }
            finally {
                setSearchingStudents(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [mode, selectedStudent, studentSearch]);
    const loadPageData = async () => {
        try {
            setLoading(true);
            const [hostelsResponse, collegesResponse] = await Promise.all([
                adminAPI.getHostels(),
                adminAPI.getColleges(),
            ]);
            setHostels(normalizeList<HostelOption>(hostelsResponse.data?.data || hostelsResponse.data));
            setColleges(normalizeList<CollegeOption>(collegesResponse.data?.data || collegesResponse.data));
        }
        catch (error) {
            console.error('Failed to load admin notification page:', error);
            toast.error('Failed to load notification tools');
        }
        finally {
            setLoading(false);
        }
    };
    const loadHistory = async (filter: 'all' | 'test' | 'broadcast') => {
        try {
            const params = filter === 'all' ? { limit: 25 } : { mode: filter, limit: 25 };
            const response = await adminAPI.getNotificationHistory(params);
            setNotificationApiMessage(null);
            setHistory(normalizeList<NotificationHistoryItem>(response.data?.data || response.data));
        }
        catch (error) {
            const maybeError = error as {
                response?: {
                    status?: number;
                    data?: {
                        message?: string;
                    };
                };
            };
            const status = maybeError.response?.status;
            if (status === 404) {
                setHistory([]);
                setNotificationApiMessage('Notification history is not available from the backend process currently running on port 5000. Restart the backend server so the new admin notification routes are loaded.');
                return;
            }
            console.error('Failed to load notification history:', error);
            setNotificationApiMessage(maybeError.response?.data?.message || 'Failed to refresh notification history.');
            toast.error('Failed to refresh notification history');
        }
    };
    const resetAudienceState = () => {
        setBroadcastScope('all');
        setSelectedHostelId('all');
        setSelectedCollegeId('all');
        setSelectedLevel('100');
        setStudentSearch('');
        setStudentResults([]);
        setSelectedStudent(null);
    };
    const resetComposer = () => {
        setTitle('');
        setMessage('');
        setType('info');
        setDestination('/student/notifications');
        setForceEmail(false);
        resetAudienceState();
        setMode('test');
    };
    const handleModeChange = (nextMode: string) => {
        setMode(nextMode === 'broadcast' ? 'broadcast' : 'test');
        resetAudienceState();
    };
    const handleSend = async () => {
        const trimmedTitle = title.trim();
        const trimmedMessage = message.trim();
        if (!trimmedTitle || !trimmedMessage) {
            toast.error('Title and message are required');
            return;
        }
        if (mode === 'test' && !selectedStudent?._id) {
            toast.error('Select a student for the test notification');
            return;
        }
        if (mode === 'broadcast' && broadcastScope === 'hostel' && selectedHostelId === 'all') {
            toast.error('Choose a hostel for this broadcast');
            return;
        }
        if (mode === 'broadcast' && broadcastScope === 'college' && selectedCollegeId === 'all') {
            toast.error('Choose a college for this broadcast');
            return;
        }
        setSending(true);
        try {
            if (mode === 'test') {
                await adminAPI.sendTestNotification({
                    studentId: selectedStudent?._id,
                    title: trimmedTitle,
                    message: trimmedMessage,
                    type,
                    destination,
                    forceEmail,
                });
                toast.success('Test notification sent');
            }
            else {
                await adminAPI.sendBroadcastNotification({
                    scope: broadcastScope,
                    hostelId: broadcastScope === 'hostel' ? selectedHostelId : undefined,
                    collegeId: broadcastScope === 'college' ? selectedCollegeId : undefined,
                    level: broadcastScope === 'level' ? Number(selectedLevel) : undefined,
                    title: trimmedTitle,
                    message: trimmedMessage,
                    type,
                    destination,
                    forceEmail,
                });
                toast.success('Broadcast notification sent');
            }
            setNotificationApiMessage(null);
            await loadHistory(historyFilter);
            resetComposer();
        }
        catch (error: unknown) {
            console.error('Failed to send notification:', error);
            const maybeError = error as {
                response?: {
                    data?: {
                        message?: string;
                    };
                };
            };
            toast.error(maybeError.response?.data?.message || 'Failed to send notification');
        }
        finally {
            setSending(false);
        }
    };
    const totalCampaigns = history.length;
    const totalRecipients = history.reduce((sum, item) => sum + (item.stats?.recipients || 0), 0);
    const totalPushDelivered = history.reduce((sum, item) => sum + (item.stats?.pushDelivered || 0), 0);
    const totalEmailsSent = history.reduce((sum, item) => sum + (item.stats?.emailSent || 0), 0);
    const formatDateTime = (value?: string) => {
        if (!value) {
            return 'Just now';
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return 'Just now';
        }
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };
    const getStatusBadgeClass = (status: NotificationHistoryItem['status']) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'partial':
                return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            default:
                return 'bg-red-500/10 text-red-600 border-red-500/20';
        }
    };
    return (<DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Admin Notifications</h1>
                <p className="text-sm text-muted-foreground">
                  Send test pushes, broadcast urgent hostel updates, and track delivery history.
                </p>
              </div>
              <Badge variant="outline" className="gap-1">
                <BellRing className="h-3.5 w-3.5"/>
                Student inbox + push + email
              </Badge>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
          {notificationApiMessage && (<div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
              {notificationApiMessage}
            </div>)}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="shadow-none">
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="rounded-xl bg-primary/10 p-3">
                  <Megaphone className="h-5 w-5 text-primary"/>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{totalCampaigns}</p>
                  <p className="text-sm text-muted-foreground">Recent campaigns</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="rounded-xl bg-sky-500/10 p-3">
                  <Users className="h-5 w-5 text-sky-600"/>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{totalRecipients}</p>
                  <p className="text-sm text-muted-foreground">Recipients reached</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="rounded-xl bg-emerald-500/10 p-3">
                  <Smartphone className="h-5 w-5 text-emerald-600"/>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{totalPushDelivered}</p>
                  <p className="text-sm text-muted-foreground">Push deliveries</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="rounded-xl bg-amber-500/10 p-3">
                  <Mail className="h-5 w-5 text-amber-600"/>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{totalEmailsSent}</p>
                  <p className="text-sm text-muted-foreground">Email fallbacks</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Compose Campaign</CardTitle>
                <CardDescription>
                  Use test mode for one student, or broadcast to a defined audience.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={mode} onValueChange={handleModeChange}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="test">Test</TabsTrigger>
                    <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
                  </TabsList>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Title</label>
                      <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Hostel inspection notice"/>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Message Type</label>
                      <Select value={type} onValueChange={(value) => setType(value as NotificationHistoryItem['type'])}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose type"/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Message</label>
                    <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write the update students should see in app, push, and fallback email." className="min-h-32"/>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Destination</label>
                      <Select value={destination} onValueChange={setDestination}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose page"/>
                        </SelectTrigger>
                        <SelectContent>
                          {DESTINATION_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                        <Checkbox checked={forceEmail} onCheckedChange={(checked) => setForceEmail(Boolean(checked))}/>
                        <span>Force email fallback even when push works</span>
                      </label>
                    </div>
                  </div>

                  <TabsContent value="test" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Find Student
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                        <Input value={selectedStudent
            ? `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.matricNo})`
            : studentSearch} onChange={(event) => {
            setSelectedStudent(null);
            setStudentSearch(event.target.value);
        }} placeholder="Search by name, matric number, or email" className="pl-9"/>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This is best for testing one student device and email flow end to end.
                      </p>
                    </div>

                    {searchingStudents && (<div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                        Searching students...
                      </div>)}

                    {!searchingStudents && !selectedStudent && studentResults.length > 0 && (<div className="space-y-2 rounded-xl border p-2">
                        {studentResults.map((student) => (<button type="button" key={student._id} onClick={() => {
                    setSelectedStudent(student);
                    setStudentSearch('');
                    setStudentResults([]);
                }} className="flex w-full items-start justify-between rounded-lg px-3 py-2 text-left transition hover:bg-muted">
                            <div>
                              <p className="font-medium text-foreground">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {student.matricNo} - {student.email}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {student.level ? `${student.level}L` : 'Student'}
                            </Badge>
                          </button>))}
                      </div>)}

                    {selectedStudent && (<div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {selectedStudent.firstName} {selectedStudent.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedStudent.matricNo} - {selectedStudent.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedStudent.college?.name || 'Student'}
                            {selectedStudent.level
                ? ` - ${selectedStudent.level} level`
                : ''}
                          </p>
                        </div>
                        <Button type="button" variant="outline" onClick={() => {
                setSelectedStudent(null);
                setStudentSearch('');
            }}>
                          Change Student
                        </Button>
                      </div>)}
                  </TabsContent>

                  <TabsContent value="broadcast" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Audience Scope</label>
                        <Select value={broadcastScope} onValueChange={(value) => setBroadcastScope(value as 'all' | 'hostel' | 'college' | 'level')}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose audience"/>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All active students</SelectItem>
                            <SelectItem value="hostel">Specific hostel</SelectItem>
                            <SelectItem value="college">Specific college</SelectItem>
                            <SelectItem value="level">Specific level</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {broadcastScope === 'hostel' && (<div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Hostel</label>
                          <Select value={selectedHostelId} onValueChange={setSelectedHostelId}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose hostel"/>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Choose hostel</SelectItem>
                              {hostels.map((hostel) => (<SelectItem key={hostel._id} value={hostel._id}>
                                  {hostel.name} {hostel.code ? `(${hostel.code})` : ''}
                                </SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>)}

                      {broadcastScope === 'college' && (<div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">College</label>
                          <Select value={selectedCollegeId} onValueChange={setSelectedCollegeId}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose college"/>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Choose college</SelectItem>
                              {colleges.map((college) => (<SelectItem key={college._id} value={college._id}>
                                  {college.name} {college.code ? `(${college.code})` : ''}
                                </SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>)}

                      {broadcastScope === 'level' && (<div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Level</label>
                          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose level"/>
                            </SelectTrigger>
                            <SelectContent>
                              {LEVEL_OPTIONS.map((level) => (<SelectItem key={level} value={level}>
                                  {level} Level
                                </SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>)}
                    </div>

                    <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                      Broadcast mode is best for inspection notices, payment reminders, hostel policy updates, and urgent invitation deadlines.
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Students see these messages in-app first, then push and email follow based on their preferences.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={resetComposer} disabled={sending}>
                      Clear
                    </Button>
                    <Button onClick={handleSend} disabled={sending || loading || Boolean(notificationApiMessage)}>
                      <Send className="mr-2 h-4 w-4"/>
                      {sending ? 'Sending...' : mode === 'test' ? 'Send Test' : 'Send Broadcast'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Targeting Guide</CardTitle>
                  <CardDescription>Choose the smallest audience that solves the problem.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3 rounded-xl border p-3">
                    <User className="mt-0.5 h-4 w-4 text-primary"/>
                    <div>
                      <p className="font-medium text-foreground">Test one student</p>
                      <p>Validate device tokens, inbox delivery, and email fallback before broadcasting.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border p-3">
                    <Home className="mt-0.5 h-4 w-4 text-primary"/>
                    <div>
                      <p className="font-medium text-foreground">Hostel alerts</p>
                      <p>Use for maintenance, inspections, porter instructions, or bed-space deadlines.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border p-3">
                    <Building2 className="mt-0.5 h-4 w-4 text-primary"/>
                    <div>
                      <p className="font-medium text-foreground">College messages</p>
                      <p>Ideal for admin updates that only affect one academic unit.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border p-3">
                    <GraduationCap className="mt-0.5 h-4 w-4 text-primary"/>
                    <div>
                      <p className="font-medium text-foreground">Level reminders</p>
                      <p>Keep payment or allocation reminders relevant for a specific year group.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Delivery Channels</CardTitle>
                  <CardDescription>How each campaign reaches students.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3 rounded-xl border p-3">
                    <BellRing className="h-4 w-4 text-primary"/>
                    <div>
                      <p className="font-medium text-foreground">In-app inbox</p>
                      <p>Always saved to the student notification center.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border p-3">
                    <Smartphone className="h-4 w-4 text-emerald-600"/>
                    <div>
                      <p className="font-medium text-foreground">Push notification</p>
                      <p>Sent when the student has a registered Expo device token.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border p-3">
                    <Mail className="h-4 w-4 text-amber-600"/>
                    <div>
                      <p className="font-medium text-foreground">Email fallback</p>
                      <p>Use forced email for urgent updates or testing mailbox delivery.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="shadow-none">
            <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Campaign History</CardTitle>
                <CardDescription>
                  Review what was sent, who it targeted, and how delivery performed.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={historyFilter} onValueChange={(value) => setHistoryFilter(value as 'all' | 'test' | 'broadcast')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter history"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All campaigns</SelectItem>
                    <SelectItem value="test">Test only</SelectItem>
                    <SelectItem value="broadcast">Broadcast only</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => loadHistory(historyFilter)}>
                  <History className="mr-2 h-4 w-4"/>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (<div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Loading notification tools...
                </div>) : history.length === 0 ? (<div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No notification campaigns yet.
                </div>) : (<Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (<TableRow key={item._id}>
                        <TableCell className="align-top">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-foreground">{item.title}</p>
                              <Badge variant="outline">{item.mode}</Badge>
                              <Badge variant="outline" className={TYPE_STYLES[item.type]?.badge}>
                                {TYPE_STYLES[item.type]?.label || item.type}
                              </Badge>
                            </div>
                            <p className="max-w-xl whitespace-normal text-sm text-muted-foreground">
                              {item.message}
                            </p>
                            {item.createdBy?.name && (<p className="text-xs text-muted-foreground">
                                By {item.createdBy.name}
                              </p>)}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-2">
                            <p className="font-medium text-foreground">
                              {item.target?.label || 'All active students'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Destination:{' '}
                              {DESTINATION_OPTIONS.find((option) => option.value === item.destination)?.label || item.destination || 'Notification Center'}
                            </p>
                            {item.recipientSample && item.recipientSample.length > 0 && (<div className="flex flex-wrap gap-1">
                                {item.recipientSample.slice(0, 3).map((recipient, index) => (<Badge key={`${item._id}-recipient-${index}`} variant="secondary">
                                    {recipient.matricNo || recipient.name || 'Student'}
                                  </Badge>))}
                                {item.recipientSample.length > 3 && (<Badge variant="secondary">
                                    +{item.recipientSample.length - 3} more
                                  </Badge>)}
                              </div>)}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>Recipients: {item.stats?.recipients || 0}</p>
                            <p>Inbox saved: {item.stats?.inboxSaved || 0}</p>
                            <p>Push delivered: {item.stats?.pushDelivered || 0}</p>
                            <p>Email sent: {item.stats?.emailSent || 0}</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge variant="outline" className={getStatusBadgeClass(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top text-sm text-muted-foreground">
                          {formatDateTime(item.createdAt)}
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>);
}
export default function AdminNotificationsPage() {
    return (<ProtectedRoute allowedRoles={['admin']}>
      <AdminNotificationsErrorBoundary>
        <AdminNotificationsPageContent />
      </AdminNotificationsErrorBoundary>
    </ProtectedRoute>);
}
