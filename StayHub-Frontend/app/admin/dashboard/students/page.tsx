"use client";
import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Building2, Search, AlertCircle, CheckCircle, XCircle, Download, Upload, Edit, Trash2, Eye, Filter, RefreshCw, KeyRound, } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { EditStudentDialog } from "@/components/EditStudentDialog";
import { DeleteDepartmentDialog } from "@/components/DeleteDepartmentDialog";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { adminAPI } from "@/services/api";
import { toast } from "sonner";
interface Student {
    _id: string;
    firstName: string;
    lastName: string;
    matricNo: string;
    email: string;
    level: number;
    gender?: string;
    paymentStatus: string;
    reservationStatus?: string;
    isActive: boolean;
    college?: {
        _id: string;
        name: string;
        code: string;
    };
    department?: {
        _id: string;
        name: string;
        code: string;
    };
    assignedHostel?: {
        _id: string;
        name: string;
        code: string;
    };
    assignedRoom?: {
        _id: string;
        roomNumber: string;
    };
    invitationHistory?: Array<{
        action?: string;
        createdAt?: string;
    }>;
}
interface StudentImportError {
    row: number;
    matricNo: string;
    error: string;
    rowData?: Record<string, string>;
}
interface StudentImportSummary {
    totalRows: number;
    createdCount: number;
    failedCount: number;
    errors?: StudentImportError[];
}
function StudentsPageContent() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [levelFilter, setLevelFilter] = useState<string>("all");
    const [paymentFilter, setPaymentFilter] = useState<string>("all");
    const [collegeFilter, setCollegeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [viewLoginModalOpen, setViewLoginModalOpen] = useState(false);
    const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [studentToView, setStudentToView] = useState<Student | null>(null);
    const [studentToReset, setStudentToReset] = useState<Student | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
    const [importSummary, setImportSummary] = useState<StudentImportSummary | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<{
        id: string;
        name: string;
        matricNo: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    useEffect(() => {
        loadStudents();
    }, []);
    const loadStudents = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminAPI.getStudents({ limit: 5000 });
            setStudents(response.data.data || []);
        }
        catch (err) {
            console.error("Failed to load students:", err);
            setError("Failed to load students. Please try again.");
        }
        finally {
            setLoading(false);
        }
    };
    const filteredStudents = students.filter((student) => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch = student.firstName.toLowerCase().includes(query) ||
                student.lastName.toLowerCase().includes(query) ||
                student.matricNo.toLowerCase().includes(query) ||
                student.email.toLowerCase().includes(query) ||
                student.college?.name.toLowerCase().includes(query) ||
                student.department?.name.toLowerCase().includes(query);
            if (!matchesSearch)
                return false;
        }
        if (levelFilter !== "all" && student.level.toString() !== levelFilter) {
            return false;
        }
        if (paymentFilter !== "all" && student.paymentStatus !== paymentFilter) {
            return false;
        }
        if (collegeFilter !== "all" && student.college?._id !== collegeFilter) {
            return false;
        }
        if (statusFilter !== "all") {
            if (statusFilter === "active" && !student.isActive)
                return false;
            if (statusFilter === "inactive" && student.isActive)
                return false;
        }
        return true;
    });
    const colleges = Array.from(new Map(students
        .filter((s) => s.college)
        .map((s) => [s.college!._id, s.college!])).values());
    const stats = {
        total: students.length,
        active: students.filter((s) => s.isActive).length,
        inactive: students.filter((s) => !s.isActive).length,
        paid: students.filter((s) => s.paymentStatus === "paid").length,
        pending: students.filter((s) => s.paymentStatus === "pending").length,
        assigned: students.filter((s) => s.assignedHostel && s.assignedRoom).length,
        unassigned: students.filter((s) => !s.assignedHostel || !s.assignedRoom).length,
        pendingInvites: students.filter((s) => s.reservationStatus === "temporary").length,
        inviteActivity: students.filter((s) => (s.invitationHistory?.length || 0) > 0).length,
    };
    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case "paid":
                return "bg-green-500/10 text-green-600 border-green-500/20";
            case "pending":
                return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
            case "failed":
                return "bg-red-500/10 text-red-600 border-red-500/20";
            default:
                return "bg-gray-500/10 text-gray-600 border-gray-500/20";
        }
    };
    const handleEditClick = (student: Student) => {
        setStudentToEdit(student);
        setEditModalOpen(true);
    };
    const handleEditSuccess = async () => {
        await loadStudents();
    };
    const handleResetPasswordClick = (student: Student) => {
        setStudentToReset(student);
        setNewPassword("");
        setShowNewPassword(false);
        setResetPasswordModalOpen(true);
    };
    const generateRandomPassword = () => {
        const firstName = studentToReset?.firstName || 'Student';
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setNewPassword(`${firstName}${randomNum}`);
    };
    const handleResetPasswordConfirm = async () => {
        if (!studentToReset || !newPassword) {
            toast.error("Please enter a new password");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setIsResetting(true);
        try {
            console.log("Resetting password for student:", studentToReset._id);
            console.log("Using dedicated password reset endpoint");
            await adminAPI.updateStudentPassword(studentToReset._id, newPassword);
            const credentials = `
Password Reset Successful!

Student: ${studentToReset.firstName} ${studentToReset.lastName}
Email: ${studentToReset.email}
Matric No: ${studentToReset.matricNo}
New Password: ${newPassword}

The student can now login with their email/matric number and this new password.
      `.trim();
            console.log(credentials);
            alert(credentials);
            toast.success("Password reset successfully!");
            setResetPasswordModalOpen(false);
            setStudentToReset(null);
            setNewPassword("");
        }
        catch (error: unknown) {
            console.error("Failed to reset password:", error);
            const err = error as {
                response?: {
                    status?: number;
                    data?: {
                        message?: string;
                        error?: string;
                    };
                };
                message?: string;
                code?: string;
            };
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                const credentials = `
⚠️ Password Reset - Request Timed Out (60+ seconds)

Student: ${studentToReset.firstName} ${studentToReset.lastName}
Email: ${studentToReset.email}
Matric No: ${studentToReset.matricNo}
Attempted Password: ${newPassword}

NEXT STEPS:
1. Wait 3-5 minutes for backend to finish processing
2. Try logging in with the credentials above
3. If login works: Password was successfully updated!
4. If login fails: The update timed out - try resetting again

⚠️ BACKEND ISSUE DETECTED:
The backend is taking over 60 seconds to hash passwords.

TO FIX THE BACKEND:
1. Open your Student model/schema file
2. Find the password hashing code (bcrypt.hash or similar)
3. Reduce bcrypt rounds from current value to 10
   Example: bcrypt.hash(password, 10) // Use 10 rounds, not 15-20
4. Restart your backend server

Current backend behavior is abnormal - password hashing should take <1 second.
        `.trim();
                console.warn(credentials);
                alert(credentials);
                toast.warning("Backend timeout! Password may still be updating. Wait 3-5 minutes then try logging in.", { duration: 10000 });
                setResetPasswordModalOpen(false);
                setNewPassword("");
            }
            else {
                toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to reset password. Check backend console.", { duration: 5000 });
            }
        }
        finally {
            setIsResetting(false);
        }
    };
    const handleDeleteClick = (id: string, firstName: string, lastName: string, matricNo: string) => {
        setStudentToDelete({ id, name: `${firstName} ${lastName}`, matricNo });
        setDeleteModalOpen(true);
    };
    const handleDeleteConfirm = async () => {
        if (!studentToDelete)
            return;
        setIsDeleting(true);
        try {
            console.log("Force deleting student:", studentToDelete.id);
            await adminAPI.forceDeleteStudent(studentToDelete.id);
            console.log("Student force deleted successfully");
            toast.success("Student deleted successfully");
            setDeleteModalOpen(false);
            setStudentToDelete(null);
            await loadStudents();
        }
        catch (err: unknown) {
            console.error("Failed to delete student:", err);
            const error = err as {
                code?: string;
                response?: {
                    data?: {
                        message?: string;
                    };
                };
            };
            if (error.code === 'ECONNABORTED') {
                toast.error("Delete timeout. The backend is processing - check backend console. The student may have been deleted.", { duration: 8000 });
            }
            else {
                toast.error(error.response?.data?.message || "Failed to delete student");
            }
            setError("Failed to delete student. Please try again.");
        }
        finally {
            setIsDeleting(false);
        }
    };
    const clearFilters = () => {
        setSearchQuery("");
        setLevelFilter("all");
        setPaymentFilter("all");
        setCollegeFilter("all");
        setStatusFilter("all");
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
    const buildStudentExportFilename = () => {
        const datePart = new Date().toISOString().split("T")[0];
        const collegeCode = collegeFilter !== "all"
            ? colleges.find((college) => college._id === collegeFilter)?.code
            : "";
        const filterParts = [
            searchQuery ? `search-${slugifyFilenamePart(searchQuery)}` : "",
            levelFilter !== "all" ? `level-${levelFilter}` : "",
            paymentFilter !== "all" ? `payment-${paymentFilter}` : "",
            collegeCode ? `college-${slugifyFilenamePart(collegeCode)}` : "",
            statusFilter !== "all" ? `status-${statusFilter}` : "",
        ].filter(Boolean);
        return `students_export_${datePart}${filterParts.length ? `_${filterParts.join("_")}` : ""}.csv`;
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
        const filename = `student_import_failed_rows_${new Date().toISOString().split("T")[0]}.csv`;
        downloadBlob(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }), filename);
        toast.success("Failed rows CSV downloaded");
    };
    const handleExportStudents = () => {
        if (filteredStudents.length === 0) {
            toast.error("There are no students to export");
            return;
        }
        try {
            setIsExporting(true);
            const headers = [
                "firstName",
                "lastName",
                "matricNo",
                "email",
                "level",
                "gender",
                "collegeCode",
                "collegeName",
                "departmentCode",
                "departmentName",
                "paymentStatus",
                "reservationStatus",
                "hostelCode",
                "hostelName",
                "roomNumber",
                "isActive",
            ];
            const csvRows = filteredStudents.map((student) => ({
                firstName: student.firstName,
                lastName: student.lastName,
                matricNo: student.matricNo,
                email: student.email,
                level: student.level,
                gender: student.gender || "",
                collegeCode: student.college?.code || "",
                collegeName: student.college?.name || "",
                departmentCode: student.department?.code || "",
                departmentName: student.department?.name || "",
                paymentStatus: student.paymentStatus,
                reservationStatus: student.reservationStatus || "",
                hostelCode: student.assignedHostel?.code || "",
                hostelName: student.assignedHostel?.name || "",
                roomNumber: student.assignedRoom?.roomNumber || "",
                isActive: student.isActive ? "true" : "false",
            }));
            const csvContent = [
                headers.map(escapeCsvValue).join(","),
                ...csvRows.map((row) => headers.map((header) => escapeCsvValue(row[header as keyof typeof row])).join(",")),
            ].join("\n");
            downloadBlob(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }), buildStudentExportFilename());
            toast.success(`Exported ${filteredStudents.length} student record(s)`);
        }
        catch (error) {
            console.error("Failed to export students:", error);
            toast.error("Failed to export students");
        }
        finally {
            setIsExporting(false);
        }
    };
    const handleDownloadImportTemplate = async () => {
        try {
            const response = await adminAPI.downloadStudentImportTemplate();
            const filename = `student_import_template_${new Date().toISOString().split("T")[0]}.csv`;
            downloadBlob(response.data, filename);
            toast.success("Student import template downloaded");
        }
        catch (error) {
            console.error("Failed to download student import template:", error);
            toast.error("Failed to download the student import template");
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
    const handleImportStudents = async () => {
        if (!selectedImportFile) {
            toast.error("Please choose a CSV file to import");
            return;
        }
        try {
            setIsImporting(true);
            const formData = new FormData();
            formData.append("file", selectedImportFile);
            const response = await adminAPI.bulkUploadStudents(formData);
            const summary = response.data.data as StudentImportSummary | undefined;
            if (summary) {
                setImportSummary(summary);
            }
            if (summary?.failedCount) {
                toast.warning(response.data.message || "Student import completed with some row issues");
            }
            else {
                toast.success(response.data.message || "Student import completed");
            }
            await loadStudents();
        }
        catch (error: unknown) {
            console.error("Failed to import students:", error);
            const err = error as {
                response?: {
                    data?: {
                        message?: string;
                    };
                };
            };
            toast.error(err.response?.data?.message || "Failed to import students");
        }
        finally {
            setIsImporting(false);
        }
    };
    return (<div className="min-h-screen bg-background">
      
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground">Students Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage all students across colleges and departments
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadStudents} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}/>
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportStudents} disabled={isExporting || filteredStudents.length === 0}>
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
              <Button size="sm" onClick={() => setAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2"/>
                Add Student
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-5 h-5 text-blue-600"/>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600"/>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/10 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-600"/>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">Inactive</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600"/>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.paid}</p>
                <p className="text-xs text-muted-foreground">Paid</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600"/>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600"/>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.assigned}</p>
                <p className="text-xs text-muted-foreground">Assigned</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600"/>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.unassigned}</p>
                <p className="text-xs text-muted-foreground">Unassigned</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4 border shadow-none">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Invitation Activity</p>
              <p className="text-xs text-muted-foreground">
                Track group reservation approvals and pending invites across students.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Pending Invites: {stats.pendingInvites}
              </Badge>
              <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">
                Students With Invite History: {stats.inviteActivity}
              </Badge>
            </div>
          </div>
        </Card>

        
        <Card className="p-4 border shadow-none">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground"/>
                <span className="text-sm font-medium">Filters</span>
              </div>
              {(searchQuery || levelFilter !== "all" || paymentFilter !== "all" ||
            collegeFilter !== "all" || statusFilter !== "all") && (<Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                <Input placeholder="Search by name, matric no, email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9"/>
              </div>

              
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="100">100 Level</SelectItem>
                  <SelectItem value="200">200 Level</SelectItem>
                  <SelectItem value="300">300 Level</SelectItem>
                  <SelectItem value="400">400 Level</SelectItem>
                  <SelectItem value="500">500 Level</SelectItem>
                  <SelectItem value="600">600 Level</SelectItem>
                </SelectContent>
              </Select>

              
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Status"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            
            {colleges.length > 0 && (<Select value={collegeFilter} onValueChange={setCollegeFilter}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="All Colleges"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {colleges.map((college) => (<SelectItem key={college._id} value={college._id}>
                      {college.code} - {college.name}
                    </SelectItem>))}
                </SelectContent>
              </Select>)}
          </div>
        </Card>

        
        {error && (<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5"/>
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>)}

        
        <Card className="border shadow-none">
          <div className="overflow-x-auto">
            {loading ? (<div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3"/>
                <p className="text-sm text-muted-foreground">Loading students...</p>
              </div>) : filteredStudents.length === 0 ? (<div className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50"/>
                <h3 className="text-lg font-semibold text-foreground mb-2">No students found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || levelFilter !== "all" || paymentFilter !== "all" ||
                collegeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters to see more results"
                : "Get started by adding your first student"}
                </p>
                {!searchQuery && levelFilter === "all" && paymentFilter === "all" &&
                collegeFilter === "all" && statusFilter === "all" && (<Button onClick={() => router.push("/admin/dashboard/students/create")}>
                    <Plus className="w-4 h-4 mr-2"/>
                    Add First Student
                  </Button>)}
              </div>) : (<>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12 font-semibold">#</TableHead>
                      <TableHead className="font-semibold">Matric No</TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold hidden md:table-cell">Email</TableHead>
                      <TableHead className="font-semibold">College</TableHead>
                      <TableHead className="font-semibold hidden lg:table-cell">Department</TableHead>
                      <TableHead className="text-center font-semibold">Level</TableHead>
                      <TableHead className="text-center font-semibold">Payment</TableHead>
                      <TableHead className="text-center font-semibold hidden xl:table-cell">Hostel</TableHead>
                      <TableHead className="text-center font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student, index) => (<TableRow key={student._id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs font-semibold text-primary">
                            {student.matricNo}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {student.firstName} {student.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground md:hidden">
                              {student.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                          {student.email}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium">{student.college?.code}</span>
                            <span className="text-xs text-muted-foreground lg:hidden">
                              {student.department?.code}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm hidden lg:table-cell">
                          {student.department?.code}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs font-semibold">
                            {student.level}L
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`text-xs font-medium ${getPaymentStatusColor(student.paymentStatus)}`}>
                            {student.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-center hidden xl:table-cell">
                          {student.assignedHostel ? (<div className="flex flex-col">
                              {(() => {
                        const latestInvitation = student.invitationHistory?.length
                            ? student.invitationHistory[student.invitationHistory.length - 1]
                            : null;
                        return (<>
                              <span className="font-medium">{student.assignedHostel.name}</span>
                              <span className="text-xs text-muted-foreground">
                                Room {student.assignedRoom?.roomNumber || "-"}
                              </span>
                              {student.invitationHistory?.length ? (<>
                                  <span className="text-xs text-muted-foreground">
                                    Invites: {student.invitationHistory.length}
                                  </span>
                                  {latestInvitation?.action ? (<span className="text-xs text-muted-foreground">
                                      Latest: {latestInvitation.action}
                                    </span>) : null}
                                </>) : null}
                                  </>);
                    })()}
                            </div>) : (<span className="text-muted-foreground">-</span>)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={student.isActive ? "default" : "secondary"} className="text-xs">
                            {student.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-500/10 hover:text-blue-600" onClick={() => {
                    setStudentToView(student);
                    setViewLoginModalOpen(true);
                }} aria-label="View Login Details" title="View Login Details">
                              <Eye className="w-3.5 h-3.5"/>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" onClick={() => handleEditClick(student)} aria-label="Edit Student" title="Edit Student">
                              <Edit className="w-3.5 h-3.5"/>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-orange-500/10 hover:text-orange-600" onClick={() => handleResetPasswordClick(student)} aria-label="Reset Password" title="Reset Password">
                              <KeyRound className="w-3.5 h-3.5"/>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteClick(student._id, student.firstName, student.lastName, student.matricNo)} aria-label="Delete Student" title="Delete Student">
                              <Trash2 className="w-3.5 h-3.5"/>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>

                
                <div className="px-4 py-3 border-t bg-muted/20">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{filteredStudents.length}</span> of{" "}
                    <span className="font-medium text-foreground">{students.length}</span> students
                  </p>
                </div>
              </>)}
          </div>
        </Card>
      </div>

      
      <EditStudentDialog open={editModalOpen} onOpenChange={setEditModalOpen} student={studentToEdit} onSuccess={handleEditSuccess}/>

      
      <AddStudentDialog open={addModalOpen} onOpenChange={setAddModalOpen} onSuccess={loadStudents}/>

      
      <Dialog open={importModalOpen} onOpenChange={(open) => {
            setImportModalOpen(open);
            if (!open) {
                resetImportState();
            }
        }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[90vh] overflow-hidden p-0">
          <div className="max-h-[90vh] overflow-y-auto p-6 pr-5">
            <DialogHeader className="pr-8">
              <DialogTitle>Import Students From CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file using college and department codes. We will validate each row and show any rows that need attention.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600"/>
              <AlertDescription className="text-blue-900 dark:text-blue-100 text-sm">
                Required columns: <strong>firstName</strong>, <strong>lastName</strong>, <strong>matricNo</strong>, <strong>email</strong>, <strong>level</strong>, <strong>gender</strong>, <strong>collegeCode</strong>, and <strong>departmentCode</strong>. The <strong>password</strong> column is optional.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Need the CSV format?</p>
                  <p className="text-xs text-muted-foreground">Download the template and replace the sample row with your real student records.</p>
                </div>
                <Button type="button" variant="outline" onClick={handleDownloadImportTemplate}>
                  <Download className="w-4 h-4 mr-2"/>
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-import-file">CSV File</Label>
                <Input id="student-import-file" type="file" accept=".csv,text/csv" onChange={handleImportFileChange}/>
                <p className="text-xs text-muted-foreground">
                  {selectedImportFile ? `Selected file: ${selectedImportFile.name}` : "Choose a CSV file to start the import."}
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
                            <TableHead>Matric No</TableHead>
                            <TableHead>Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importSummary.errors.map((issue) => (<TableRow key={`${issue.row}-${issue.matricNo}`}>
                              <TableCell>{issue.row}</TableCell>
                              <TableCell className="font-mono text-xs">{issue.matricNo}</TableCell>
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
              <Button className="flex-1" onClick={handleImportStudents} disabled={isImporting || !selectedImportFile}>
                <Upload className="w-4 h-4 mr-2"/>
                {isImporting ? "Importing..." : "Import Students"}
              </Button>
            </div>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      
      <Dialog open={viewLoginModalOpen} onOpenChange={setViewLoginModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student Login Details</DialogTitle>
            <DialogDescription>
              Credentials for {studentToView?.firstName} {studentToView?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {studentToView && (<div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Student Name</Label>
                  <p className="font-medium">{studentToView.firstName} {studentToView.lastName}</p>
                </div>
                
                <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                  <Label className="text-xs text-muted-foreground">Login Options</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-sm">
                        {studentToView.email}
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Matric No:</span>
                      <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-sm">
                        {studentToView.matricNo}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                  <Label className="text-xs text-muted-foreground mb-2 block">How to Login</Label>
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">The student can use <strong>either</strong> their email or matric number as username along with their password.</p>
                  </div>
                </div>
              </div>

              <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600"/>
                <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
                  <strong>Note:</strong> For security reasons, passwords are not displayed. If the student has forgotten their password, use the password reset feature.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => {
                navigator.clipboard.writeText(studentToView.email);
                toast.success('Email copied to clipboard');
            }}>
                  Copy Email
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => {
                navigator.clipboard.writeText(studentToView.matricNo);
                toast.success('Matric number copied to clipboard');
            }}>
                  Copy Matric No
                </Button>
              </div>
            </div>)}
        </DialogContent>
      </Dialog>

      
      <Dialog open={resetPasswordModalOpen} onOpenChange={setResetPasswordModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Student Password</DialogTitle>
            <DialogDescription>
              Reset password for {studentToReset?.firstName} {studentToReset?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {studentToReset && (<div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Student</Label>
                  <p className="font-medium">{studentToReset.firstName} {studentToReset.lastName}</p>
                  <p className="text-sm text-muted-foreground">{studentToReset.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  New Password <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input id="newPassword" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password"/>
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showNewPassword ? (<XCircle className="h-4 w-4"/>) : (<Eye className="h-4 w-4"/>)}
                    </button>
                  </div>
                  <Button type="button" variant="outline" onClick={generateRandomPassword}>
                    <RefreshCw className="h-4 w-4"/>
                  </Button>
                </div>
                {newPassword && newPassword.length < 6 && (<p className="text-xs text-red-500">Password must be at least 6 characters</p>)}
              </div>

              <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600"/>
                <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
                  <strong>Important:</strong> Make sure to save the new password and share it with the student. They will need it to login.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => {
                setResetPasswordModalOpen(false);
                setNewPassword("");
                setStudentToReset(null);
            }} disabled={isResetting}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleResetPasswordConfirm} disabled={isResetting || !newPassword || newPassword.length < 6}>
                  {isResetting ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </div>)}
        </DialogContent>
      </Dialog>

      
      <DeleteDepartmentDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen} onConfirm={handleDeleteConfirm} departmentName={studentToDelete?.name} departmentCode={studentToDelete?.matricNo} isDeleting={isDeleting}/>
    </div>);
}
export default function StudentsPage() {
    return (<ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <StudentsPageContent />
      </DashboardLayout>
    </ProtectedRoute>);
}
