"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Users, GraduationCap, Building2, Loader2, AlertCircle, CheckCircle, XCircle, Search, Edit, Trash2, } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useCollegeStore } from "@/store/useCollegeStore";
import { EditStudentDialog } from "@/components/EditStudentDialog";
import { DeleteDepartmentDialog } from "@/components/DeleteDepartmentDialog";
function DepartmentStudentsContent() {
    const router = useRouter();
    const params = useParams();
    const collegeId = params.id as string;
    const deptId = params.deptId as string;
    const { currentStudents: students, studentsTotal: total, studentsTotalPages: totalPages, loading, error, fetchStudentsByDepartment, clearCurrentStudents, deleteStudent, } = useCollegeStore();
    const [college, setCollege] = useState<{
        name: string;
        code: string;
    } | null>(null);
    const [department, setDepartment] = useState<{
        name: string;
        code: string;
    } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [levelFilter, setLevelFilter] = useState<string>("all");
    const [paymentFilter, setPaymentFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<{
        _id: string;
        firstName: string;
        lastName: string;
        matricNo: string;
        email: string;
        level: number;
        phoneNumber?: string;
        gender?: string;
        paymentStatus: string;
    } | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<{
        id: string;
        name: string;
        matricNo: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    useEffect(() => {
        if (collegeId && deptId) {
            loadStudents();
        }
        return () => {
            clearCurrentStudents();
        };
    }, [collegeId, deptId, page, levelFilter, paymentFilter]);
    const loadStudents = async () => {
        try {
            const params: Record<string, unknown> = { page, limit: 50 };
            if (levelFilter !== "all")
                params.level = levelFilter;
            if (paymentFilter !== "all")
                params.paymentStatus = paymentFilter;
            const data = await fetchStudentsByDepartment(collegeId, deptId, params);
            if (data.college) {
                setCollege({ name: data.college.name, code: data.college.code });
            }
            if (data.department) {
                setDepartment({ name: data.department.name, code: data.department.code });
            }
        }
        catch (err) {
            console.error("Failed to load students:", err);
        }
    };
    const filteredStudents = students.filter((student) => {
        if (!searchQuery)
            return true;
        const query = searchQuery.toLowerCase();
        return (student.firstName.toLowerCase().includes(query) ||
            student.lastName.toLowerCase().includes(query) ||
            student.matricNo.toLowerCase().includes(query) ||
            student.email.toLowerCase().includes(query));
    });
    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case "paid":
                return "bg-green-500/10 text-green-600";
            case "pending":
                return "bg-yellow-500/10 text-yellow-600";
            case "failed":
                return "bg-red-500/10 text-red-600";
            default:
                return "bg-gray-500/10 text-gray-600";
        }
    };
    const handleEditClick = (student: typeof studentToEdit) => {
        setStudentToEdit(student);
        setEditModalOpen(true);
    };
    const handleEditSuccess = async () => {
        await loadStudents();
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
            await deleteStudent(studentToDelete.id, true);
            setDeleteModalOpen(false);
            setStudentToDelete(null);
            await loadStudents();
        }
        catch {
        }
        finally {
            setIsDeleting(false);
        }
    };
    if (loading && students.length === 0) {
        return (<div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground"/>
      </div>);
    }
    if (error && !college) {
        return (<div className="p-4">
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/colleges")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2"/>
          Back to Colleges
        </Button>
      </div>);
    }
    const paidStudents = students.filter((s) => s.paymentStatus === "paid").length;
    const unpaidStudents = total - paidStudents;
    return (<div className="min-h-screen bg-background">
      
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/colleges/${collegeId}`)} className="h-8">
              <ArrowLeft className="w-4 h-4 mr-1"/>
              Back
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
                <Building2 className="w-3 h-3"/>
                <span>{college?.name}</span>
                <span>›</span>
                <GraduationCap className="w-3 h-3"/>
                <span className="font-semibold text-primary">{department?.code}</span>
              </div>
              <h1 className="text-sm md:text-lg font-semibold text-foreground truncate">
                {department?.name} - Students
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-3 border shadow-none">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-4 h-4 text-blue-600"/>
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">{total}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 border shadow-none">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600"/>
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">
                  {paidStudents}
                </p>
                <p className="text-xs text-muted-foreground">Paid</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 border shadow-none">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <XCircle className="w-4 h-4 text-yellow-600"/>
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">
                  {unpaidStudents}
                </p>
                <p className="text-xs text-muted-foreground">Unpaid</p>
              </div>
            </div>
          </Card>
        </div>

        
        <Card className="p-3 border shadow-none">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"/>
              <Input placeholder="Search by name, matric no, or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 bg-background text-sm"/>
            </div>

            <div className="flex gap-2">
              <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="h-9 px-3 text-xs border rounded-md bg-background" aria-label="Filter by level">
                <option value="all">All Levels</option>
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
              </select>

              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="h-9 px-3 text-xs border rounded-md bg-background" aria-label="Filter by payment status">
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </Card>

        
        <Card className="border shadow-none">
          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (<div className="p-8 text-center text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-50"/>
                <p className="text-sm">
                  {searchQuery || levelFilter !== "all" || paymentFilter !== "all"
                ? "No students match your filters"
                : "No students in this department yet"}
                </p>
              </div>) : (<Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12 font-semibold">#</TableHead>
                    <TableHead className="font-semibold">Matric No</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Email</TableHead>
                    <TableHead className="text-center font-semibold">Level</TableHead>
                    <TableHead className="text-center font-semibold">Payment</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Hostel</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Room</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => (<TableRow key={student._id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-muted-foreground">
                        {(page - 1) * 50 + index + 1}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-primary">
                          {student.matricNo}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-sm">{student.firstName} {student.lastName}</span>
                          <span className="text-xs text-muted-foreground md:hidden">{student.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                        {student.email}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs font-semibold">
                          {student.level}L
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {student.paymentStatus === "paid" ? (<CheckCircle className="w-3.5 h-3.5 text-green-600"/>) : (<XCircle className="w-3.5 h-3.5 text-yellow-600"/>)}
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPaymentStatusColor(student.paymentStatus)}`}>
                            {student.paymentStatus}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">
                        {student.assignedHostel?.name || (<span className="text-muted-foreground">-</span>)}
                      </TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">
                        {student.assignedRoom?.roomNumber || (<span className="text-muted-foreground">-</span>)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" onClick={() => handleEditClick(student)} aria-label="Edit Student">
                            <Edit className="w-3.5 h-3.5"/>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteClick(student._id, student.firstName, student.lastName, student.matricNo)} aria-label="Delete Student">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>)}
          </div>

          
          {totalPages > 1 && (<div className="p-4 border-t flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} ({total} total students)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-8">
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8">
                  Next
                </Button>
              </div>
            </div>)}
        </Card>
      </div>

      
      <EditStudentDialog open={editModalOpen} onOpenChange={setEditModalOpen} student={studentToEdit} onSuccess={handleEditSuccess}/>

      
      <DeleteDepartmentDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen} onConfirm={handleDeleteConfirm} departmentName={studentToDelete?.name} departmentCode={studentToDelete?.matricNo} isDeleting={isDeleting}/>
    </div>);
}
export default function DepartmentStudentsPage() {
    return (<ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <DepartmentStudentsContent />
      </DashboardLayout>
    </ProtectedRoute>);
}
