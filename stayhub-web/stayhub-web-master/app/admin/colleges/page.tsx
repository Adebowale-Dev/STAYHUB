"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, Users, GraduationCap, Search, AlertCircle, TrendingUp, } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteDepartmentDialog } from "@/components/DeleteDepartmentDialog";
import { EditCollegeDialog } from "@/components/EditCollegeDialog";
import { CreateCollegeDialog } from "@/components/CreateCollegeDialog";
import { CollegeCard, LoadingState } from "@/components/colleges";
import useAuthStore from "@/store/useAuthStore";
import { useCollegeStore } from "@/store/useCollegeStore";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
function CollegesPageContent() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { colleges, statistics, loading, error, fetchColleges, fetchStatistics, deleteCollege, } = useCollegeStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [collegeToDelete, setCollegeToDelete] = useState<{
        id: string;
        name: string;
        code: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [collegeToEdit, setCollegeToEdit] = useState<{
        _id: string;
        name: string;
        code: string;
        description?: string;
        deanName?: string;
        deanEmail?: string;
        isActive: boolean;
    } | null>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const isSuperAdmin = user?.role === "admin";
    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchColleges(), fetchStatistics()]);
            setInitialLoad(false);
        };
        loadData();
    }, []);
    const filteredColleges = colleges.filter((college) => {
        const matchesSearch = college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            college.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" && college.isActive) ||
            (statusFilter === "inactive" && !college.isActive);
        return matchesSearch && matchesStatus;
    });
    const handleDeleteClick = (collegeId: string, collegeName: string, collegeCode: string) => {
        setCollegeToDelete({ id: collegeId, name: collegeName, code: collegeCode });
        setDeleteModalOpen(true);
    };
    const handleEditClick = (college: {
        _id: string;
        name: string;
        code: string;
        description?: string;
        deanName?: string;
        deanEmail?: string;
        isActive: boolean;
    }) => {
        setCollegeToEdit(college);
        setEditModalOpen(true);
    };
    const handleEditSuccess = async () => {
        await Promise.all([fetchColleges(), fetchStatistics()]);
    };
    const handleCreateSuccess = async () => {
        await Promise.all([fetchColleges(), fetchStatistics()]);
    };
    const handleDeleteConfirm = async () => {
        if (!collegeToDelete)
            return;
        setIsDeleting(true);
        try {
            await deleteCollege(collegeToDelete.id, true);
            setDeleteModalOpen(false);
            setCollegeToDelete(null);
            await fetchColleges();
            await fetchStatistics();
        }
        catch {
        }
        finally {
            setIsDeleting(false);
        }
    };
    return (<div className="min-h-screen bg-background">
      
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-lg font-semibold text-foreground truncate">
                Colleges & Departments
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                Manage academic colleges and their departments
              </p>
            </div>
            {isSuperAdmin && (<Button onClick={() => setCreateModalOpen(true)} className="h-8 md:h-9 text-xs shrink-0">
                <Plus className="w-3.5 h-3.5 mr-1 md:mr-2"/>
                <span className="hidden sm:inline">Create College</span>
                <span className="sm:hidden">Create</span>
              </Button>)}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4">
        
        {statistics && (<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="p-3 border shadow-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="w-4 h-4 text-primary"/>
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {statistics.totalColleges}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Colleges
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-3 border shadow-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <GraduationCap className="w-4 h-4 text-green-600"/>
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {statistics.totalDepartments}
                  </p>
                  <p className="text-xs text-muted-foreground">Departments</p>
                </div>
              </div>
            </Card>

            <Card className="p-3 border shadow-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-4 h-4 text-blue-600"/>
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {statistics.totalStudents}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Students
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-3 border shadow-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-purple-600"/>
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {statistics.activeColleges}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Active Colleges
                  </p>
                </div>
              </div>
            </Card>
          </div>)}

        
        <Card className="p-3 border shadow-none">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"/>
              <Input placeholder="Search colleges by name or code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 bg-background text-sm"/>
            </div>

            <div className="flex gap-2">
              <Button variant={statusFilter === "all" ? "default" : "outline"} onClick={() => setStatusFilter("all")} size="sm" className="h-9 text-xs">
                All
              </Button>
              <Button variant={statusFilter === "active" ? "default" : "outline"} onClick={() => setStatusFilter("active")} size="sm" className="h-9 text-xs">
                Active
              </Button>
              <Button variant={statusFilter === "inactive" ? "default" : "outline"} onClick={() => setStatusFilter("inactive")} size="sm" className="h-9 text-xs text-muted-foreground">
                Inactive
              </Button>
            </div>
          </div>
        </Card>

        
        {error && (<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5"/>
            <div>
              <p className="text-xs font-medium text-destructive">Error</p>
              <p className="text-xs text-destructive/80">{error}</p>
            </div>
          </div>)}

        
        {(loading || initialLoad) && colleges.length === 0 && (<LoadingState message="Loading colleges..."/>)}

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredColleges.map((college) => {
            const studentCount = statistics?.collegesBreakdown?.find((c) => c.id === college._id)?.studentCount || 0;
            return (<CollegeCard key={college._id} college={college} studentCount={studentCount} isSuperAdmin={isSuperAdmin} onEdit={handleEditClick} onDelete={handleDeleteClick}/>);
        })}
        </div>

        
        {!loading && !initialLoad && filteredColleges.length === 0 && (<Card className="p-8 border shadow-none">
            <div className="text-center">
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3"/>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                No colleges found
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first college"}
              </p>
              {isSuperAdmin && !searchQuery && statusFilter === "all" && (<Button onClick={() => setCreateModalOpen(true)} className="h-9">
                  <Plus className="w-3.5 h-3.5 mr-2"/>
                  Create College
                </Button>)}
            </div>
          </Card>)}
      </div>

      
      <DeleteDepartmentDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen} onConfirm={handleDeleteConfirm} departmentName={collegeToDelete?.name} departmentCode={collegeToDelete?.code} isDeleting={isDeleting}/>

      
      <CreateCollegeDialog open={createModalOpen} onOpenChange={setCreateModalOpen} onSuccess={handleCreateSuccess}/>

      
      <EditCollegeDialog open={editModalOpen} onOpenChange={setEditModalOpen} college={collegeToEdit} onSuccess={handleEditSuccess}/>
    </div>);
}
export default function CollegesPage() {
    return (<ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <CollegesPageContent />
      </DashboardLayout>
    </ProtectedRoute>);
}
