"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useCollegeStore } from "@/store/useCollegeStore";
interface Student {
    _id: string;
    firstName: string;
    lastName: string;
    matricNo: string;
    email: string;
    level: number;
    phoneNumber?: string;
    gender?: string;
    paymentStatus: string;
}
interface EditStudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: Student | null;
    onSuccess?: () => void;
}
export function EditStudentDialog({ open, onOpenChange, student, onSuccess, }: EditStudentDialogProps) {
    const { updateStudent, loading } = useCollegeStore();
    const getInitialFormData = () => ({
        firstName: student?.firstName || "",
        lastName: student?.lastName || "",
        matricNo: student?.matricNo || "",
        email: student?.email || "",
        level: student?.level || 100,
        phoneNumber: student?.phoneNumber || "",
        gender: student?.gender || "",
    });
    const [formData, setFormData] = useState(getInitialFormData());
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        if (open && student && !isInitialized) {
            setFormData({
                firstName: student.firstName || "",
                lastName: student.lastName || "",
                matricNo: student.matricNo || "",
                email: student.email || "",
                level: student.level || 100,
                phoneNumber: student.phoneNumber || "",
                gender: student.gender || "",
            });
            setErrors({});
            setSubmitError(null);
            setIsInitialized(true);
        }
        else if (!open) {
            setIsInitialized(false);
            setSubmitError(null);
        }
    }, [open, student]);
    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }
        if (!formData.matricNo.trim()) {
            newErrors.matricNo = "Matric number is required";
        }
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        }
        else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                newErrors.email = "Invalid email format";
            }
        }
        if (![100, 200, 300, 400, 500, 600].includes(formData.level)) {
          newErrors.level = "Level must be one of: 100, 200, 300, 400, 500, or 600";
        }
        if (formData.gender && !["male", "female"].includes(formData.gender.toLowerCase())) {
          newErrors.gender = "Gender must be either male or female";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !student)
            return;
        try {
        setSubmitError(null);
        const payload: Record<string, unknown> = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                matricNo: formData.matricNo.trim().toUpperCase(),
                email: formData.email.trim().toLowerCase(),
                level: formData.level,
          phoneNumber: formData.phoneNumber.trim(),
        };
        if (formData.gender) {
          payload.gender = formData.gender.toLowerCase();
        }
        await updateStudent(student._id, payload);
            onOpenChange(false);
            onSuccess?.();
      }
      catch (error: unknown) {
            console.error("Failed to update student:", error);
        const err = error as {
          response?: {
            data?: {
              message?: string;
            };
          };
          message?: string;
        };
        setSubmitError(err.response?.data?.message || err.message || "Failed to update student.");
        }
    };
    const handleClose = () => {
        if (!loading) {
            onOpenChange(false);
            setErrors({});
        setSubmitError(null);
        }
    };
    return (<Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update student information. Changes will be reflected immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input id="firstName" placeholder="e.g., John" value={formData.firstName} onChange={(e) => {
            setFormData({ ...formData, firstName: e.target.value });
            if (errors.firstName)
                setErrors({ ...errors, firstName: "" });
        }} disabled={loading} className={errors.firstName ? "border-destructive" : ""}/>
              {errors.firstName && (<p className="text-xs text-destructive">{errors.firstName}</p>)}
            </div>

            
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input id="lastName" placeholder="e.g., Doe" value={formData.lastName} onChange={(e) => {
            setFormData({ ...formData, lastName: e.target.value });
            if (errors.lastName)
                setErrors({ ...errors, lastName: "" });
        }} disabled={loading} className={errors.lastName ? "border-destructive" : ""}/>
              {errors.lastName && (<p className="text-xs text-destructive">{errors.lastName}</p>)}
            </div>

            
            <div className="space-y-2">
              <Label htmlFor="matricNo" className="text-sm font-medium">
                Matric Number <span className="text-destructive">*</span>
              </Label>
              <Input id="matricNo" placeholder="e.g., CSC/2024/001" value={formData.matricNo} onChange={(e) => {
            setFormData({ ...formData, matricNo: e.target.value.toUpperCase() });
            if (errors.matricNo)
                setErrors({ ...errors, matricNo: "" });
        }} disabled={loading} className={errors.matricNo ? "border-destructive" : ""}/>
              {errors.matricNo && (<p className="text-xs text-destructive">{errors.matricNo}</p>)}
            </div>

            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input id="email" type="email" placeholder="e.g., john.doe@university.edu" value={formData.email} onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            if (errors.email)
                setErrors({ ...errors, email: "" });
        }} disabled={loading} className={errors.email ? "border-destructive" : ""}/>
              {errors.email && (<p className="text-xs text-destructive">{errors.email}</p>)}
            </div>

            
            <div className="space-y-2">
              <Label htmlFor="level" className="text-sm font-medium">
                Level <span className="text-destructive">*</span>
              </Label>
              <select id="level" value={formData.level} onChange={(e) => {
            setFormData({ ...formData, level: parseInt(e.target.value) });
            if (errors.level)
                setErrors({ ...errors, level: "" });
        }} disabled={loading} aria-label="Select Level" className={`w-full h-10 px-3 border rounded-md bg-background ${errors.level ? "border-destructive" : ""}`}>
                <option value={100}>100 Level</option>
                <option value={200}>200 Level</option>
                <option value={300}>300 Level</option>
                <option value={400}>400 Level</option>
                <option value={500}>500 Level</option>
                <option value={600}>600 Level</option>
              </select>
              {errors.level && (<p className="text-xs text-destructive">{errors.level}</p>)}
            </div>

            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium">
                Phone Number (Optional)
              </Label>
              <Input id="phoneNumber" placeholder="e.g., +234 800 000 0000" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} disabled={loading}/>
            </div>

            
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-sm font-medium">
                Gender (Optional)
              </Label>
              <select id="gender" value={formData.gender} onChange={(e) => {
            setFormData({ ...formData, gender: e.target.value });
            if (errors.gender)
                setErrors({ ...errors, gender: "" });
        }} disabled={loading} aria-label="Select Gender" className={`w-full h-10 px-3 border rounded-md bg-background ${errors.gender ? "border-destructive" : ""}`}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && (<p className="text-xs text-destructive">{errors.gender}</p>)}
            </div>
            {submitError && (<p className="text-sm text-destructive">{submitError}</p>)}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (<>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                  Updating...
                </>) : ("Update Student")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);
}
