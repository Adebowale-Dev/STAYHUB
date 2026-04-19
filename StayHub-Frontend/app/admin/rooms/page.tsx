"use client";
import { ChangeEvent, useEffect, useState } from "react";
import { Plus, DoorOpen, Search, AlertCircle, CheckCircle, Users, Building2, Download, Upload, Edit, Trash2, RefreshCw, Bed, } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { adminAPI } from "@/services/api";
import { AddRoomDialog } from "@/components/AddRoomDialog";
import { EditRoomDialog } from "@/components/EditRoomDialog";
import { toast } from "sonner";
interface Hostel {
    _id: string;
    name: string;
    gender: "male" | "female" | "mixed";
    totalRooms?: number;
    level?: number;
}
interface Room {
    _id: string;
    roomNumber: string;
    hostel: {
        _id: string;
        name: string;
        gender?: "male" | "female" | "mixed";
    };
    capacity: number;
    currentOccupants: number;
    level: number;
    status?: string;
    isActive: boolean;
    totalBunks?: number;
    availableSpaces?: number;
    students?: Array<{
        _id: string;
        firstName: string;
        lastName: string;
        matricNumber: string;
    }>;
    floor?: number;
}
interface HostelWithRooms {
    hostel: Hostel;
    rooms: Room[];
    stats: {
        total: number;
        male: number;
        female: number;
        mixed: number;
        available: number;
        occupied: number;
        totalCapacity: number;
        currentOccupancy: number;
    };
}
interface RoomImportError {
    row: number;
    roomNumber?: string;
    error: string;
    rowData?: Record<string, string>;
}
interface RoomImportSummary {
    totalRows: number;
    createdCount: number;
    failedCount: number;
    errors?: RoomImportError[];
}
function RoomsPageContent() {
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [genderFilter, setGenderFilter] = useState<string>("all");
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
    const [importSummary, setImportSummary] = useState<RoomImportSummary | null>(null);
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [hostelsResponse, roomsResponse] = await Promise.all([
                adminAPI.getHostels(),
                adminAPI.getRooms(),
            ]);
            console.log("Hostels API response:", hostelsResponse.data);
            console.log("Rooms API response:", roomsResponse.data);
            const hostelsData = hostelsResponse.data.data || hostelsResponse.data;
            const roomsData = roomsResponse.data.data || roomsResponse.data;
            console.log("Parsed rooms data:", roomsData);
            if (roomsData.length > 0) {
                console.log("First room structure:", roomsData[0]);
                console.log("All room keys:", Object.keys(roomsData[0]));
                console.log("Room fields:", {
                    gender: roomsData[0].gender,
                    floor: roomsData[0].floor,
                    level: roomsData[0].level,
                    currentOccupants: roomsData[0].currentOccupants,
                    capacity: roomsData[0].capacity,
                    roomType: roomsData[0].roomType,
                    isAvailable: roomsData[0].isAvailable
                });
            }
            setHostels(Array.isArray(hostelsData) ? hostelsData : []);
            setRooms(Array.isArray(roomsData) ? roomsData : []);
        }
        catch (err) {
            console.error("Error loading data:", err);
            setError("Failed to load data. Please try again.");
        }
        finally {
            setLoading(false);
        }
    };
    const groupedData: HostelWithRooms[] = hostels.map((hostel) => {
        const hostelRooms = rooms
            .filter((room) => room.hostel?._id === hostel._id)
            .sort((a, b) => {
            const numA = parseInt(a.roomNumber.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.roomNumber.replace(/\D/g, '')) || 0;
            if (numA !== numB) {
                return numA - numB;
            }
            return a.roomNumber.localeCompare(b.roomNumber);
        });
        return {
            hostel,
            rooms: hostelRooms,
            stats: {
                total: hostelRooms.length,
                male: hostelRooms.filter((r) => r.hostel?.gender === "male").length,
                female: hostelRooms.filter((r) => r.hostel?.gender === "female").length,
                mixed: hostelRooms.filter((r) => r.hostel?.gender === "mixed").length,
                available: hostelRooms.filter((r) => (r.availableSpaces ?? 0) > 0).length,
                occupied: hostelRooms.filter((r) => (r.currentOccupants ?? 0) > 0).length,
                totalCapacity: hostelRooms.reduce((sum, r) => sum + (r.capacity || 0), 0),
                currentOccupancy: hostelRooms.reduce((sum, r) => sum + (r.currentOccupants || 0), 0),
            },
        };
    });
    const globalStats = {
        totalHostels: hostels.length,
        totalRooms: rooms.length,
        available: rooms.filter((r) => (r.availableSpaces ?? 0) > 0).length,
        occupied: rooms.filter((r) => (r.currentOccupants ?? 0) > 0).length,
        male: rooms.filter((r) => r.hostel?.gender === "male").length,
        female: rooms.filter((r) => r.hostel?.gender === "female").length,
        mixed: rooms.filter((r) => r.hostel?.gender === "mixed").length,
        totalCapacity: rooms.reduce((sum, r) => sum + (r.capacity || 0), 0),
        currentOccupancy: rooms.reduce((sum, r) => sum + (r.currentOccupants || 0), 0),
    };
    const filteredGroupedData = groupedData
        .filter((group) => {
        const matchesSearch = group.hostel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.rooms.some((room) => room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesGender = genderFilter === "all" || group.hostel.gender === genderFilter;
        return matchesSearch && matchesGender;
    })
        .filter((group) => group.rooms.length > 0 || searchQuery === "");
    const filteredRooms = filteredGroupedData.flatMap((group) => group.rooms);
    const getGenderBadgeColor = (gender: string) => {
        switch (gender) {
            case "male":
                return "bg-blue-500/10 text-blue-600 border-blue-500/20";
            case "female":
                return "bg-pink-500/10 text-pink-600 border-pink-500/20";
            case "mixed":
                return "bg-purple-500/10 text-purple-600 border-purple-500/20";
            default:
                return "bg-gray-500/10 text-gray-600 border-gray-500/20";
        }
    };
    const getOccupancyColor = (room: Room) => {
        const currentOcc = room.currentOccupants || 0;
        const capacity = room.capacity || 1;
        const percentage = capacity > 0 ? (currentOcc / capacity) * 100 : 0;
        if (percentage >= 100)
            return "text-red-600";
        if (percentage >= 75)
            return "text-yellow-600";
        if (percentage > 0)
            return "text-blue-600";
        return "text-green-600";
    };
    const clearFilters = () => {
        setSearchQuery("");
        setGenderFilter("all");
    };
    const downloadBlob = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };
    const escapeCsvValue = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const slugifyFilenamePart = (value: string) => value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 32);
    const buildRoomExportFilename = () => {
        const datePart = new Date().toISOString().split("T")[0];
        const filterParts = [
            searchQuery ? `search-${slugifyFilenamePart(searchQuery)}` : "",
            genderFilter !== "all" ? `gender-${genderFilter}` : "",
        ].filter(Boolean);
        return `rooms_export_${datePart}${filterParts.length ? `_${filterParts.join("_")}` : ""}.csv`;
    };
    const downloadFailedRowsCsv = () => {
        const issues = importSummary?.errors;
        if (!issues || issues.length === 0) {
            toast.error("There are no failed rows to download");
            return;
        }
        const rowHeaders = Array.from(new Set(issues.flatMap((issue) => Object.keys(issue.rowData || {}))));
        const headers = ["row", ...rowHeaders, "error"];
        const csvContent = [
            headers.map(escapeCsvValue).join(","),
            ...issues.map((issue) => headers.map((header) => {
                if (header === "row") {
                    return escapeCsvValue(issue.row);
                }
                if (header === "error") {
                    return escapeCsvValue(issue.error);
                }
                return escapeCsvValue(issue.rowData?.[header] || "");
            }).join(",")),
        ].join("\n");
        downloadBlob(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }), `room_import_failed_rows_${new Date().toISOString().split("T")[0]}.csv`);
        toast.success("Failed rows CSV downloaded");
    };
    const handleExportRooms = () => {
        if (filteredRooms.length === 0) {
            toast.error("There are no rooms to export");
            return;
        }
        try {
            setIsExporting(true);
            const headers = [
                "roomNumber",
                "hostelName",
                "hostelGender",
                "level",
                "floor",
                "capacity",
                "currentOccupants",
                "availableSpaces",
                "status",
                "isActive",
            ];
            const rows = filteredRooms.map((room) => ({
                roomNumber: room.roomNumber,
                hostelName: room.hostel?.name || "",
                hostelGender: room.hostel?.gender || "",
                level: room.level,
                floor: room.floor ?? "",
                capacity: room.capacity,
                currentOccupants: room.currentOccupants || 0,
                availableSpaces: room.availableSpaces ?? (room.capacity - (room.currentOccupants || 0)),
                status: room.status || "",
                isActive: room.isActive ? "true" : "false",
            }));
            const csvContent = [
                headers.map(escapeCsvValue).join(","),
                ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header as keyof typeof row])).join(",")),
            ].join("\n");
            downloadBlob(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }), buildRoomExportFilename());
            toast.success(`Exported ${filteredRooms.length} room record(s)`);
        }
        catch (err) {
            console.error("Failed to export rooms:", err);
            toast.error("Failed to export rooms");
        }
        finally {
            setIsExporting(false);
        }
    };
    const handleDownloadImportTemplate = async () => {
        try {
            const response = await adminAPI.downloadRoomImportTemplate();
            downloadBlob(response.data, `room_import_template_${new Date().toISOString().split("T")[0]}.csv`);
            toast.success("Room import template downloaded");
        }
        catch (err) {
            console.error("Failed to download room import template:", err);
            toast.error("Failed to download the room import template");
        }
    };
    const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setSelectedImportFile(file);
        setImportSummary(null);
    };
    const resetImportState = () => {
        setSelectedImportFile(null);
        setImportSummary(null);
        setIsImporting(false);
    };
    const handleImportRooms = async () => {
        if (!selectedImportFile) {
            toast.error("Please choose a CSV file to import");
            return;
        }
        try {
            setIsImporting(true);
            const formData = new FormData();
            formData.append("file", selectedImportFile);
            const response = await adminAPI.bulkUploadRooms(formData);
            const summary = response.data.data as RoomImportSummary | undefined;
            if (summary) {
                setImportSummary(summary);
            }
            if (summary?.failedCount) {
                toast.warning(response.data.message || "Room import completed with some row issues");
            }
            else {
                toast.success(response.data.message || "Room import completed");
            }
            await loadData();
        }
        catch (err: unknown) {
            console.error("Failed to import rooms:", err);
            const error = err as {
                response?: {
                    data?: {
                        message?: string;
                    };
                };
            };
            toast.error(error.response?.data?.message || "Failed to import rooms");
        }
        finally {
            setIsImporting(false);
        }
    };
    const handleEditClick = (room: Room) => {
        setRoomToEdit(room);
        setEditModalOpen(true);
    };
    const handleEditSuccess = () => {
        loadData();
    };
    const handleDeleteClick = (room: Room) => {
        setRoomToDelete(room);
        setDeleteDialogOpen(true);
    };
    const handleDeleteConfirm = async () => {
        if (!roomToDelete)
            return;
        setDeleting(true);
        try {
            await adminAPI.deleteRoom(roomToDelete._id);
            await loadData();
            setDeleteDialogOpen(false);
            setRoomToDelete(null);
            alert(`Room ${roomToDelete.roomNumber} deleted successfully`);
        }
        catch (err) {
            console.error("Error deleting room:", err);
            if (err && typeof err === "object" && "response" in err) {
                const axiosError = err as {
                    response?: {
                        status?: number;
                        data?: {
                            message?: string;
                        };
                    };
                };
                if (axiosError.response?.status === 404) {
                    alert("❌ Room deletion is not yet supported by the backend.\n\nThe backend needs to implement: DELETE /api/admin/rooms/:id\n\nPlease contact the backend team.");
                    setDeleteDialogOpen(false);
                    return;
                }
            }
            const errorMessage = "Failed to delete room. Please try again.";
            alert(errorMessage);
        }
        finally {
            setDeleting(false);
        }
    };
    return (<div className="min-h-screen bg-background">
      
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground">Rooms Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage all rooms and their occupancy
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}/>
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportRooms} disabled={isExporting || filteredRooms.length === 0}>
                <Download className="w-4 h-4 mr-2"/>
                {isExporting ? "Exporting..." : "Export"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                resetImportState();
                setImportModalOpen(true);
            }}>
                <Upload className="w-4 h-4 mr-2"/>
                Import
              </Button>
              <Button size="sm" onClick={() => setAddModalOpen(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2"/>
                Add Room
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{globalStats.totalRooms}</p>
                <p className="text-xs text-muted-foreground">Total Rooms</p>
              </div>
              <DoorOpen className="w-8 h-8 text-blue-500 opacity-80"/>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{globalStats.available}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-80"/>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-600">{globalStats.occupied}</p>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-500 opacity-80"/>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{globalStats.male}</p>
                <p className="text-xs text-muted-foreground">Male</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-80"/>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-pink-600">{globalStats.female}</p>
                <p className="text-xs text-muted-foreground">Female</p>
              </div>
              <Users className="w-8 h-8 text-pink-500 opacity-80"/>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{globalStats.totalCapacity}</p>
                <p className="text-xs text-muted-foreground">Capacity</p>
              </div>
              <Bed className="w-8 h-8 text-purple-500 opacity-80"/>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {globalStats.totalCapacity > 0
            ? Math.round((globalStats.currentOccupancy / globalStats.totalCapacity) * 100)
            : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Occupancy</p>
              </div>
              <Building2 className="w-8 h-8 text-orange-500 opacity-80"/>
            </div>
          </Card>
        </div>

        
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"/>
                  <Input placeholder="Search by room number or hostel name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/>
                </div>
              </div>

              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-full md:w-36">
                  <Users className="w-4 h-4 mr-2"/>
                  <SelectValue placeholder="Gender"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>

              {(searchQuery || genderFilter !== "all") && (<Button variant="outline" size="sm" onClick={clearFilters} className="whitespace-nowrap">
                  Clear Filters
                </Button>)}
            </div>
          </div>
        </Card>

        
        <Card>
          <div className="relative">
            {loading && (<div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary"/>
                  <p className="text-sm text-muted-foreground">Loading rooms...</p>
                </div>
              </div>)}

            {error && (<div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4"/>
                <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadData} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2"/>
                  Try Again
                </Button>
              </div>)}

            {!loading && !error && hostels.length === 0 && (<div className="p-12 text-center">
                <Building2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4"/>
                <h3 className="text-lg font-semibold mb-2">No Hostels Found</h3>
                <p className="text-muted-foreground mb-4">
                  Create hostels first before adding rooms
                </p>
              </div>)}

            {!loading && !error && filteredGroupedData.length === 0 && hostels.length > 0 && (<div className="p-12 text-center">
                <Search className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4"/>
                <h3 className="text-lg font-semibold mb-2">No Hostels Match Your Filters</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear All Filters
                </Button>
              </div>)}

            {!loading && !error && filteredGroupedData.length > 0 && (<Accordion type="multiple" className="w-full">
                {filteredGroupedData.map((group) => (<AccordionItem key={group.hostel._id} value={group.hostel._id}>
                    <AccordionTrigger className="px-4 py-4 hover:bg-muted/50 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-primary"/>
                          <div className="text-left">
                            <h3 className="font-semibold text-base">{group.hostel.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={`text-xs capitalize ${getGenderBadgeColor(group.hostel.gender)}`}>
                                {group.hostel.gender}
                              </Badge>
                              {group.hostel.level && (<Badge variant="secondary" className="text-xs">
                                  {group.hostel.level}L
                                </Badge>)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-bold text-lg">{group.stats.total}</p>
                            <p className="text-xs text-muted-foreground">Total Rooms</p>
                          </div>
                          
                          
                          {(group.hostel.gender === 'male' || group.hostel.gender === 'mixed') && (<div className="text-center">
                              <p className="font-bold text-lg text-blue-600">{group.stats.male}</p>
                              <p className="text-xs text-muted-foreground">Male</p>
                            </div>)}
                          
                          
                          {(group.hostel.gender === 'female' || group.hostel.gender === 'mixed') && (<div className="text-center">
                              <p className="font-bold text-lg text-pink-600">{group.stats.female}</p>
                              <p className="text-xs text-muted-foreground">Female</p>
                            </div>)}
                          
                          
                          {group.stats.mixed > 0 && (<div className="text-center">
                              <p className="font-bold text-lg text-purple-600">{group.stats.mixed}</p>
                              <p className="text-xs text-muted-foreground">Mixed</p>
                            </div>)}
                          
                          <div className="text-center">
                            <p className="font-bold text-lg text-green-600">{group.stats.available}</p>
                            <p className="text-xs text-muted-foreground">Available</p>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {group.rooms.length === 0 ? (<div className="py-8 text-center text-muted-foreground">
                          <DoorOpen className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                          <p>No rooms in this hostel yet</p>
                        </div>) : (<Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Room Number</TableHead>
                              <TableHead className="text-center">Level</TableHead>
                              <TableHead className="text-center">Occupancy</TableHead>
                              <TableHead className="text-center">Spaces Left</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.rooms.map((room, index) => (<TableRow key={room._id} className="hover:bg-muted/20">
                                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                <TableCell className="font-semibold">
                                  <div className="flex items-center gap-2">
                                    <DoorOpen className="w-4 h-4 text-muted-foreground"/>
                                    {room.roomNumber}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary" className="text-xs">
                                    {group.hostel.level || room.level}L
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className={`text-sm font-bold ${getOccupancyColor(room)}`}>
                                      {room.currentOccupants || 0}/{room.capacity || 0}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {room.capacity > 0
                            ? `${Math.round(((room.currentOccupants || 0) / room.capacity) * 100)}%`
                            : "0%"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="text-sm font-semibold text-green-600">
                                    {room.availableSpaces ?? (room.capacity - (room.currentOccupants || 0))}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={room.status === 'available' || (room.availableSpaces ?? 0) > 0 ? "default" : "secondary"} className="text-xs capitalize">
                                    {room.status || ((room.availableSpaces ?? 0) > 0 ? 'Available' : 'Full')}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" onClick={() => handleEditClick(room)}>
                                      <Edit className="w-3.5 h-3.5"/>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteClick(room)}>
                                      <Trash2 className="w-3.5 h-3.5"/>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>))}
                          </TableBody>
                        </Table>)}
                    </AccordionContent>
                  </AccordionItem>))}
              </Accordion>)}
          </div>
        </Card>
      </div>

      
      <AddRoomDialog open={addModalOpen} onOpenChange={setAddModalOpen} onSuccess={loadData}/>

      
      <Dialog open={importModalOpen} onOpenChange={(open) => {
            setImportModalOpen(open);
            if (!open) {
                resetImportState();
            }
        }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[90vh] overflow-hidden p-0">
          <div className="max-h-[90vh] overflow-y-auto p-6 pr-5">
            <DialogHeader className="pr-8">
              <DialogTitle>Import Rooms From CSV</DialogTitle>
              <DialogDescription>
                Upload rooms in bulk with a CSV file. Each row is validated, and failed rows can be downloaded for correction.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600"/>
              <AlertDescription className="text-blue-900 dark:text-blue-100 text-sm">
                Required columns: <strong>roomNumber</strong>, <strong>hostelName</strong>, <strong>level</strong>, and <strong>capacity</strong>. <strong>floor</strong> is optional.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Need the room CSV format?</p>
                  <p className="text-xs text-muted-foreground">Download the template, update the sample row, and upload your room list.</p>
                </div>
                <Button type="button" variant="outline" onClick={handleDownloadImportTemplate}>
                  <Download className="w-4 h-4 mr-2"/>
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="room-import-file">CSV File</Label>
                <Input id="room-import-file" type="file" accept=".csv,text/csv" onChange={handleImportFileChange}/>
                <p className="text-xs text-muted-foreground">
                  {selectedImportFile ? `Selected file: ${selectedImportFile.name}` : "Choose a CSV file to start the room import."}
                </p>
              </div>
            </div>

            {importSummary && (<div className="rounded-lg border bg-background p-4 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Card className="p-3 border shadow-none">
                    <p className="text-xs text-muted-foreground">Rows Read</p>
                    <p className="text-2xl font-bold text-foreground">{importSummary.totalRows}</p>
                  </Card>
                  <Card className="p-3 border shadow-none">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-2xl font-bold text-green-600">{importSummary.createdCount}</p>
                  </Card>
                  <Card className="p-3 border shadow-none">
                    <p className="text-xs text-muted-foreground">Issues</p>
                    <p className="text-2xl font-bold text-amber-600">{importSummary.failedCount}</p>
                  </Card>
                </div>

                {importSummary.errors && importSummary.errors.length > 0 && (<div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-foreground">Rows that need attention</p>
                      <Button type="button" variant="outline" size="sm" onClick={downloadFailedRowsCsv}>
                        <Download className="w-4 h-4 mr-2"/>
                        Download Failed Rows CSV
                      </Button>
                    </div>
                    <div className="max-h-56 overflow-y-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Row</TableHead>
                            <TableHead>Room Number</TableHead>
                            <TableHead>Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importSummary.errors.map((issue) => (<TableRow key={`${issue.row}-${issue.roomNumber || issue.error}`}>
                              <TableCell>{issue.row}</TableCell>
                              <TableCell>{issue.roomNumber || "-"}</TableCell>
                              <TableCell>{issue.error}</TableCell>
                            </TableRow>))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>)}
              </div>)}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                resetImportState();
                setImportModalOpen(false);
            }} disabled={isImporting}>
                Close
              </Button>
              <Button className="flex-1" onClick={handleImportRooms} disabled={isImporting || !selectedImportFile}>
                <Upload className="w-4 h-4 mr-2"/>
                {isImporting ? "Importing..." : "Import Rooms"}
              </Button>
            </div>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      
      <EditRoomDialog open={editModalOpen} onOpenChange={setEditModalOpen} room={roomToEdit} onSuccess={handleEditSuccess}/>

      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5"/>
              Delete Room
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete room <span className="font-semibold">{roomToDelete?.roomNumber}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);
}
export default function RoomsPage() {
    return (<ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <RoomsPageContent />
      </DashboardLayout>
    </ProtectedRoute>);
}
