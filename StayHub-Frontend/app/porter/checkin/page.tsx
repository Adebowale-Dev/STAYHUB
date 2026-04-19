'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { porterAPI } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { UserCheck, Search, CheckCircle2, Clock, AlertTriangle, Building2, DoorOpen, Mail, Phone, User, Calendar, Users } from 'lucide-react';
interface PendingStudent {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    phoneNumber?: string;
    matricNumber?: string;
    matricNo?: string;
    reservation?: {
        _id: string;
        status: string;
        room?: {
            _id: string;
            roomNumber: string;
            block?: string;
            floor?: number;
        };
        bunk?: {
            _id: string;
            bunkNumber: number;
            position: string;
        };
        hostel?: {
            _id: string;
            name: string;
        };
        reservedAt?: string;
        checkedInAt?: string;
    };
    roomAssignment?: {
        room: {
            _id: string;
            roomNumber: string;
            block?: string;
        };
        bunkNumber?: number;
    };
    checkInStatus?: 'checked-in' | 'checked_in' | 'pending' | 'not-checked-in' | 'active' | 'confirmed' | 'checkedIn';
    status?: string;
    department?: {
        name: string;
    } | string;
    level?: string | number;
    reservationDate?: string;
    checkInDate?: string;
}
export default function PorterCheckInPage() {
    const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
    const [allStudents, setAllStudents] = useState<PendingStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [checkingIn, setCheckingIn] = useState<string | null>(null);
    const [releasingExpired, setReleasingExpired] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [bulkCheckingIn, setBulkCheckingIn] = useState(false);
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const profile = await porterAPI.getDashboard();
                console.log('Porter profile:', profile.data);
            }
            catch (error) {
                console.error('Failed to get profile:', error);
            }
        };
        checkAuth();
        loadPendingStudents();
    }, []);
    const loadPendingStudents = async () => {
        setLoading(true);
        try {
            const response = await porterAPI.getStudents();
            console.log('Check-in API response:', response.data);
            const studentsData = response.data.data || response.data || [];
            console.log('All students:', studentsData);
            console.log('Total students count:', studentsData.length);
            if (studentsData.length > 0) {
                console.log('First student structure:', studentsData[0]);
                console.log('assignedRoom:', studentsData[0].assignedRoom);
                console.log('assignedBunk:', studentsData[0].assignedBunk);
                console.log('reservationStatus:', studentsData[0].reservationStatus);
            }
            const mappedStudents = studentsData.map((student: any) => {
                let roomAssignment = null;
                if (student.assignedRoom) {
                    roomAssignment = {
                        room: {
                            _id: typeof student.assignedRoom === 'object' ? student.assignedRoom._id : student.assignedRoom,
                            roomNumber: typeof student.assignedRoom === 'object' ? student.assignedRoom.roomNumber : 'N/A',
                            block: typeof student.assignedRoom === 'object' ? student.assignedRoom.block : undefined,
                            floor: typeof student.assignedRoom === 'object' ? student.assignedRoom.floor : undefined
                        },
                        bunkNumber: typeof student.assignedBunk === 'object' ? student.assignedBunk.bunkNumber : student.assignedBunk
                    };
                }
                else if (student.roomAssignment) {
                    roomAssignment = student.roomAssignment;
                }
                else if (student.reservation) {
                    roomAssignment = {
                        room: {
                            _id: student.reservation.room?._id || student.reservation.room,
                            roomNumber: student.reservation.room?.roomNumber || 'N/A',
                            block: student.reservation.room?.block,
                            floor: student.reservation.room?.floor
                        },
                        bunkNumber: student.reservation.bunk?.bunkNumber
                    };
                }
                const checkInStatus = student.checkInStatus ||
                    student.reservationStatus ||
                    student.reservation?.status ||
                    student.status ||
                    (student.assignedRoom ? 'confirmed' : 'not-checked-in');
                return {
                    _id: student._id,
                    name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
                    firstName: student.firstName,
                    lastName: student.lastName,
                    email: student.email,
                    phone: student.phone || student.phoneNumber,
                    matricNumber: student.matricNumber || student.matricNo,
                    reservation: student.reservation,
                    roomAssignment,
                    checkInStatus,
                    status: student.status,
                    department: student.department?.name || student.department,
                    level: student.level,
                    reservationDate: student.reservationDate || student.reservation?.reservedAt,
                    checkInDate: student.checkInDate || student.reservation?.checkedInAt
                };
            });
            console.log('Mapped students:', mappedStudents);
            setAllStudents(mappedStudents);
            const pending = mappedStudents.filter((s: PendingStudent) => {
                const hasAssignment = s.roomAssignment !== null;
                const isCheckedIn = s.checkInStatus === 'checked-in' ||
                    s.checkInStatus === 'checked_in' ||
                    s.checkInStatus === 'active' ||
                    s.checkInStatus === 'checkedIn' ||
                    s.status === 'checked-in' ||
                    s.status === 'checked_in' ||
                    s.status === 'active';
                const isNotCheckedIn = !isCheckedIn;
                console.log(`Student ${s.name}:`, {
                    hasAssignment,
                    checkInStatus: s.checkInStatus,
                    status: s.status,
                    isCheckedIn,
                    isNotCheckedIn,
                    willShow: hasAssignment && isNotCheckedIn
                });
                return hasAssignment && isNotCheckedIn;
            });
            console.log('Filtered pending students:', pending);
            console.log('Pending count:', pending.length);
            setPendingStudents(pending);
        }
        catch (error: unknown) {
            console.error('Failed to load pending students:', error);
            const axiosError = error as {
                response?: {
                    status?: number;
                    data?: {
                        message?: string;
                        firstLogin?: boolean;
                    };
                };
            };
            console.error('Error status:', axiosError.response?.status);
            console.error('Error data:', axiosError.response?.data);
            if (axiosError.response?.data?.firstLogin) {
                alert('You must change your password before accessing this page. Redirecting to settings...');
                window.location.href = '/porter/settings';
                return;
            }
            if (axiosError.response?.status === 403) {
                const errorMessage = axiosError.response?.data?.message || 'Access denied: Your porter account does not have a hostel assigned yet. Please contact the administrator to assign a hostel to your account.';
                alert(errorMessage);
            }
            else {
                const errorMessage = axiosError.response?.data?.message || 'Failed to load students. Please try again.';
                alert(errorMessage);
            }
        }
        finally {
            setLoading(false);
        }
    };
    const handleCheckIn = async (studentId: string) => {
        setCheckingIn(studentId);
        try {
            console.log('Checking in student:', studentId);
            const response = await porterAPI.checkInStudent(studentId);
            console.log('Check-in response:', response.data);
            alert('Student checked in successfully!');
            await loadPendingStudents();
        }
        catch (error) {
            console.error('Failed to check in student:', error);
            const axiosError = error as {
                response?: {
                    status?: number;
                    data?: {
                        message?: string;
                    };
                };
            };
            const errorMessage = axiosError.response?.data?.message || 'Failed to check in student. Please try again.';
            alert(errorMessage);
        }
        finally {
            setCheckingIn(null);
        }
    };
    const handleReleaseExpired = async () => {
        if (!confirm('Are you sure you want to release all expired reservations? This action cannot be undone.')) {
            return;
        }
        setReleasingExpired(true);
        try {
            await porterAPI.releaseExpired();
            alert('Expired reservations released successfully!');
            loadPendingStudents();
        }
        catch (error) {
            console.error('Failed to release expired reservations:', error);
            alert('Failed to release expired reservations. Please try again.');
        }
        finally {
            setReleasingExpired(false);
        }
    };
    const handleSelectStudent = (studentId: string, checked: boolean) => {
        const newSelected = new Set(selectedStudents);
        if (checked) {
            newSelected.add(studentId);
        }
        else {
            newSelected.delete(studentId);
        }
        setSelectedStudents(newSelected);
    };
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = new Set(filteredStudents.map(s => s._id));
            setSelectedStudents(allIds);
        }
        else {
            setSelectedStudents(new Set());
        }
    };
    const handleBulkCheckIn = async () => {
        if (selectedStudents.size === 0) {
            alert('Please select at least one student to check in.');
            return;
        }
        if (!confirm(`Are you sure you want to check in ${selectedStudents.size} student(s)?`)) {
            return;
        }
        setBulkCheckingIn(true);
        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];
        try {
            const checkInPromises = Array.from(selectedStudents).map(async (studentId) => {
                try {
                    await porterAPI.checkInStudent(studentId);
                    successCount++;
                }
                catch (error) {
                    failCount++;
                    const student = pendingStudents.find(s => s._id === studentId);
                    errors.push(student?.name || studentId);
                    console.error(`Failed to check in ${studentId}:`, error);
                }
            });
            await Promise.all(checkInPromises);
            if (failCount === 0) {
                alert(`✅ Successfully checked in ${successCount} student(s)!`);
            }
            else {
                alert(`✅ Checked in ${successCount} student(s)\n❌ Failed: ${failCount} student(s)\n\nFailed students: ${errors.join(', ')}`);
            }
            setSelectedStudents(new Set());
            await loadPendingStudents();
        }
        catch (error) {
            console.error('Bulk check-in error:', error);
            alert('An error occurred during bulk check-in. Please try again.');
        }
        finally {
            setBulkCheckingIn(false);
        }
    };
    const filteredStudents = pendingStudents.filter((student) => {
        const matchesSearch = (student.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (student.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (student.matricNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        return matchesSearch;
    });
    const allFilteredSelected = filteredStudents.length > 0 &&
        filteredStudents.every(s => selectedStudents.has(s._id));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysCheckIns = allStudents.filter(student => {
        if (!student.checkInDate)
            return false;
        const checkInDate = new Date(student.checkInDate);
        checkInDate.setHours(0, 0, 0, 0);
        return checkInDate.getTime() === today.getTime() &&
            (student.checkInStatus === 'checked_in' || student.checkInStatus === 'checked-in');
    }).length;
    const totalCheckedIn = allStudents.filter(student => student.checkInStatus === 'checked_in' || student.checkInStatus === 'checked-in').length;
    if (loading) {
        return (<ProtectedRoute allowedRoles={['porter']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading pending check-ins...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>);
    }
    return (<ProtectedRoute allowedRoles={['porter']}>
      <DashboardLayout>
        <div className="space-y-6">
          
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Student Check-In
              </h2>
              <p className="text-muted-foreground mt-1">
                Process pending student check-ins for your hostel
              </p>
            </div>
            <Button variant="outline" onClick={handleReleaseExpired} disabled={releasingExpired} className="gap-2">
              <AlertTriangle className="h-4 w-4"/>
              {releasingExpired ? 'Releasing...' : 'Release Expired'}
            </Button>
          </div>

          
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Pending Check-Ins</CardDescription>
                <CardTitle className="text-3xl">{pendingStudents.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4"/>
                  <span>Awaiting check-in</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Today&apos;s Check-Ins</CardDescription>
                <CardTitle className="text-3xl">{todaysCheckIns}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4"/>
                  <span>Completed today</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Checked In</CardDescription>
                <CardTitle className="text-3xl">{totalCheckedIn}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserCheck className="h-4 w-4"/>
                  <span>All checked-in students</span>
                </div>
              </CardContent>
            </Card>
          </div>

          
          {pendingStudents.length > 0 && (<Alert>
              <AlertTriangle className="h-4 w-4"/>
              <AlertDescription>
                You have {pendingStudents.length} student{pendingStudents.length !== 1 ? 's' : ''} waiting to be checked in. 
                Process their check-ins to allow them access to the hostel.
              </AlertDescription>
            </Alert>)}

          
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="Search by name, email, or matric number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/>
              </div>

              
              {filteredStudents.length > 0 && (<div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox id="select-all" checked={allFilteredSelected} onCheckedChange={handleSelectAll}/>
                      <label htmlFor="select-all" className="text-sm font-medium cursor-pointer select-none">
                        Select All ({filteredStudents.length})
                      </label>
                    </div>
                    
                    {selectedStudents.size > 0 && (<Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3"/>
                        {selectedStudents.size} Selected
                      </Badge>)}
                  </div>

                  {selectedStudents.size > 0 && (<Button onClick={handleBulkCheckIn} disabled={bulkCheckingIn} className="gap-2">
                      <UserCheck className="h-4 w-4"/>
                      {bulkCheckingIn
                    ? `Checking In ${selectedStudents.size}...`
                    : `Check In ${selectedStudents.size} Student${selectedStudents.size > 1 ? 's' : ''}`}
                    </Button>)}
                </div>)}
            </CardContent>
          </Card>

          
          {filteredStudents.length === 0 ? (<Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4"/>
                  <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                ? 'No students match your search criteria.'
                : 'There are no pending check-ins at the moment.'}
                  </p>
                </div>
              </CardContent>
            </Card>) : (<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStudents.map((student) => (<Card key={student._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox id={`student-${student._id}`} checked={selectedStudents.has(student._id)} onCheckedChange={(checked) => handleSelectStudent(student._id, checked as boolean)} className="mt-1"/>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <User className="h-6 w-6 text-gray-600 dark:text-gray-400"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{student.name}</CardTitle>
                            {student.matricNumber && (<p className="text-xs text-muted-foreground mt-1 truncate">
                                {student.matricNumber}
                              </p>)}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800 flex-shrink-0">
                        <Clock className="h-3 w-3 mr-1"/>
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground"/>
                        <span className="text-muted-foreground truncate">{student.email}</span>
                      </div>
                      {student.phone && (<div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground"/>
                          <span className="text-muted-foreground">{student.phone}</span>
                        </div>)}
                    </div>

                    
                    {student.roomAssignment && (<div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border">
                        <div className="flex items-center gap-2 mb-2">
                          <DoorOpen className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                          <span className="font-medium text-sm">Room Assignment</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p>Room {student.roomAssignment.room.roomNumber}</p>
                          {student.roomAssignment.bunkNumber && (<p className="text-muted-foreground">Bunk {student.roomAssignment.bunkNumber}</p>)}
                          {student.roomAssignment.room.block && (<p className="text-muted-foreground">{student.roomAssignment.room.block}</p>)}
                        </div>
                      </div>)}

                    
                    {student.department && (<div className="space-y-1 text-sm">
                        <p className="font-medium">{typeof student.department === 'object' ? student.department.name : student.department}</p>
                        {student.level && (<p className="text-muted-foreground">{student.level} Level</p>)}
                      </div>)}

                    
                    {student.reservationDate && (<div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5"/>
                        <span>Reserved: {new Date(student.reservationDate).toLocaleDateString()}</span>
                      </div>)}

                    
                    <Button className="w-full gap-2" onClick={() => handleCheckIn(student._id)} disabled={checkingIn === student._id}>
                      <UserCheck className="h-4 w-4"/>
                      {checkingIn === student._id ? 'Checking In...' : 'Check In Student'}
                    </Button>
                  </CardContent>
                </Card>))}
            </div>)}
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}
