"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { adminAPI } from "@/services/api";
import { toast } from "sonner";
interface Hostel {
    _id: string;
    name: string;
    level?: number;
    gender: "male" | "female" | "mixed";
    totalRooms?: number;
    description?: string;
    isActive: boolean;
}
interface EditHostelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hostel: Hostel | null;
    onSuccess: () => void;
}
interface FormData {
    name: string;
    level: number;
    gender: "male" | "female" | "mixed";
    totalRooms: string;
    description: string;
}
const allLevels = [100, 200, 300, 400, 500];
export function EditHostelDialog({ open, onOpenChange, hostel, onSuccess, }: EditHostelDialogProps) {
    const [formData, setFormData] = useState<FormData>({
        name: "",
        level: 100,
        gender: "male",
        totalRooms: "",
        description: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        if (hostel) {
            setFormData({
                name: hostel.name || "",
                level: hostel.level || 100,
                gender: hostel.gender || "male",
                totalRooms: hostel.totalRooms?.toString() || "",
                description: hostel.description || "",
            });
            setErrors({});
        }
    }, [hostel]);
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) {
            newErrors.name = "Hostel name is required";
        }
        if (!formData.totalRooms || Number(formData.totalRooms) < 1) {
            newErrors.totalRooms = "Total rooms must be at least 1";
        }
        if (!formData.gender) {
            newErrors.gender = "Gender is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !hostel) {
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                name: formData.name.trim(),
                level: formData.level,
                gender: formData.gender,
                totalRooms: Number(formData.totalRooms),
                description: formData.description.trim(),
            };
            console.log("=== Edit Hostel Debug Info ===");
            console.log("Hostel ID:", hostel._id);
            console.log("Original hostel:", {
                name: hostel.name,
                level: hostel.level,
                gender: hostel.gender,
                totalRooms: hostel.totalRooms,
                description: hostel.description
            });
            console.log("Updating hostel with payload:", payload);
            console.log("API URL:", process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');
            console.log("Full URL will be:", `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/hostels/${hostel._id}`);
            const response = await adminAPI.updateHostel(hostel._id, payload);
            console.log("Update response:", response.data);
            toast.success("Hostel updated successfully!");
            onSuccess();
            onOpenChange(false);
        }
        catch (error: unknown) {
            console.error("Full error object:", error);
            if (error && typeof error === "object") {
                const axiosError = error as {
                    response?: {
                        status?: number;
                        data?: {
                            message?: string;
                            error?: string;
                            errors?: Record<string, string> | unknown[];
                        };
                    };
                    request?: unknown;
                    message?: string;
                    code?: string;
                };
                console.error("Error code:", axiosError.code);
                console.error("Error message:", axiosError.message);
                console.error("Error response:", axiosError.response);
                console.error("Error request:", axiosError.request);
                if (!axiosError.response) {
                    if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
                        toast.error("Request timeout. Please check if the backend server is running.");
                    }
                    else if (axiosError.message?.includes('Network Error')) {
                        toast.error("Network error. Please check your connection and ensure the backend is running at http://localhost:5000");
                    }
                    else {
                        toast.error(axiosError.message || "Failed to connect to server. Please ensure backend is running.");
                    }
                    return;
                }
                if (axiosError.response?.status === 409) {
                    const errorMsg = axiosError.response?.data?.message ||
                        axiosError.response?.data?.error ||
                        "A hostel with this name already exists";
                    toast.error(errorMsg);
                    setErrors({ name: errorMsg });
                    return;
                }
                if (axiosError.response?.data?.errors) {
                    const backendErrors = axiosError.response.data.errors;
                    if (typeof backendErrors === "object" && !Array.isArray(backendErrors)) {
                        setErrors(backendErrors as Record<string, string>);
                        toast.error("Please fix the validation errors");
                        return;
                    }
                }
                const errorMessage = axiosError.response?.data?.message ||
                    axiosError.response?.data?.error ||
                    `Failed to update hostel (Status: ${axiosError.response?.status || 'unknown'})`;
                toast.error(errorMessage);
            }
            else {
                toast.error("Failed to update hostel. Please try again.");
            }
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleClose = () => {
        if (!isSubmitting) {
            onOpenChange(false);
        }
    };
    return (<Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Hostel</DialogTitle>
          <DialogDescription>
            Update the hostel information below. All fields marked with * are required.
            {hostel && (<span className="block mt-1 text-xs text-muted-foreground">
                Currently editing: <span className="font-semibold">{hostel.name}</span>
              </span>)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Hostel Name *
            </Label>
            <Input id="name" value={formData.name} onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            if (errors.name)
                setErrors({ ...errors, name: "" });
        }} placeholder="e.g., Kings Hall" className={errors.name ? "border-red-500" : ""}/>
            {errors.name && (<p className="text-xs text-red-500">{errors.name}</p>)}
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalRooms" className="text-sm font-medium">
                Total Rooms *
              </Label>
              <Input id="totalRooms" type="number" min="1" value={formData.totalRooms} onChange={(e) => {
            setFormData({ ...formData, totalRooms: e.target.value });
            if (errors.totalRooms)
                setErrors({ ...errors, totalRooms: "" });
        }} placeholder="e.g., 50" className={errors.totalRooms ? "border-red-500" : ""}/>
              {errors.totalRooms && (<p className="text-xs text-red-500">{errors.totalRooms}</p>)}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-sm font-medium">
                Gender *
              </Label>
              <Select value={formData.gender} onValueChange={(value: "male" | "female" | "mixed") => {
            setFormData({ ...formData, gender: value });
            if (errors.gender)
                setErrors({ ...errors, gender: "" });
        }}>
                <SelectTrigger id="gender" className={errors.gender ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select gender"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (<p className="text-xs text-red-500">{errors.gender}</p>)}
            </div>
          </div>

          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Student Level *</Label>
            <div className="flex flex-wrap gap-2">
              {allLevels.map((level) => (<Badge key={level} variant={formData.level === level ? "default" : "outline"} className="cursor-pointer px-3 py-1.5 text-sm hover:bg-primary/90" onClick={() => setFormData({ ...formData, level })}>
                  {level}L
                </Badge>))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select the student level this hostel is designated for
            </p>
          </div>

          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the hostel (optional)" rows={3} className="resize-none"/>
            <p className="text-xs text-muted-foreground">
              Optional: Add any additional information about the hostel
            </p>
          </div>

          
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="flex-1">
              <X className="w-4 h-4 mr-2"/>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Updating..." : "Update Hostel"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);
}
