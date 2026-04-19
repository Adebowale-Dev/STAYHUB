'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserCheck, Search, Building2, Mail, Phone, UserPlus } from 'lucide-react';
interface Porter {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    status: 'pending' | 'approved' | 'rejected';
    hostel?: {
        _id: string;
        name: string;
    };
    assignedHostel?: {
        _id: string;
        name: string;
    };
    createdAt: string;
}
interface Hostel {
    _id: string;
    name: string;
    gender: 'male' | 'female' | 'mixed';
    porter?: {
        _id: string;
        name: string;
    };
}
export default function PortersPage() {
    const [porters, setPorters] = useState<Porter[]>([]);
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
    const [selectedPorter, setSelectedPorter] = useState<Porter | null>(null);
    const [selectedHostelId, setSelectedHostelId] = useState('');
    const [creating, setCreating] = useState(false);
    const [reassigning, setReassigning] = useState(false);
    const [newPorter, setNewPorter] = useState({
        name: '',
        email: '',
        password: '',
        phoneNumber: '',
        hostelId: '',
    });
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            const [portersResponse, hostelsResponse] = await Promise.all([
                adminAPI.getPorters(),
                adminAPI.getHostels(),
            ]);
            setPorters(portersResponse.data.data || portersResponse.data || []);
            setHostels(hostelsResponse.data.data || hostelsResponse.data || []);
        }
        catch (error) {
            console.error('Failed to load data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreatePorter = async () => {
        if (!newPorter.name || !newPorter.email || !newPorter.password) {
            alert('Please fill in all required fields (Name, Email, Password)');
            return;
        }
        setCreating(true);
        try {
            const nameParts = newPorter.name.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];
            await adminAPI.createPorter({
                firstName,
                lastName,
                email: newPorter.email,
                password: newPorter.password,
                phoneNumber: newPorter.phoneNumber,
                hostelId: newPorter.hostelId || undefined,
            });
            alert('Porter created successfully!');
            setCreateDialogOpen(false);
            setNewPorter({ name: '', email: '', password: '', phoneNumber: '', hostelId: '' });
            loadData();
        }
        catch (error: unknown) {
            console.error('Failed to create porter:', error);
            const axiosError = error as {
                response?: {
                    data?: {
                        message?: string;
                        error?: string;
                    };
                };
            };
            const errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || 'Failed to create porter';
            alert(errorMessage);
        }
        finally {
            setCreating(false);
        }
    };
    const handleReassignClick = (porter: Porter) => {
        setSelectedPorter(porter);
        setSelectedHostelId(porter.assignedHostel?._id || porter.hostel?._id || '');
        setReassignDialogOpen(true);
    };
    const handleReassignHostel = async () => {
        if (!selectedPorter || !selectedHostelId) {
            alert('Please select a hostel');
            return;
        }
        setReassigning(true);
        try {
            await adminAPI.reassignHostel(selectedPorter._id, selectedHostelId);
            alert('Hostel assigned successfully!');
            setReassignDialogOpen(false);
            setSelectedPorter(null);
            setSelectedHostelId('');
            loadData();
        }
        catch (error: unknown) {
            console.error('Failed to assign hostel:', error);
            const axiosError = error as {
                response?: {
                    data?: {
                        message?: string;
                        error?: string;
                    };
                    status?: number;
                };
            };
            const errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || 'Failed to assign hostel';
            alert(`Error: ${errorMessage}`);
        }
        finally {
            setReassigning(false);
        }
    };
    const filteredPorters = porters.filter((porter) => {
        const matchesSearch = (porter.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (porter.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        return matchesSearch;
    });
    const stats = {
        total: porters.length,
        withHostels: porters.filter(p => p.assignedHostel || p.hostel).length,
        withoutHostels: porters.filter(p => !p.assignedHostel && !p.hostel).length,
    };
    const availableHostels = hostels.filter(h => !h.porter);
    if (loading) {
        return (<ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <div className="h-10 w-10 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin"/>
              <p className="text-sm text-muted-foreground">Loading porters…</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>);
    }
    return (<ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="space-y-6">
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Porter Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create porter accounts and manage hostel assignments
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4"/>
              Create Porter
            </Button>
          </div>

          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Porters</p>
                  <p className="mt-2 text-3xl font-bold text-violet-600">{stats.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">All porters</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30">
                  <UserCheck className="h-6 w-6 text-violet-600"/>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assigned to Hostels</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.withHostels}</p>
                  <p className="text-xs text-muted-foreground mt-1">With hostel</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                  <Building2 className="h-6 w-6 text-emerald-600"/>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Without Hostel</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">{stats.withoutHostels}</p>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting assignment</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                  <Search className="h-6 w-6 text-amber-600"/>
                </div>
              </div>
            </div>
          </div>

          
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl"/>
            </div>
          </div>

          
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-foreground">Porter List</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filteredPorters.length} porter{filteredPorters.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            {filteredPorters.length === 0 ? (<div className="text-center py-16">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <UserCheck className="h-7 w-7 text-muted-foreground"/>
                </div>
                <p className="font-semibold text-muted-foreground">No porters found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Create your first porter account</p>
              </div>) : (<Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-10 text-xs">#</TableHead>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Contact</TableHead>
                    <TableHead className="text-xs">Assigned Hostel</TableHead>
                    <TableHead className="text-xs">Created</TableHead>
                    <TableHead className="text-right text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPorters.map((porter, index) => (<TableRow key={porter._id} className="hover:bg-muted/20">
                      <TableCell className="text-muted-foreground text-sm">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-600">
                            {porter.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-medium text-sm">{porter.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3"/>
                            {porter.email}
                          </div>
                          {porter.phone && (<div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3"/>
                              {porter.phone}
                            </div>)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(porter.assignedHostel || porter.hostel) ? (<div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                              <Building2 className="h-3.5 w-3.5 text-emerald-600"/>
                            </div>
                            <span className="text-sm font-medium">{porter.assignedHostel?.name || porter.hostel?.name}</span>
                          </div>) : (<span className="text-xs text-muted-foreground italic bg-muted px-2 py-1 rounded-lg">Not assigned</span>)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(porter.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">
                        {(porter.assignedHostel || porter.hostel) ? (<Button size="sm" variant="outline" onClick={() => handleReassignClick(porter)} className="gap-1.5 rounded-xl text-xs">
                            <Building2 className="h-3.5 w-3.5"/>
                            Reassign
                          </Button>) : (<Button size="sm" onClick={() => handleReassignClick(porter)} className="gap-1.5 rounded-xl text-xs">
                            <Building2 className="h-3.5 w-3.5"/>
                            Assign Hostel
                          </Button>)}
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>)}
          </div>
        </div>

        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Porter</DialogTitle>
              <DialogDescription>
                Create a porter account and optionally assign to a hostel
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="porter-name">Name *</Label>
                <Input id="porter-name" placeholder="Enter porter name" value={newPorter.name} onChange={(e) => setNewPorter({ ...newPorter, name: e.target.value })}/>
              </div>

              <div className="space-y-2">
                <Label htmlFor="porter-email">Email *</Label>
                <Input id="porter-email" type="email" placeholder="Enter email address" value={newPorter.email} onChange={(e) => setNewPorter({ ...newPorter, email: e.target.value })}/>
              </div>

              <div className="space-y-2">
                <Label htmlFor="porter-password">Password *</Label>
                <Input id="porter-password" type="password" placeholder="Enter password" value={newPorter.password} onChange={(e) => setNewPorter({ ...newPorter, password: e.target.value })}/>
              </div>

              <div className="space-y-2">
                <Label htmlFor="porter-phone">Phone Number</Label>
                <Input id="porter-phone" placeholder="Enter phone number (optional)" value={newPorter.phoneNumber} onChange={(e) => setNewPorter({ ...newPorter, phoneNumber: e.target.value })}/>
              </div>

              <div className="space-y-2">
                <Label htmlFor="porter-hostel">Assign to Hostel (Optional)</Label>
                <Select value={newPorter.hostelId || undefined} onValueChange={(value) => setNewPorter({ ...newPorter, hostelId: value })}>
                  <SelectTrigger id="porter-hostel">
                    <SelectValue placeholder="No hostel (assign later)"/>
                  </SelectTrigger>
                  <SelectContent>
                    {availableHostels.map((hostel) => (<SelectItem key={hostel._id} value={hostel._id}>
                        {hostel.name} ({hostel.gender})
                      </SelectItem>))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  You can assign a hostel now or do it later
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => {
            setCreateDialogOpen(false);
            setNewPorter({ name: '', email: '', password: '', phoneNumber: '', hostelId: '' });
        }} className="flex-1" disabled={creating}>
                Cancel
              </Button>
              <Button onClick={handleCreatePorter} className="flex-1" disabled={!newPorter.name || !newPorter.email || !newPorter.password || creating}>
                {creating ? 'Creating...' : 'Create Porter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        
        <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Hostel</DialogTitle>
              <DialogDescription>
                Assign a hostel to {selectedPorter?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Porter Details</label>
                <div className="p-3 bg-muted rounded-lg space-y-1">
                  <p className="font-medium">{selectedPorter?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedPorter?.email}</p>
                  {selectedPorter?.hostel && (<p className="text-sm text-muted-foreground">
                      Current: <span className="font-medium">{selectedPorter.hostel.name}</span>
                    </p>)}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reassign-hostel">Select Hostel</Label>
                <Select value={selectedHostelId} onValueChange={setSelectedHostelId}>
                  <SelectTrigger id="reassign-hostel">
                    <SelectValue placeholder="Select a hostel"/>
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPorter?.hostel && (<SelectItem value={selectedPorter.hostel._id}>
                        {selectedPorter.hostel.name} (Current)
                      </SelectItem>)}
                    {availableHostels.map((hostel) => (<SelectItem key={hostel._id} value={hostel._id}>
                        {hostel.name} ({hostel.gender})
                      </SelectItem>))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select a hostel for this porter
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => {
            setReassignDialogOpen(false);
            setSelectedPorter(null);
            setSelectedHostelId('');
        }} className="flex-1" disabled={reassigning}>
                Cancel
              </Button>
              <Button onClick={handleReassignHostel} className="flex-1" disabled={!selectedHostelId || reassigning}>
                {reassigning ? 'Assigning...' : 'Assign Hostel'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>);
}
