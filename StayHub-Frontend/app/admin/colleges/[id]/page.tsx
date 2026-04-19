"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { GraduationCap, Users, Plus, } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DeleteDepartmentDialog } from "@/components/DeleteDepartmentDialog";
import { EditDepartmentDialog } from "@/components/EditDepartmentDialog";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useCollegeStore } from "@/store/useCollegeStore";
import { PageHeader, StatCard, DeanInfoCard, DepartmentCard, EmptyState, LoadingState, ErrorState, } from "@/components/colleges";
function CollegeDetailContent() {
    const router = useRouter();
    const params = useParams();
    const collegeId = params.id as string;
    const { currentCollege: college, currentDepartments: departments, loading, error, fetchCollegeById, fetchDepartmentsByCollege, deleteDepartment, clearCurrentCollege, clearCurrentDepartments, } = useCollegeStore();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deptToDelete, setDeptToDelete] = useState<{
        id: string;
        name: string;
        code: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deptToEdit, setDeptToEdit] = useState<{
        _id: string;
        name: string;
        code: string;
        description?: string;
        isActive: boolean;
    } | null>(null);
    const totalStudents = departments.reduce((sum, dept) => sum + (dept.studentCount || 0), 0);
    useEffect(() => {
        if (collegeId) {
            fetchCollegeById(collegeId);
            fetchDepartmentsByCollege(collegeId);
        }
        return () => {
            clearCurrentCollege();
            clearCurrentDepartments();
        };
    }, [collegeId]);
    const handleDeleteClick = (deptId: string, deptName: string, deptCode: string) => {
        setDeptToDelete({ id: deptId, name: deptName, code: deptCode });
        setDeleteModalOpen(true);
    };
    const handleEditClick = (dept: {
        _id: string;
        name: string;
        code: string;
        description?: string;
        isActive: boolean;
    }) => {
        setDeptToEdit(dept);
        setEditModalOpen(true);
    };
    const handleEditSuccess = async () => {
        await fetchDepartmentsByCollege(collegeId);
        await fetchCollegeById(collegeId);
    };
    const handleDeleteConfirm = async () => {
        if (!deptToDelete)
            return;
        setIsDeleting(true);
        try {
            await deleteDepartment(collegeId, deptToDelete.id, true);
            setDeleteModalOpen(false);
            setDeptToDelete(null);
            await fetchDepartmentsByCollege(collegeId);
            await fetchCollegeById(collegeId);
        }
        catch (err) {
            console.error("Failed to delete department:", err);
        }
        finally {
            setIsDeleting(false);
        }
    };
    if (loading && !college) {
        return <LoadingState message="Loading college details..."/>;
    }
    if (error || !college) {
        return (<ErrorState message={error || "College not found"} onBack={() => router.push("/admin/colleges")} backLabel="Back to Colleges"/>);
    }
    return (<div className="min-h-screen bg-background">
      
      <PageHeader code={college.code} title={college.name} isActive={college.isActive} backUrl="/admin/colleges" backLabel="Back" actionButton={{
            label: "Add Department",
            icon: Plus,
            onClick: () => router.push(`/admin/colleges/${collegeId}/departments/create`),
        }}/>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard icon={GraduationCap} iconColor="text-green-600" iconBgColor="bg-green-500/10" value={departments.length} label="Departments"/>

          <StatCard icon={Users} iconColor="text-blue-600" iconBgColor="bg-blue-500/10" value={totalStudents} label="Total Students"/>

          {college.deanName && (<DeanInfoCard deanName={college.deanName} deanEmail={college.deanEmail}/>)}
        </div>

        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Departments</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage departments in this college
              </p>
            </div>
          </div>

          {departments.length === 0 ? (<Card className="border shadow-none">
              <EmptyState icon={GraduationCap} title="No departments yet" description="Get started by creating the first department for this college" actionButton={{
                label: "Add First Department",
                icon: Plus,
                onClick: () => router.push(`/admin/colleges/${collegeId}/departments/create`),
            }}/>
            </Card>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {departments.map((dept) => (<DepartmentCard key={dept._id} department={dept} collegeId={collegeId} onEdit={handleEditClick} onDelete={handleDeleteClick} onViewStudents={(deptId) => router.push(`/admin/colleges/${collegeId}/departments/${deptId}/students`)}/>))}
            </div>)}
        </div>
      </div>

      
      <DeleteDepartmentDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen} onConfirm={handleDeleteConfirm} departmentName={deptToDelete?.name} departmentCode={deptToDelete?.code} isDeleting={isDeleting}/>

      
      <EditDepartmentDialog open={editModalOpen} onOpenChange={setEditModalOpen} department={deptToEdit} collegeId={collegeId} onSuccess={handleEditSuccess}/>
    </div>);
}
export default function CollegeDetailPage() {
    return (<ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <CollegeDetailContent />
      </DashboardLayout>
    </ProtectedRoute>);
}
