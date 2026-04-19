'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { porterAPI } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Users, BedDouble, DoorOpen, Calendar, Building2, CheckCircle2, XCircle, Clock } from 'lucide-react';
interface Student {
    _id: string;
    firstName: string;
    lastName: string;
    matricNumber: string;
    email: string;
    phoneNumber?: string;
    level: number;
    gender: string;
    checkInStatus: string;
    roomNumber?: string;
    checkInDate?: string;
}
interface Room {
    _id: string;
    roomNumber: string;
    capacity: number;
    currentOccupants: number;
    floor?: number;
    status: string;
}
export default function PorterReportsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('occupancy');
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        setLoading(true);
        try {
            const [studentsRes, roomsRes] = await Promise.all([
                porterAPI.getStudents(),
                porterAPI.getRooms()
            ]);
            console.log('Students API response:', studentsRes.data);
            console.log('Rooms API response:', roomsRes.data);
            const studentsData = studentsRes.data.data || studentsRes.data || [];
            const roomsData = roomsRes.data.data || roomsRes.data || [];
            console.log('Students data:', studentsData);
            console.log('First student sample:', studentsData[0]);
            console.log('Rooms data:', roomsData);
            console.log('First room sample:', roomsData[0]);
            const mappedStudents = studentsData.map((s: any) => ({
                ...s,
                matricNumber: s.matricNo || s.matricNumber,
                checkInStatus: s.reservationStatus || s.checkInStatus,
                roomNumber: s.assignedRoom?.roomNumber || s.roomNumber
            }));
            console.log('Mapped students:', mappedStudents);
            setStudents(mappedStudents);
            setRooms(roomsData);
        }
        catch (error: unknown) {
            console.error('Failed to load data:', error);
            const axiosError = error as {
                response?: {
                    status?: number;
                    data?: {
                        message?: string;
                        firstLogin?: boolean;
                    };
                };
            };
            if (axiosError.response?.data?.firstLogin) {
                alert('You must change your password before accessing this page. Redirecting to settings...');
                window.location.href = '/porter/settings';
                return;
            }
            if (axiosError.response?.status === 403) {
                const errorMessage = axiosError.response?.data?.message || 'Access denied';
                alert(errorMessage);
            }
        }
        finally {
            setLoading(false);
        }
    };
    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const totalOccupied = rooms.reduce((sum, r) => sum + r.currentOccupants, 0);
    const occupancyStats = {
        totalRooms: rooms.length,
        totalCapacity,
        totalOccupied,
        availableRooms: rooms.filter(r => r.currentOccupants < r.capacity).length,
        fullRooms: rooms.filter(r => r.currentOccupants >= r.capacity).length,
        occupancyRate: totalCapacity > 0
            ? Number(((totalOccupied / totalCapacity) * 100).toFixed(1))
            : 0
    };
    const checkedIn = students.filter(s => s.checkInStatus === 'checked_in' ||
        s.checkInStatus === 'checked-in');
    const pending = students.filter(s => s.checkInStatus === 'pending');
    const notCheckedIn = students.filter(s => s.checkInStatus === 'not_checked_in' ||
        s.checkInStatus === 'not-checked-in' ||
        !s.checkInStatus);
    const checkInStats = {
        total: students.length,
        checkedIn: checkedIn.length,
        pending: pending.length,
        notCheckedIn: notCheckedIn.length
    };
    console.log('Check-in stats:', checkInStats);
    console.log('Checked-in students sample:', checkedIn.slice(0, 2));
    const demographics = {
        male: students.filter(s => s.gender === 'male').length,
        female: students.filter(s => s.gender === 'female').length,
        byLevel: students.reduce((acc, s) => {
            acc[s.level] = (acc[s.level] || 0) + 1;
            return acc;
        }, {} as Record<number, number>)
    };
    const handleExport = (reportType: string) => {
        alert(`Exporting ${reportType} report... (This will be implemented with the backend)`);
    };
    if (loading) {
        return (<ProtectedRoute allowedRoles={['porter']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>);
    }
    return (<ProtectedRoute allowedRoles={['porter']}>
      <DashboardLayout>
        <div className="space-y-6">
          
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Reports
            </h2>
            <p className="text-muted-foreground mt-1">
              Generate and view hostel reports
            </p>
          </div>

          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
              <TabsTrigger value="checkin">Check-in</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="rooms">Room Status</TabsTrigger>
              <TabsTrigger value="daily">Daily Activity</TabsTrigger>
            </TabsList>

            
            <TabsContent value="occupancy" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5"/>
                        Occupancy Report
                      </CardTitle>
                      <CardDescription>Current hostel occupancy statistics</CardDescription>
                    </div>
                    <Button onClick={() => handleExport('occupancy')} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2"/>
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Total Capacity</CardDescription>
                        <CardTitle className="text-2xl">{occupancyStats.totalCapacity}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">beds across {occupancyStats.totalRooms} rooms</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Currently Occupied</CardDescription>
                        <CardTitle className="text-2xl text-blue-600">{occupancyStats.totalOccupied}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{occupancyStats.totalCapacity - occupancyStats.totalOccupied} beds available</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Occupancy Rate</CardDescription>
                        <CardTitle className="text-2xl text-green-600">{occupancyStats.occupancyRate}%</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{occupancyStats.fullRooms} rooms full</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Room Number</TableHead>
                          <TableHead className="text-center">Capacity</TableHead>
                          <TableHead className="text-center">Occupied</TableHead>
                          <TableHead className="text-center">Available</TableHead>
                          <TableHead className="text-center">Occupancy %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rooms.map((room) => (<TableRow key={room._id}>
                            <TableCell className="font-medium">{room.roomNumber}</TableCell>
                            <TableCell className="text-center">{room.capacity}</TableCell>
                            <TableCell className="text-center">{room.currentOccupants}</TableCell>
                            <TableCell className="text-center text-green-600">
                              {room.capacity - room.currentOccupants}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={room.currentOccupants >= room.capacity ? "destructive" : "secondary"}>
                                {Math.round((room.currentOccupants / room.capacity) * 100)}%
                              </Badge>
                            </TableCell>
                          </TableRow>))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            
            <TabsContent value="checkin" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5"/>
                        Check-in Report
                      </CardTitle>
                      <CardDescription>Student check-in status overview</CardDescription>
                    </div>
                    <Button onClick={() => handleExport('checkin')} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2"/>
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Total Students</CardDescription>
                        <CardTitle className="text-2xl">{checkInStats.total}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Checked In</CardDescription>
                        <CardTitle className="text-2xl text-green-600">{checkInStats.checkedIn}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Pending</CardDescription>
                        <CardTitle className="text-2xl text-orange-600">{checkInStats.pending}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Not Checked In</CardDescription>
                        <CardTitle className="text-2xl text-red-600">{checkInStats.notCheckedIn}</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matric Number</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Check-in Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (<TableRow key={student._id}>
                            <TableCell className="font-medium">{student.matricNumber}</TableCell>
                            <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                            <TableCell>{student.roomNumber || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={student.checkInStatus === 'checked-in' ? 'default' :
                student.checkInStatus === 'pending' ? 'secondary' : 'destructive'}>
                                {student.checkInStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {student.checkInDate
                ? new Date(student.checkInDate).toLocaleDateString()
                : '-'}
                            </TableCell>
                          </TableRow>))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            
            <TabsContent value="students" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5"/>
                        Student Report
                      </CardTitle>
                      <CardDescription>Complete list of all students</CardDescription>
                    </div>
                    <Button onClick={() => handleExport('students')} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2"/>
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Total Students</CardDescription>
                        <CardTitle className="text-2xl">{students.length}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Male Students</CardDescription>
                        <CardTitle className="text-2xl text-blue-600">{demographics.male}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Female Students</CardDescription>
                        <CardTitle className="text-2xl text-pink-600">{demographics.female}</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matric Number</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Phone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (<TableRow key={student._id}>
                            <TableCell className="font-medium">{student.matricNumber}</TableCell>
                            <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                            <TableCell>{student.level}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{student.gender}</Badge>
                            </TableCell>
                            <TableCell>{student.roomNumber || '-'}</TableCell>
                            <TableCell>{student.phoneNumber || '-'}</TableCell>
                          </TableRow>))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            
            <TabsContent value="rooms" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <DoorOpen className="h-5 w-5"/>
                        Room Status Report
                      </CardTitle>
                      <CardDescription>Detailed room availability and status</CardDescription>
                    </div>
                    <Button onClick={() => handleExport('room-status')} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2"/>
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Total Rooms</CardDescription>
                        <CardTitle className="text-2xl">{occupancyStats.totalRooms}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Available Rooms</CardDescription>
                        <CardTitle className="text-2xl text-green-600">{occupancyStats.availableRooms}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Full Rooms</CardDescription>
                        <CardTitle className="text-2xl text-red-600">{occupancyStats.fullRooms}</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Room Number</TableHead>
                          <TableHead>Floor</TableHead>
                          <TableHead className="text-center">Capacity</TableHead>
                          <TableHead className="text-center">Occupied</TableHead>
                          <TableHead className="text-center">Available</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rooms.map((room) => {
            const available = room.capacity - room.currentOccupants;
            const isFull = available === 0;
            return (<TableRow key={room._id}>
                              <TableCell className="font-medium">{room.roomNumber}</TableCell>
                              <TableCell>{room.floor || '-'}</TableCell>
                              <TableCell className="text-center">{room.capacity}</TableCell>
                              <TableCell className="text-center">{room.currentOccupants}</TableCell>
                              <TableCell className="text-center text-green-600">{available}</TableCell>
                              <TableCell>
                                <Badge variant={isFull ? "destructive" : "default"}>
                                  {isFull ? 'Full' : 'Available'}
                                </Badge>
                              </TableCell>
                            </TableRow>);
        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            
            <TabsContent value="daily" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5"/>
                        Daily Activity Report
                      </CardTitle>
                      <CardDescription>Today's check-in and check-out activities</CardDescription>
                    </div>
                    <Button onClick={() => handleExport('daily-activity')} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2"/>
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Today's Date</CardDescription>
                        <CardTitle className="text-xl">{new Date().toLocaleDateString()}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Check-ins Today</CardDescription>
                        <CardTitle className="text-2xl text-green-600">
                          {students.filter(s => {
            const checkInDate = s.checkInDate || (s as any).checkInDate;
            if (!checkInDate)
                return false;
            return new Date(checkInDate).toDateString() === new Date().toDateString();
        }).length}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Pending Actions</CardDescription>
                        <CardTitle className="text-2xl text-orange-600">{checkInStats.pending}</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Matric Number</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Activity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students
            .filter(s => {
            const checkInDate = s.checkInDate || (s as any).checkInDate;
            if (!checkInDate)
                return false;
            return new Date(checkInDate).toDateString() === new Date().toDateString();
        })
            .map((student) => {
            const checkInDate = student.checkInDate || (student as any).checkInDate;
            return (<TableRow key={student._id}>
                                <TableCell>
                                  {checkInDate
                    ? new Date(checkInDate).toLocaleTimeString()
                    : '-'}
                                </TableCell>
                                <TableCell className="font-medium">{student.matricNumber}</TableCell>
                                <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                                <TableCell>{student.roomNumber || '-'}</TableCell>
                                <TableCell>
                                  <Badge variant="default">
                                    <CheckCircle2 className="h-3 w-3 mr-1"/>
                                    Check-in
                                  </Badge>
                                </TableCell>
                              </TableRow>);
        })}
                        {students.filter(s => {
            const checkInDate = s.checkInDate || (s as any).checkInDate;
            if (!checkInDate)
                return false;
            return new Date(checkInDate).toDateString() === new Date().toDateString();
        }).length === 0 && (<TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No activities recorded for today
                            </TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}
