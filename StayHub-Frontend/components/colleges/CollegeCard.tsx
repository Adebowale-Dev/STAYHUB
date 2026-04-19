"use client";
import { Building2, GraduationCap, Users, Eye, Edit, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
interface Department {
    _id: string;
    code: string;
    name: string;
    isActive: boolean;
    studentCount?: number;
}
interface CollegeCardProps {
    college: {
        _id: string;
        code: string;
        name: string;
        description?: string;
        isActive: boolean;
        deanName?: string;
        deanEmail?: string;
        departments?: Department[];
    };
    studentCount?: number;
    isSuperAdmin?: boolean;
    onEdit?: (college: {
        _id: string;
        name: string;
        code: string;
        description?: string;
        deanName?: string;
        deanEmail?: string;
        isActive: boolean;
    }) => void;
    onDelete?: (id: string, name: string, code: string) => void;
}
export function CollegeCard({ college, studentCount = 0, isSuperAdmin = false, onEdit, onDelete, }: CollegeCardProps) {
    const router = useRouter();
    return (<Card className="p-4 border shadow-none hover:shadow-md hover:border-primary/50 transition-all">
      <div className="space-y-3">
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-primary"/>
              <span className="font-mono text-xs font-semibold text-primary">
                {college.code}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground line-clamp-2">
              {college.name}
            </h3>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${college.isActive
            ? "bg-green-500/10 text-green-600"
            : "bg-gray-500/10 text-gray-600"}`}>
            {college.isActive ? "Active" : "Inactive"}
          </div>
        </div>

        
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-muted-foreground"/>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {college.departments?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Departments</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-muted-foreground"/>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {studentCount}
              </p>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
          </div>
        </div>

        
        {college.deanName && (<div className="pt-2.5 border-t">
            <p className="text-xs text-muted-foreground">Dean</p>
            <p className="text-xs font-medium text-foreground mt-0.5">
              {college.deanName}
            </p>
          </div>)}

        
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => router.push(`/admin/colleges/${college._id}`)}>
            <Eye className="w-3.5 h-3.5 mr-1.5"/>
            View
          </Button>

          {isSuperAdmin && (<>
              <Button variant="outline" size="sm" className="h-8 w-8 rounded-full p-0" onClick={() => onEdit?.(college)} aria-label="Edit College">
                <Edit className="w-3.5 h-3.5"/>
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 rounded-full p-0 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50" onClick={() => onDelete?.(college._id, college.name, college.code)} aria-label="Delete College">
                <Trash2 className="w-3.5 h-3.5"/>
              </Button>
            </>)}
        </div>
      </div>
    </Card>);
}
