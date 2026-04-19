"use client";
import { GraduationCap, Users, Edit, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
interface DepartmentCardProps {
    department: {
        _id: string;
        code: string;
        name: string;
        description?: string;
        isActive: boolean;
        studentCount?: number;
    };
    collegeId: string;
    onEdit: (dept: {
        _id: string;
        name: string;
        code: string;
        description?: string;
        isActive: boolean;
    }) => void;
    onDelete: (id: string, name: string, code: string) => void;
    onViewStudents: (deptId: string) => void;
}
export function DepartmentCard({ department, onEdit, onDelete, onViewStudents, }: DepartmentCardProps) {
    return (<Card className="p-4 border shadow-none hover:shadow-md hover:border-primary/50 transition-all">
      <div className="space-y-3">
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-4 h-4 text-primary"/>
              <span className="font-mono text-xs font-semibold text-primary">
                {department.code}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground line-clamp-2">
              {department.name}
            </h3>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${department.isActive
            ? "bg-green-500/10 text-green-600"
            : "bg-gray-500/10 text-gray-600"}`}>
            {department.isActive ? "Active" : "Inactive"}
          </div>
        </div>

        
        {department.description && (<p className="text-xs text-muted-foreground line-clamp-2">
            {department.description}
          </p>)}

        
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-muted-foreground"/>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {department.studentCount || 0}
              </p>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
          </div>
        </div>

        
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onViewStudents(department._id)}>
            <Users className="w-3.5 h-3.5 mr-1.5"/>
            View Students
          </Button>

          <Button variant="outline" size="sm" className="h-8 w-8 rounded-full p-0" onClick={() => onEdit(department)}>
            <Edit className="w-3.5 h-3.5"/>
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 rounded-full p-0 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50" onClick={() => onDelete(department._id, department.name, department.code)}>
            <Trash2 className="w-3.5 h-3.5"/>
          </Button>
        </div>
      </div>
    </Card>);
}
