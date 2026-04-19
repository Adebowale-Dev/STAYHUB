'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { porterAPI } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DoorOpen, Search, Users, BedDouble, Building2, AlertCircle } from 'lucide-react';
interface Room {
    _id: string;
    roomNumber: string;
    block?: string;
    capacity: number;
    currentOccupants?: number;
    occupiedBeds?: number;
    availableBeds?: number;
    occupied?: number;
    available?: number;
    hostel: {
        _id: string;
        name: string;
    };
    floor?: number;
    roomType?: string;
    students?: Array<{
        _id: string;
        name: string;
        matricNumber?: string;
        bunkNumber?: number;
    }>;
}
export default function PorterRoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    useEffect(() => {
        loadRooms();
    }, []);
    const loadRooms = async () => {
        setLoading(true);
        try {
            const response = await porterAPI.getRooms();
            const roomsData = response.data.data || response.data || [];
            setRooms(roomsData);
        }
        catch (error: unknown) {
            console.error('Failed to load rooms:', error);
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
                const errorMessage = axiosError.response?.data?.message || 'Access denied: Your porter account does not have a hostel assigned yet. Please contact the administrator to assign a hostel to your account.';
                alert(errorMessage);
            }
            else {
                alert('Failed to load rooms. Please try again.');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const getOccupiedBeds = (room: Room) => room.currentOccupants ?? room.occupiedBeds ?? room.occupied ?? 0;
    const getAvailableBeds = (room: Room) => room.availableBeds ?? room.available ?? (room.capacity - getOccupiedBeds(room));
    const filteredRooms = rooms.filter((room) => {
        const matchesSearch = room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });
    const stats = {
        total: rooms.length,
        full: rooms.filter(r => getAvailableBeds(r) === 0).length,
        available: rooms.filter(r => getAvailableBeds(r) > 0).length,
        totalCapacity: rooms.reduce((sum, r) => sum + r.capacity, 0),
        totalOccupied: rooms.reduce((sum, r) => sum + getOccupiedBeds(r), 0),
    };
    const getOccupancyBadge = (room: Room) => {
        const occupiedBeds = getOccupiedBeds(room);
        const percentage = (occupiedBeds / room.capacity) * 100;
        if (percentage === 100) {
            return <Badge variant="destructive">Full</Badge>;
        }
        else if (percentage >= 75) {
            return <Badge className="bg-orange-500">Almost Full</Badge>;
        }
        else if (percentage > 0) {
            return <Badge className="bg-blue-500">Partially Occupied</Badge>;
        }
        else {
            return <Badge variant="outline">Empty</Badge>;
        }
    };
    if (loading) {
        return (<ProtectedRoute allowedRoles={['porter']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading rooms...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>);
    }
    return (<ProtectedRoute allowedRoles={['porter']}>
      <DashboardLayout>
        <div className="space-y-6">
          
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Hostel Rooms
            </h2>
            <p className="text-muted-foreground mt-1">
              View and manage rooms in your assigned hostel
            </p>
          </div>

          
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Rooms</CardDescription>
                <CardTitle className="text-2xl">{stats.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DoorOpen className="h-4 w-4"/>
                  <span>All rooms</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Available Rooms</CardDescription>
                <CardTitle className="text-2xl text-green-600">{stats.available}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BedDouble className="h-4 w-4"/>
                  <span>Rooms with space</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Full Rooms</CardDescription>
                <CardTitle className="text-2xl text-red-600">{stats.full}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4"/>
                  <span>No space</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Occupancy Rate</CardDescription>
                <CardTitle className="text-2xl">
                  {stats.totalCapacity > 0
            ? Math.round((stats.totalOccupied / stats.totalCapacity) * 100)
            : 0}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4"/>
                  <span>{stats.totalOccupied}/{stats.totalCapacity} beds</span>
                </div>
              </CardContent>
            </Card>
          </div>

          
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="Search by room number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/>
              </div>
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader>
              <CardTitle>Rooms</CardTitle>
              <CardDescription>
                {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRooms.length === 0 ? (<div className="text-center py-12">
                  <DoorOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
                  <p className="text-muted-foreground">No rooms found</p>
                </div>) : (<div className="rounded-md border">
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
                      {filteredRooms.map((room) => (<TableRow key={room._id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <DoorOpen className="h-4 w-4 text-muted-foreground"/>
                              {room.roomNumber}
                            </div>
                          </TableCell>
                          <TableCell>
                            {room.floor ? (<span className="text-sm">{room.floor}</span>) : (<span className="text-muted-foreground text-sm">-</span>)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{room.capacity}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium">{getOccupiedBeds(room)}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium text-green-600">
                              {getAvailableBeds(room)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getOccupancyBadge(room)}
                          </TableCell>
                        </TableRow>))}
                    </TableBody>
                  </Table>
                </div>)}
            </CardContent>
          </Card>

          
          {filteredRooms.length > 0 && (<Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5"/>
                  Hostel Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hostel Name:</span>
                    <span className="font-medium">{rooms[0]?.hostel?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Rooms:</span>
                    <span className="font-medium">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Capacity:</span>
                    <span className="font-medium">{stats.totalCapacity} beds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currently Occupied:</span>
                    <span className="font-medium">{stats.totalOccupied} beds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Beds:</span>
                    <span className="font-medium text-green-600">
                      {stats.totalCapacity - stats.totalOccupied} beds
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}
