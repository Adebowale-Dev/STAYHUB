'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentAPI } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Users, BedDouble, ArrowLeft, CheckCircle2, Home, Filter, Layers, AlertCircle, X, UserPlus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
interface Room {
    _id: string;
    hostelId?: string;
    roomNumber: string;
    floor: number;
    capacity: number;
    currentOccupants: number;
    availableSpaces: number;
    reservedSpaces: number;
    isAvailable: boolean;
    gender: string;
    amenities?: string[];
}
interface Hostel {
    _id: string;
    name: string;
    code: string;
    location: string;
    gender: string;
    description?: string;
}
interface ActiveReservationInfo {
    status: string;
    roomNumber?: string;
    hostelName?: string;
}
interface InviteChannelSummary {
    available: boolean;
    willSend: boolean;
    addressMasked?: string | null;
    deviceCount?: number;
}
interface InvitePreview {
    friend: {
        _id: string;
        firstName: string;
        lastName: string;
        matricNo: string;
        level?: number;
        paymentStatus?: string;
        emailMasked?: string | null;
        department?: {
            name?: string;
            code?: string;
        } | string | null;
    };
    invitation: {
        approvalWindowHours: number;
        requiresPaymentBeforeApproval: boolean;
        notificationChannels: {
            email: InviteChannelSummary;
            inApp: InviteChannelSummary;
            push: InviteChannelSummary;
        };
    };
}
interface InvitedFriend {
    _id: string;
    matricNo: string;
    name: string;
    departmentLabel?: string | null;
    level?: number;
    paymentStatus?: string;
    emailMasked?: string | null;
    approvalWindowHours: number;
    requiresPaymentBeforeApproval: boolean;
    notificationChannels: {
        email: InviteChannelSummary;
        inApp: InviteChannelSummary;
        push: InviteChannelSummary;
    };
}
export default function HostelRoomsPage() {
    const router = useRouter();
    const params = useParams();
    const hostelId = params?.id as string;
    const [hostel, setHostel] = useState<Hostel | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [floorFilter, setFloorFilter] = useState<string>('all');
    const [availabilityFilter, setAvailabilityFilter] = useState<string>('available');
    const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [reserving, setReserving] = useState(false);
    const [reserveWithFriends, setReserveWithFriends] = useState(false);
    const [invitedFriends, setInvitedFriends] = useState<InvitedFriend[]>([]);
    const [friendInput, setFriendInput] = useState('');
    const [friendValidationError, setFriendValidationError] = useState<string | null>(null);
    const [validatingFriend, setValidatingFriend] = useState(false);
    const [activeReservation, setActiveReservation] = useState<ActiveReservationInfo | null>(null);
    const loadRooms = async () => {
        setLoading(true);
        try {
            const response = await studentAPI.getRooms(hostelId);
            console.log('Rooms API response:', response.data);
            const roomsData = response.data.data || response.data || [];
            const mappedRooms: Room[] = roomsData.map((room: any) => ({
                _id: room._id,
                hostelId: room.hostel?._id || room.hostel || hostelId,
                roomNumber: room.roomNumber,
                floor: room.floor,
                capacity: room.capacity,
                currentOccupants: room.currentOccupants,
                availableSpaces: room.availableSpaces,
                reservedSpaces: room.reservedSpaces ?? 0,
                isAvailable: room.isAvailable,
                gender: room.gender || room.hostel?.gender || 'male',
                amenities: ['Bed', 'Wardrobe', 'Study Desk', 'Fan'],
            }));
            setRooms(mappedRooms);
        }
        catch (error) {
            console.error('Failed to load rooms:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const loadActiveReservation = async () => {
        try {
            const response = await studentAPI.getReservation();
            const reservationData = response.data.data || response.data;
            const reservationStatus = String(reservationData?.reservationStatus || reservationData?.status || '').toLowerCase();
            if (!reservationData || !['temporary', 'confirmed', 'checked_in', 'checked-in'].includes(reservationStatus)) {
                setActiveReservation(null);
                return;
            }
            setActiveReservation({
                status: reservationStatus,
                roomNumber: reservationData?.room?.roomNumber || reservationData?.assignedRoom?.roomNumber,
                hostelName: reservationData?.hostel?.name || reservationData?.assignedHostel?.name,
            });
        }
        catch (error: any) {
            if (error?.response?.status === 404) {
                setActiveReservation(null);
                return;
            }
            console.error('Failed to load current reservation:', error);
        }
    };
    useEffect(() => {
        const loadHostelDetails = async () => {
            try {
                const response = await studentAPI.getHostels();
                console.log('Hostels API response:', response.data);
                const hostels = response.data.data || response.data || [];
                const currentHostel = hostels.find((h: Hostel) => h._id === hostelId);
                console.log('Current hostel:', currentHostel);
                setHostel(currentHostel || null);
            }
            catch (error) {
                console.error('Failed to load hostel:', error);
            }
        };
        if (hostelId) {
            loadHostelDetails();
            loadActiveReservation();
            loadRooms();
        }
    }, [hostelId]);
    const filteredRooms = rooms.filter((room) => {
        const matchesSearch = room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFloor = floorFilter === 'all' || room.floor.toString() === floorFilter;
        const matchesAvailability = availabilityFilter === 'all' ||
            (availabilityFilter === 'available' && room.isAvailable) ||
            (availabilityFilter === 'full' && !room.isAvailable);
        return matchesSearch && matchesFloor && matchesAvailability;
    });
    const floors = [...new Set(rooms.map(room => room.floor))].sort();
    const getOccupancyColor = (current: number, capacity: number) => {
        const percentage = (current / capacity) * 100;
        if (percentage >= 100)
            return 'text-red-600';
        if (percentage >= 75)
            return 'text-orange-600';
        if (percentage >= 50)
            return 'text-yellow-600';
        return 'text-green-600';
    };
    const getDepartmentLabel = (department?: InvitePreview['friend']['department']) => {
        if (!department)
            return null;
        if (typeof department === 'string')
            return department;
        return department.name || department.code || null;
    };
    const handleReserveRoom = (roomId: string) => {
        if (activeReservation) {
            router.push('/student/reservation');
            return;
        }
        const room = rooms.find(r => r._id === roomId);
        if (room) {
            setSelectedRoom(room);
            setFriendValidationError(null);
            setReserveDialogOpen(true);
        }
    };
    const validateAndAddFriend = async () => {
        const normalizedMatricNo = friendInput.toUpperCase().trim();

        if (!normalizedMatricNo) {
            setFriendValidationError('Please enter a matric number.');
            return;
        }
        if (!selectedRoom)
            return;
        if (invitedFriends.some(f => f.matricNo.toLowerCase() === normalizedMatricNo.toLowerCase())) {
            setFriendValidationError('This friend is already in the list.');
            setFriendInput('');
            return;
        }

        const totalFriendsAfterAdding = invitedFriends.length + 1;
        const totalReservationsAfterAdding = totalFriendsAfterAdding + 1;
        if (totalReservationsAfterAdding > selectedRoom.availableSpaces) {
            setFriendValidationError(`Not enough space for you + ${totalFriendsAfterAdding} friend${totalFriendsAfterAdding === 1 ? '' : 's'}. This room has ${selectedRoom.availableSpaces} available space(s).`);
            return;
        }

        setValidatingFriend(true);
        setFriendValidationError(null);
        try {
            const response = await studentAPI.previewReservationInvite({
                roomId: selectedRoom._id,
                hostelId: selectedRoom.hostelId || hostelId,
                matricNo: normalizedMatricNo,
            });

            if (response.status >= 400 || !response.data?.success) {
                setFriendValidationError(response.data?.message || 'Failed to validate friend. Please check the matric number.');
                return;
            }

            const preview = (response.data.data || response.data) as InvitePreview;
            const friend = preview.friend;
            const nextFriend: InvitedFriend = {
                _id: friend._id,
                matricNo: friend.matricNo,
                name: `${friend.firstName} ${friend.lastName}`.trim(),
                departmentLabel: getDepartmentLabel(friend.department),
                level: friend.level,
                paymentStatus: friend.paymentStatus,
                emailMasked: friend.emailMasked,
                approvalWindowHours: preview.invitation.approvalWindowHours,
                requiresPaymentBeforeApproval: preview.invitation.requiresPaymentBeforeApproval,
                notificationChannels: preview.invitation.notificationChannels,
            };

            setInvitedFriends([...invitedFriends, nextFriend]);
            setFriendInput('');
            setFriendValidationError(null);
        }
        catch (error: unknown) {
            const axiosError = error as {
                response?: {
                    status?: number;
                    data?: {
                        message?: string;
                    };
                };
            };
            const status = axiosError.response?.status;

            if (status && status < 500) {
                setFriendValidationError(axiosError.response?.data?.message || 'Unable to add this friend to the reservation.');
                return;
            }

            console.error('Friend validation request failed:', error);
            setFriendValidationError('Failed to validate friend due to a network or server issue. Please try again.');
        }
        finally {
            setValidatingFriend(false);
        }
    };
    const removeFriend = (matricNo: string) => {
      setInvitedFriends(invitedFriends.filter(f => f.matricNo !== matricNo));
      setFriendValidationError(null);
    };
    const resetReservationDialog = () => {
        setReserveDialogOpen(false);
        setSelectedRoom(null);
        setReserveWithFriends(false);
        setInvitedFriends([]);
        setFriendInput('');
        setFriendValidationError(null);
    };
    const confirmReservation = async () => {
        if (!selectedRoom || !hostelId)
            return;

      if (reserveWithFriends && invitedFriends.length > 0) {
        const requiredSlots = invitedFriends.length + 1;
        if (requiredSlots > selectedRoom.availableSpaces) {
          setFriendValidationError(`Not enough space for this group. You need ${requiredSlots} space(s), but this room has ${selectedRoom.availableSpaces}.`);
          return;
        }
      }

        setReserving(true);
        try {
            const reservationData: Record<string, unknown> = {
                roomId: selectedRoom._id,
          hostelId: selectedRoom.hostelId || hostelId,
            };
            if (reserveWithFriends && invitedFriends.length > 0) {
                reservationData.friends = invitedFriends.map(f => f.matricNo);
                reservationData.isGroupReservation = true;
            }
            console.log('🎯 Attempting reservation with data:', reservationData);
            console.log('   Room ID:', selectedRoom._id);
            console.log('   Hostel ID:', hostelId);
            console.log('   Friends:', reserveWithFriends ? invitedFriends.length : 0);
            const response = await studentAPI.reserveRoom(reservationData);
            console.log('✅ Reservation successful!');
            console.log('   Response:', response.data);
            if (reserveWithFriends && invitedFriends.length > 0) {
                alert(`✅ Group Reservation Successful!\n\n` +
                    `Room ${selectedRoom.roomNumber} reserved for:\n` +
                    `- You\n` +
                    invitedFriends.map(f => `- ${f.name} (${f.matricNo})`).join('\n') +
                    `\n\nPlease proceed to check-in at the porter's desk.`);
            }
            else {
                alert(`✅ Room ${selectedRoom.roomNumber} reserved successfully!\n\nPlease proceed to check-in at the porter's desk.`);
            }
            resetReservationDialog();
            router.push('/student/reservation');
        }
        catch (error: unknown) {
            const axiosError = error as {
                response?: {
                    status?: number;
                    data?: {
                        code?: string;
                        message?: string;
                        error?: string;
                        details?: string;
                        data?: {
                            reservation?: {
                                room?: { roomNumber?: string };
                                hostel?: { name?: string };
                                reservationStatus?: string;
                                status?: string;
                            };
                            reservationStatus?: string;
                        };
                    };
                };
                message?: string;
            };
            const status = axiosError.response?.status;
            const errorData = axiosError.response?.data;
            let errorMessage = 'Failed to reserve room. Please try again.';
            if (errorData?.message)
                errorMessage = errorData.message;
            else if (errorData?.error)
                errorMessage = errorData.error;
            else if (errorData?.details)
                errorMessage = errorData.details;
            if (status === 403 || errorMessage.toLowerCase().includes('payment required')) {
                resetReservationDialog();
                router.push('/student/payment');
                return;
            }
            else if (status === 409 && errorData?.data?.reservation) {
                const conflictingReservation = errorData.data.reservation;
                const conflictRoom = conflictingReservation?.room?.roomNumber || 'your assigned room';
                const conflictHostel = conflictingReservation?.hostel?.name || 'your hostel';
                alert(`❌ Reservation Blocked\n\n${errorMessage}\n\nCurrent room: ${conflictRoom} in ${conflictHostel}\n\nYou will be redirected to your reservation page.`);
                setActiveReservation({
                    status: errorData?.data?.reservationStatus || conflictingReservation?.reservationStatus || conflictingReservation?.status || 'confirmed',
                    roomNumber: conflictingReservation?.room?.roomNumber,
                    hostelName: conflictingReservation?.hostel?.name,
                });
                resetReservationDialog();
                router.push('/student/reservation');
                return;
            }
            else if (errorMessage.includes('No available bunks')) {
                alert(`❌ Room No Longer Available\n\nAll bunks in this room are already reserved or occupied.\n\nThe room list will refresh automatically to show current availability.`);
                try {
                    await loadRooms();
                }
                catch {
                }
                resetReservationDialog();
            }
            else if (status === 401) {
                alert(`❌ Session Expired\n\nYour session has expired. Please log in again.`);
                router.push('/login');
            }
            else if (status === 404) {
                alert(`❌ Room Not Found\n\nThe room you're trying to reserve no longer exists or has been removed.`);
            }
            else {
                alert(`❌ Reservation Failed\n\n${errorMessage}`);
            }
        }
        finally {
            setReserving(false);
        }
    };
    if (loading) {
        return (<ProtectedRoute allowedRoles={['student']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading rooms...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>);
    }
    return (<ProtectedRoute allowedRoles={['student']}>
      <DashboardLayout>
        <div className="space-y-6">
          {activeReservation && (<Alert>
              <AlertCircle className="h-4 w-4"/>
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  You already have a {activeReservation.status.replace('_', ' ')} room assignment
                  {activeReservation.roomNumber ? ` for Room ${activeReservation.roomNumber}` : ''}
                  {activeReservation.hostelName ? ` in ${activeReservation.hostelName}` : ''}. Open your reservation to add friends to the same room.
                </span>
                <Button variant="outline" size="sm" onClick={() => router.push('/student/reservation')}>
                  Manage My Room
                </Button>
              </AlertDescription>
            </Alert>)}
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/student/hostels')}>
              <ArrowLeft className="h-5 w-5"/>
            </Button>
            <div className="flex-1">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                {hostel?.name || 'Hostel'} - Available Rooms
              </h2>
              <p className="text-muted-foreground mt-1">
                {hostel?.location} • {hostel?.code}
              </p>
            </div>
          </div>

          
          {hostel?.description && (<Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {hostel.description}
                </p>
              </CardContent>
            </Card>)}

          
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Rooms</CardDescription>
                <CardTitle className="text-2xl">{rooms.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BedDouble className="h-4 w-4"/>
                  <span>All floors</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Available</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  {rooms.filter(r => r.currentOccupants < r.capacity).length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4"/>
                  <span>Rooms with space</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Floors</CardDescription>
                <CardTitle className="text-2xl">{floors.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Layers className="h-4 w-4"/>
                  <span>Building levels</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Capacity</CardDescription>
                <CardTitle className="text-2xl">
                  {rooms.reduce((sum, r) => sum + r.capacity, 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4"/>
                  <span>Total students</span>
                </div>
              </CardContent>
            </Card>
          </div>

          
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                  <Input placeholder="Search by room number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/>
                </div>

                
                <Select value={floorFilter} onValueChange={setFloorFilter}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground"/>
                      <SelectValue placeholder="Filter by floor"/>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Floors</SelectItem>
                    {floors.map(floor => (<SelectItem key={floor} value={floor.toString()}>
                        Floor {floor}
                      </SelectItem>))}
                  </SelectContent>
                </Select>

                
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground"/>
                      <SelectValue placeholder="Filter by availability"/>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rooms</SelectItem>
                    <SelectItem value="available">Available Only</SelectItem>
                    <SelectItem value="full">Full Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRooms.length === 0 ? (<div className="col-span-full text-center py-12">
                <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
                <p className="text-muted-foreground">No rooms found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters
                </p>
              </div>) : (filteredRooms.map((room) => {
            const availableSpaces = room.availableSpaces;
            const hasSpace = room.isAvailable;
            return (<Card key={room._id} className={`hover:shadow-lg transition-shadow ${!hasSpace ? 'opacity-60' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <BedDouble className="h-5 w-5 text-primary"/>
                            Room {room.roomNumber}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Floor {room.floor}
                          </CardDescription>
                        </div>
                        {hasSpace ? (<Badge className="bg-green-500">
                            {availableSpaces} {availableSpaces === 1 ? 'Space' : 'Spaces'}
                          </Badge>) : (<Badge variant="destructive">Full</Badge>)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Occupancy</span>
                          <span className={`font-semibold ${getOccupancyColor(room.currentOccupants, room.capacity)}`}>
                            {room.currentOccupants}/{room.capacity}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${availableSpaces === 0 ? 'bg-red-500' :
                    availableSpaces <= 1 ? 'bg-orange-500' :
                        availableSpaces <= room.capacity * 0.5 ? 'bg-yellow-500' :
                            'bg-green-500'}`} style={{ width: `${Math.min((room.currentOccupants / room.capacity) * 100, 100)}%` }}/>
                        </div>
                        {room.reservedSpaces > 0 && (<p className="text-xs text-orange-600">
                            {room.reservedSpaces} reserved (pending check-in)
                          </p>)}
                      </div>

                      
                      {room.amenities && room.amenities.length > 0 && (<div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Amenities:</p>
                          <div className="flex flex-wrap gap-1">
                            {room.amenities.slice(0, 3).map((amenity, idx) => (<Badge key={idx} variant="outline" className="text-xs">
                                {amenity}
                              </Badge>))}
                            {room.amenities.length > 3 && (<Badge variant="outline" className="text-xs">
                                +{room.amenities.length - 3}
                              </Badge>)}
                          </div>
                        </div>)}

                      
                      <Button className="w-full" onClick={() => handleReserveRoom(room._id)} disabled={!hasSpace && !activeReservation} size="sm">
                        {hasSpace || activeReservation ? (<>
                            <CheckCircle2 className="mr-2 h-4 w-4"/>
                            {activeReservation ? 'Manage My Room' : 'Reserve Room'}
                          </>) : ('Room Full')}
                      </Button>
                    </CardContent>
                  </Card>);
        }))}
          </div>

          
          {filteredRooms.length > 0 && (<div className="text-center text-sm text-muted-foreground">
              Showing {filteredRooms.length} of {rooms.length} room{rooms.length !== 1 ? 's' : ''}
            </div>)}
        </div>

        
        <Dialog open={reserveDialogOpen} onOpenChange={(open) => {
            if (!open)
                resetReservationDialog();
            else
                setReserveDialogOpen(open);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirm Room Reservation</DialogTitle>
              <DialogDescription>
                {reserveWithFriends
            ? 'Reserve this room for you and your friends'
            : 'Are you sure you want to reserve this room?'}
              </DialogDescription>
            </DialogHeader>

            {selectedRoom && (<div className="space-y-4 py-4">
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hostel:</span>
                    <span className="font-medium">{hostel?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room Number:</span>
                    <span className="font-semibold text-lg">{selectedRoom.roomNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Floor:</span>
                    <span className="font-medium">Floor {selectedRoom.floor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="font-medium">{selectedRoom.capacity} students</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Spaces:</span>
                    <span className="font-medium text-green-600">
                      {selectedRoom.availableSpaces} spaces
                    </span>
                  </div>
                </div>

                <Separator />

                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="reserve-with-friends" disabled={(selectedRoom?.availableSpaces || 0) < 2} checked={reserveWithFriends} onCheckedChange={(checked) => {
                if (checked === true && (selectedRoom?.availableSpaces || 0) < 2) {
                    setReserveWithFriends(false);
                    setFriendValidationError('Group reservation requires at least 2 available spaces in this room.');
                    return;
                }
                setReserveWithFriends(checked as boolean);
                if (!checked) {
                    setInvitedFriends([]);
                    setFriendValidationError(null);
                }
                else {
                    setFriendValidationError(null);
                }
            }}/>
                    <label htmlFor="reserve-with-friends" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      Reserve with friends (Group Reservation)
                    </label>
                  </div>
                  {(selectedRoom?.availableSpaces || 0) < 2 && (<p className="text-xs text-muted-foreground">Group reservation is unavailable for this room because only {selectedRoom?.availableSpaces || 0} space is left.</p>)}

                  {reserveWithFriends && (<div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4"/>
                        <span>Add friends by their matric number</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        StayHub will look up each student record from the matric number, then send the room invite automatically by email, in-app notification, and push if their mobile device is connected.
                      </p>

                      
                      <div className="flex gap-2">
                        <Input placeholder="Enter matric number (e.g., CSC/2020/001)" value={friendInput} onChange={(e) => {
                    setFriendInput(e.target.value.toUpperCase());
                    if (friendValidationError) {
                        setFriendValidationError(null);
                    }
                }} onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        validateAndAddFriend();
                    }
                }} disabled={validatingFriend}/>
                        <Button type="button" onClick={validateAndAddFriend} disabled={validatingFriend || !friendInput.trim()} size="sm">
                          <UserPlus className="h-4 w-4 mr-2"/>
                          {validatingFriend ? 'Checking...' : 'Add'}
                        </Button>
                      </div>

                      {friendValidationError && (<p className="text-sm text-destructive">{friendValidationError}</p>)}

                      
                      {invitedFriends.length > 0 && (<div className="space-y-2">
                          <p className="text-sm font-medium">
                            Invited Friends ({invitedFriends.length})
                          </p>
                          <div className="space-y-2">
                            {invitedFriends.map((friend) => (<div key={friend.matricNo} className="flex items-start justify-between gap-3 p-3 rounded bg-background border">
                                <div className="flex flex-col gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{friend.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {friend.matricNo}
                                      {friend.departmentLabel ? ` • ${friend.departmentLabel}` : ''}
                                      {friend.level ? ` • ${friend.level} level` : ''}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline">
                                      Email {friend.emailMasked ? `• ${friend.emailMasked}` : ''}
                                    </Badge>
                                    <Badge variant="outline">In-app alert</Badge>
                                    {friend.notificationChannels.push.willSend ? (<Badge variant="outline">
                                        Push {friend.notificationChannels.push.deviceCount ? `• ${friend.notificationChannels.push.deviceCount} device${friend.notificationChannels.push.deviceCount === 1 ? '' : 's'}` : ''}
                                      </Badge>) : (<Badge variant="secondary">Push when device connects</Badge>)}
                                    {friend.requiresPaymentBeforeApproval && (<Badge variant="secondary">Payment pending before approval</Badge>)}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Approval window: {friend.approvalWindowHours} hours
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => removeFriend(friend.matricNo)} className="h-8 w-8 p-0">
                                  <X className="h-4 w-4"/>
                                </Button>
                              </div>))}
                          </div>
                        </div>)}

                      
                      {invitedFriends.length > 0 && (<Alert>
                          <AlertCircle className="h-4 w-4"/>
                          <AlertDescription>
                            Total reservations: <strong>{1 + invitedFriends.length}</strong> (You + {invitedFriends.length} friend{invitedFriends.length !== 1 ? 's' : ''})
                            <br />
                            Available spaces: <strong>{selectedRoom.availableSpaces}</strong>
                            <br />
                            Every invited friend will get an automatic StayHub invite and has 24 hours to approve.
                          </AlertDescription>
                        </Alert>)}
                    </div>)}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4"/>
                  <AlertDescription>
                    Please ensure you have completed your payment before reserving a room.
                    Once reserved, you will need to check-in at the porter&apos;s desk.
                  </AlertDescription>
                </Alert>
              </div>)}

            <DialogFooter>
              <Button variant="outline" onClick={() => resetReservationDialog()} disabled={reserving || validatingFriend}>
                Cancel
              </Button>
              <Button onClick={confirmReservation} disabled={reserving || validatingFriend}>
                {reserving ? 'Reserving...' : reserveWithFriends && invitedFriends.length > 0 ? `Reserve for ${1 + invitedFriends.length} Students` : 'Confirm Reservation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>);
}
