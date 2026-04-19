'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { porterAPI } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Search, UserCheck, Building2, DoorOpen, Mail, Phone, AlertCircle, ArrowLeft, User } from 'lucide-react';
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
    assignedRoom?: any;
    assignedBunk?: any;
    assignedHostel?: any;
    reservation?: {
        _id: string;
        room?: {
            _id: string;
            roomNumber: string;
            block?: string;
        };
        bunk?: {
            bunkNumber: number;
        };
    };
    roomAssignment?: {
        room: {
            _id: string;
            roomNumber: string;
            block?: string;
        };
        bunkNumber?: number;
    };
    checkInStatus?: string;
    reservationStatus?: string;
    status?: string;
    department?: {
        name: string;
    } | string;
    level?: string | number;
}
export default function PendingCheckInsPage() {
    const router = useRouter();
    const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    useEffect(() => {
        loadPendingStudents();
    }, []);
    const loadPendingStudents = async () => {
        setLoading(true);
        try {
            const response = await porterAPI.getStudents();
            console.log('Students API Response:', response.data);
            const studentsData = response.data.data || response.data || [];
            const pending = studentsData.filter((student: any) => {
                const hasAssignment = student.assignedRoom || student.roomAssignment || student.reservation?.room;
                const isNotCheckedIn = !(student.checkInStatus === 'checked-in' ||
                    student.checkInStatus === 'checked_in' ||
                    student.reservationStatus === 'checked_in' ||
                    student.reservationStatus === 'checked-in' ||
                    student.status === 'checked-in' ||
                    student.status === 'checked_in');
                return hasAssignment && isNotCheckedIn;
            });
            console.log('Pending students:', pending);
            setPendingStudents(pending);
        }
        catch (error) {
            console.error('Failed to load pending students:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const getStudentName = (student: PendingStudent) => {
        return student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A';
    };
    const getMatricNumber = (student: PendingStudent) => {
        return student.matricNumber || student.matricNo || 'N/A';
    };
    const getPhoneNumber = (student: PendingStudent) => {
        return student.phone || student.phoneNumber || 'N/A';
    };
    const getRoomInfo = (student: PendingStudent) => {
        if (student.assignedRoom) {
            const roomNumber = typeof student.assignedRoom === 'object'
                ? student.assignedRoom.roomNumber
                : 'N/A';
            const bunkNumber = typeof student.assignedBunk === 'object'
                ? student.assignedBunk.bunkNumber
                : student.assignedBunk;
            return { roomNumber, bunkNumber };
        }
        else if (student.roomAssignment) {
            return {
                roomNumber: student.roomAssignment.room?.roomNumber || 'N/A',
                bunkNumber: student.roomAssignment.bunkNumber
            };
        }
        else if (student.reservation) {
            return {
                roomNumber: student.reservation.room?.roomNumber || 'N/A',
                bunkNumber: student.reservation.bunk?.bunkNumber
            };
        }
        return { roomNumber: 'N/A', bunkNumber: undefined };
    };
    const getDepartment = (student: PendingStudent) => {
        if (typeof student.department === 'object' && student.department?.name) {
            return student.department.name;
        }
        return typeof student.department === 'string' ? student.department : 'N/A';
    };
    const filteredStudents = pendingStudents.filter(student => {
        if (!searchQuery)
            return true;
        const query = searchQuery.toLowerCase();
        const name = getStudentName(student).toLowerCase();
        const matric = getMatricNumber(student).toLowerCase();
        const email = student.email?.toLowerCase() || '';
        const phone = getPhoneNumber(student).toLowerCase();
        const { roomNumber } = getRoomInfo(student);
        const room = roomNumber.toLowerCase();
        return name.includes(query) ||
            matric.includes(query) ||
            email.includes(query) ||
            phone.includes(query) ||
            room.includes(query);
    });
    if (loading) {
        return (<ProtectedRoute allowedRoles={['porter']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading pending check-ins...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>);
    }
    return (<ProtectedRoute allowedRoles={['porter']}>
      <DashboardLayout>
        <div className="space-y-6">
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/porter/dashboard')} className="gap-2">
                <ArrowLeft className="h-4 w-4"/>
                Back
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400"/>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Pending Check-ins
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Students with room assignments awaiting check-in
                </p>
              </div>
            </div>
          </div>

          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400"/>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {pendingStudents.length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Students pending check-in
                    </p>
                  </div>
                </div>
                <Button onClick={() => router.push('/porter/checkin')}>
                  <UserCheck className="h-4 w-4 mr-2"/>
                  Start Check-in
                </Button>
              </div>
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader>
              <CardTitle>Pending Students</CardTitle>
              <CardDescription>
                Search and manage students awaiting check-in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <Input placeholder="Search by name, matric number, email, phone, or room..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/>
                </div>

                
                {pendingStudents.length > 0 && (<div className="flex items-start gap-2 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5"/>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                        Action Required
                      </p>
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        These students have room assignments but haven&apos;t completed check-in. 
                        Click &quot;Check In&quot; to process their arrival.
                      </p>
                    </div>
                  </div>)}

                
                {filteredStudents.length > 0 ? (<div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Room Assignment</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student) => {
                const { roomNumber, bunkNumber } = getRoomInfo(student);
                return (<TableRow key={student._id}>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400"/>
                                    <span className="font-medium">{getStudentName(student)}</span>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {getMatricNumber(student)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3 w-3 text-gray-400"/>
                                    <span className="text-gray-600 dark:text-gray-400">{student.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3 text-gray-400"/>
                                    <span className="text-gray-600 dark:text-gray-400">{getPhoneNumber(student)}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-gray-400"/>
                                    <span className="font-medium">Room {roomNumber}</span>
                                  </div>
                                  {bunkNumber && (<div className="flex items-center gap-2">
                                      <DoorOpen className="h-4 w-4 text-gray-400"/>
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Bunk {bunkNumber}
                                      </span>
                                    </div>)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1 text-sm">
                                  <span>{getDepartment(student)}</span>
                                  {student.level && (<span className="text-gray-500">Level {student.level}</span>)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">
                                  <Clock className="h-3 w-3 mr-1"/>
                                  Pending
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" onClick={() => router.push(`/porter/checkin?student=${student._id}`)}>
                                  <UserCheck className="h-4 w-4 mr-2"/>
                                  Check In
                                </Button>
                              </TableCell>
                            </TableRow>);
            })}
                      </TableBody>
                    </Table>
                  </div>) : (<div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {searchQuery ? 'No matching students' : 'No pending check-ins'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {searchQuery
                ? 'Try adjusting your search criteria'
                : 'All students with room assignments have been checked in'}
                    </p>
                    {searchQuery && (<Button variant="outline" onClick={() => setSearchQuery('')}>
                        Clear Search
                      </Button>)}
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}
