"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useCollegeStore } from "@/store/useCollegeStore";
interface College {
    _id: string;
    name: string;
    code: string;
    description?: string;
    deanName?: string;
    deanEmail?: string;
    isActive: boolean;
}
interface EditCollegeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    college: College | null;
    onSuccess?: () => void;
}
export function EditCollegeDialog({ open, onOpenChange, college, onSuccess, }: EditCollegeDialogProps) {
    const { updateCollege, loading } = useCollegeStore();
    const getInitialFormData = () => ({
        name: college?.name || "",
        code: college?.code || "",
        description: college?.description || "",
        deanName: college?.deanName || "",
        deanEmail: college?.deanEmail || "",
        isActive: college?.isActive ?? true,
    });
    const [formData, setFormData] = useState(getInitialFormData());
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        if (open && college && !isInitialized) {
            setFormData({
                name: college.name || "",
                code: college.code || "",
                description: college.description || "",
                deanName: college.deanName || "",
                deanEmail: college.deanEmail || "",
                isActive: college.isActive ?? true,
            });
            setErrors({});
            setIsInitialized(true);
        }
        else if (!open) {
            setIsInitialized(false);
        }
    }, [open, college]);
    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) {
            newErrors.name = "College name is required";
        }
        if (!formData.code.trim()) {
            newErrors.code = "College code is required";
        }
        else if (formData.code.length < 2) {
            newErrors.code = "Code must be at least 2 characters";
        }
        if (formData.deanEmail && formData.deanEmail.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.deanEmail)) {
                newErrors.deanEmail = "Invalid email format";
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !college)
            return;
        try {
            await updateCollege(college._id, {
                name: formData.name.trim(),
                code: formData.code.trim().toUpperCase(),
                description: formData.description.trim() || undefined,
                deanName: formData.deanName.trim() || undefined,
                deanEmail: formData.deanEmail.trim() || undefined,
                isActive: formData.isActive,
            });
            onOpenChange(false);
            onSuccess?.();
        }
        catch (error) {
            console.error("Failed to update college:", error);
        }
    };
    const handleClose = () => {
        if (!loading) {
            onOpenChange(false);
            setErrors({});
        }
    };
    return (<Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit College</DialogTitle>
          <DialogDescription>
            Update the college information. Code will be automatically converted to uppercase.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                College Name <span className="text-destructive">*</span>
              </Label>
              <Input id="name" placeholder="e.g., College of Computing" value={formData.name} onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            if (errors.name)
                setErrors({ ...errors, name: "" });
        }} disabled={loading} className={errors.name ? "border-destructive" : ""}/>
              {errors.name && (<p className="text-xs text-destructive">{errors.name}</p>)}
            </div>

            
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">
                College Code <span className="text-destructive">*</span>
              </Label>
              <Input id="code" placeholder="e.g., COC" value={formData.code} onChange={(e) => {
            setFormData({ ...formData, code: e.target.value.toUpperCase() });
            if (errors.code)
                setErrors({ ...errors, code: "" });
        }} disabled={loading} className={errors.code ? "border-destructive" : ""} maxLength={10}/>
              {errors.code && (<p className="text-xs text-destructive">{errors.code}</p>)}
              <p className="text-xs text-muted-foreground">
                Short code (2-10 characters, will be uppercase)
              </p>
            </div>

            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Textarea id="description" placeholder="Brief description of the college..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} disabled={loading} rows={3} className="resize-none"/>
            </div>

            
            <div className="space-y-2">
              <Label htmlFor="deanName" className="text-sm font-medium">
                Dean Name (Optional)
              </Label>
              <Input id="deanName" placeholder="e.g., Dr. John Smith" value={formData.deanName} onChange={(e) => setFormData({ ...formData, deanName: e.target.value })} disabled={loading}/>
            </div>

            
            <div className="space-y-2">
              <Label htmlFor="deanEmail" className="text-sm font-medium">
                Dean Email (Optional)
              </Label>
              <Input id="deanEmail" type="email" placeholder="e.g., dean@university.edu" value={formData.deanEmail} onChange={(e) => {
            setFormData({ ...formData, deanEmail: e.target.value });
            if (errors.deanEmail)
                setErrors({ ...errors, deanEmail: "" });
        }} disabled={loading} className={errors.deanEmail ? "border-destructive" : ""}/>
              {errors.deanEmail && (<p className="text-xs text-destructive">{errors.deanEmail}</p>)}
            </div>

            
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} disabled={loading} className="w-4 h-4 rounded border-gray-300" aria-label="Active Status"/>
              <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                Active Status
              </Label>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              Inactive colleges won&apos;t be available for student assignments
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (<>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                  Updating...
                </>) : ("Update College")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);
}
