'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentAPI } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Search, MapPin, Users, BedDouble, CheckCircle2, ArrowRight, Home, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
interface Hostel {
    _id: string;
    name: string;
    code: string;
    location: string;
    totalRooms: number;
    totalCapacity: number;
    availableCapacity: number;
    currentOccupants?: number;
    occupiedCount?: number;
    studentsCount?: number;
    registeredStudents?: number;
    totalOccupants?: number;
    occupiedBeds?: number;
    gender: 'male' | 'female' | 'mixed';
    level: number;
    isActive: boolean;
    description?: string;
    availableRooms?: number;
    occupancyRate?: number;
}
export default function BrowseHostelsPage() {
    const router = useRouter();
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
    const [studentGender, setStudentGender] = useState<string>('');
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async (retryCount = 0) => {
        setLoading(true);
        try {
            try {
                const response = await studentAPI.getDashboard();
                const dashboardData = response.data.data || response.data;
                const gender = dashboardData.student?.gender || dashboardData.profile?.gender || '';
                setStudentGender(gender.toLowerCase());
            }
            catch (error) {
                console.error('Failed to load student profile:', error);
                console.warn('Unable to load student gender. Showing all hostels.');
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            const response = await studentAPI.getHostels();
            const hostelsData = response.data.data || response.data || [];
            console.log('Hostels from API:', hostelsData);
            setHostels(hostelsData);
        }
        catch (error: any) {
            console.error('Failed to load hostels:', error);
            if (error.response?.status === 429 && retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return loadData(retryCount + 1);
            }
            let errorMessage = 'Failed to load hostels.';
            if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
                errorMessage = '⚠️ Backend Server Issue\n\nThe server is not responding or is taking too long.\n\nPlease check:\n• Backend server is running on port 5000\n• Database connection is active\n• No errors in backend logs';
            }
            else if (error.response?.status === 429) {
                errorMessage = 'Too many requests. Please refresh the page in a moment.';
            }
            else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            else {
                errorMessage = 'Unable to connect to the server. Please ensure the backend is running.';
            }
            alert(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    const getAvailableCapacity = (hostel: Hostel): number => {
        const total = hostel.totalCapacity ?? 0;
        const occupied = hostel.currentOccupants ??
            hostel.occupiedCount ??
            hostel.studentsCount ??
            hostel.registeredStudents ??
            hostel.totalOccupants ??
            hostel.occupiedBeds ??
            null;
        if (occupied !== null && total > 0) {
            return Math.max(0, total - occupied);
        }
        return hostel.availableCapacity ?? hostel.availableRooms ?? 0;
    };
    const filteredHostels = hostels.filter((hostel) => {
        const matchesSearch = hostel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            hostel.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            hostel.location.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesStudentGender = true;
        if (studentGender) {
            matchesStudentGender = hostel.gender === studentGender || hostel.gender === 'mixed';
        }
        const hasAvailability = getAvailableCapacity(hostel) > 0;
        const matchesAvailability = availabilityFilter === 'all' ||
            (availabilityFilter === 'available' && hasAvailability) ||
            (availabilityFilter === 'full' && !hasAvailability);
        return matchesSearch && matchesStudentGender && matchesAvailability && hostel.isActive;
    });
    const getOccupancyColor = (rate: number) => {
        if (rate >= 90)
            return 'text-red-600';
        if (rate >= 70)
            return 'text-orange-600';
        if (rate >= 50)
            return 'text-yellow-600';
        return 'text-green-600';
    };
    const handleViewRooms = (hostelId: string) => {
        router.push(`/student/hostels/${hostelId}/rooms`);
    };
    if (loading) {
        return (<ProtectedRoute allowedRoles={['student']}>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center h-64 space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading hostels...</p>
            <p className="text-xs text-muted-foreground">This may take a moment if the server is starting up</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>);
    }
    return (<ProtectedRoute allowedRoles={['student']}>
      <DashboardLayout>
        <div className="space-y-6">
          
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Browse Hostels
            </h2>
            <p className="text-muted-foreground mt-1">
              Find and reserve your preferred accommodation
            </p>
          </div>

          
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Available for You</CardDescription>
                <CardTitle className="text-2xl">
                  {hostels.filter(h => (h.gender === studentGender || h.gender === 'mixed') && h.isActive).length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4"/>
                  <span>Matching your gender</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>With Availability</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  {hostels.filter(h => (h.gender === studentGender || h.gender === 'mixed') &&
            getAvailableCapacity(h) > 0).length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4"/>
                  <span>Rooms available</span>
                </div>
              </CardContent>
            </Card>

            
          </div>

          
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                  <Input placeholder="Search by name, code, or location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/>
                </div>

                
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground"/>
                      <SelectValue placeholder="Filter by availability"/>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hostels</SelectItem>
                    <SelectItem value="available">Available Only</SelectItem>
                    <SelectItem value="full">Full Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredHostels.length === 0 ? (<div className="col-span-full text-center py-12">
                <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
                <p className="text-muted-foreground">No hostels found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters
                </p>
              </div>) : (filteredHostels.map((hostel) => (<Card key={hostel._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary"/>
                          {hostel.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            {hostel.code}
                          </Badge>
                        </CardDescription>
                      </div>
                      {getAvailableCapacity(hostel) > 0 ? (<Badge className="bg-green-500">Available</Badge>) : (<Badge variant="destructive">Full</Badge>)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4"/>
                      <span>{hostel.location}</span>
                    </div>

                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <BedDouble className="h-3 w-3"/>
                          <span>Rooms</span>
                        </div>
                        <p className="text-sm font-semibold">
                          {hostel.availableRooms ?? 0}/{hostel.totalRooms} available
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3"/>
                          <span>Capacity</span>
                        </div>
                        <p className="text-sm font-semibold">
                          {getAvailableCapacity(hostel)} / {hostel.totalCapacity ?? 0} available
                        </p>
                      </div>
                    </div>

                    
                    {hostel.occupancyRate !== undefined && (<div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Occupancy</span>
                          <span className={`font-semibold ${getOccupancyColor(hostel.occupancyRate)}`}>
                            {hostel.occupancyRate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${hostel.occupancyRate >= 90 ? 'bg-red-500' :
                    hostel.occupancyRate >= 70 ? 'bg-orange-500' :
                        hostel.occupancyRate >= 50 ? 'bg-yellow-500' :
                            'bg-green-500'}`} style={{ width: `${hostel.occupancyRate}%` }}/>
                        </div>
                      </div>)}

                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1"/>
                        {hostel.gender}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {hostel.level}L
                      </Badge>
                    </div>

                    
                    {hostel.description && (<p className="text-xs text-muted-foreground line-clamp-2">
                        {hostel.description}
                      </p>)}

                    
                    <Button className="w-full" onClick={() => handleViewRooms(hostel._id)} disabled={getAvailableCapacity(hostel) === 0}>
                      {getAvailableCapacity(hostel) > 0 ? (<>
                          View Rooms
                          <ArrowRight className="ml-2 h-4 w-4"/>
                        </>) : ('No Rooms Available')}
                    </Button>
                  </CardContent>
                </Card>)))}
          </div>

          
          {filteredHostels.length > 0 && (<div className="text-center text-sm text-muted-foreground">
              Showing {filteredHostels.length} of {hostels.length} hostel{hostels.length !== 1 ? 's' : ''}
            </div>)}
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}
