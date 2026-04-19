"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { adminAPI } from "@/services/api";
interface Hostel {
    _id: string;
    name: string;
    gender: "male" | "female" | "mixed";
    level?: number;
}
interface AddRoomDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}
interface FormData {
    roomNumber: string;
    hostelId: string;
    capacity: string;
    gender: "male" | "female" | "mixed" | "";
    floor: string;
    roomType: string;
    level: string;
}
interface FormErrors {
    roomNumber?: string;
    hostelId?: string;
    capacity?: string;
    gender?: string;
    floor?: string;
    level?: string;
}
export function AddRoomDialog({ open, onOpenChange, onSuccess }: AddRoomDialogProps) {
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingHostels, setLoadingHostels] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        roomNumber: "",
        hostelId: "",
        capacity: "",
        gender: "",
        floor: "",
        roomType: "Standard",
        level: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    useEffect(() => {
        if (open) {
            loadHostels();
            setFormData({
                roomNumber: "",
                hostelId: "",
                capacity: "",
                gender: "",
                floor: "",
                roomType: "Standard",
                level: "",
            });
            setErrors({});
        }
    }, [open]);
    const loadHostels = async () => {
        setLoadingHostels(true);
        try {
            const response = await adminAPI.getHostels();
            if (response.data?.success && response.data?.data) {
                setHostels(response.data.data);
            }
        }
        catch (err) {
            console.error("Error loading hostels:", err);
        }
        finally {
            setLoadingHostels(false);
        }
    };
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.roomNumber.trim()) {
            newErrors.roomNumber = "Room number is required";
        }
        if (!formData.hostelId) {
            newErrors.hostelId = "Please select a hostel";
        }
        if (!formData.capacity || Number(formData.capacity) <= 0) {
            newErrors.capacity = "Capacity must be greater than 0";
        }
        if (!formData.gender) {
            newErrors.gender = "Please select gender";
        }
        if (!formData.level) {
            newErrors.level = "Please select level";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setLoading(true);
        try {
            const payload = {
                roomNumber: formData.roomNumber.trim(),
                hostel: formData.hostelId,
                capacity: Number(formData.capacity),
                gender: formData.gender,
                level: Number(formData.level),
                floor: formData.floor ? Number(formData.floor) : undefined,
                roomType: formData.roomType || "Standard",
            };
            console.log("Creating room with payload:", payload);
            const response = await adminAPI.createRoom(payload);
            console.log("Room created successfully:", response.data);
            alert("Room created successfully!");
            onOpenChange(false);
            if (onSuccess) {
                onSuccess();
            }
        }
        catch (err: unknown) {
            console.error("Error creating room:", err);
            console.error("Full error object:", JSON.stringify(err, null, 2));
            if (err && typeof err === "object" && "isAxiosError" in err && err.isAxiosError) {
                const axiosError = err as {
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
                console.log("Axios error details:", {
                    status: axiosError.response?.status,
                    statusText: axiosError.response,
                    data: axiosError.response?.data,
                    message: axiosError.message,
                    code: axiosError.code,
                });
                if (axiosError.response?.status === 400) {
                    const errorData = axiosError.response?.data as {
                        message?: string;
                        error?: string;
                        errors?: Array<{
                            field: string;
                            message: string;
                        }>;
                    };
                    console.error("Backend validation error:", errorData);
                    console.error("Error message:", errorData?.message);
                    console.error("Error field:", errorData?.error);
                    console.error("Validation errors array:", errorData?.errors);
                    const errorMessage = errorData?.message || errorData?.error || "Invalid data provided";
                    if (errorMessage.includes("E11000") || errorMessage.includes("duplicate key")) {
                        alert("❌ A room with this number already exists in this hostel.\n\nPlease use a different room number.");
                        setErrors({
                            roomNumber: "Room number already exists in this hostel",
                        });
                        return;
                    }
                    const validationErrors = errorData?.errors || [];
                    if (validationErrors.length > 0) {
                        const errorDetails = validationErrors.map(e => `${e.field}: ${e.message}`).join("\n");
                        alert(`Validation Error:\n${errorDetails}`);
                    }
                    else {
                        alert(`Validation Error: ${errorMessage}`);
                    }
                }
                else if (axiosError.response?.status === 409) {
                    setErrors({
                        roomNumber: "A room with this number already exists in the selected hostel",
                    });
                }
                else if (axiosError.response?.data?.message) {
                    alert(`Error: ${axiosError.response.data.message}`);
                }
                else if (axiosError.code === "ECONNABORTED" || axiosError.message?.includes("timeout")) {
                    alert("Request timeout. Please check if the backend server is running.");
                }
                else if (!axiosError.response) {
                    alert("Network error. Please check if the backend server is running at http://localhost:5000");
                }
                else {
                    alert(`Failed to create room. Status: ${axiosError.response?.status}`);
                }
            }
            else {
                alert("An unexpected error occurred. Please try again.");
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Room</DialogTitle>
          <DialogDescription>
            Create a new room in one of your hostels. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="roomNumber">
              Room Number <span className="text-destructive">*</span>
            </Label>
            <Input id="roomNumber" placeholder="e.g., 101, A1, B-201" value={formData.roomNumber} onChange={(e) => {
            setFormData({ ...formData, roomNumber: e.target.value });
            if (errors.roomNumber) {
                setErrors({ ...errors, roomNumber: undefined });
            }
        }} className={errors.roomNumber ? "border-destructive" : ""}/>
            {errors.roomNumber && (<p className="text-sm text-destructive">{errors.roomNumber}</p>)}
          </div>

          
          <div className="space-y-2">
            <Label htmlFor="hostelId">
              Hostel <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.hostelId} onValueChange={(value) => {
            setFormData({ ...formData, hostelId: value });
            if (errors.hostelId) {
                setErrors({ ...errors, hostelId: undefined });
            }
        }}>
              <SelectTrigger className={errors.hostelId ? "border-destructive" : ""}>
                <SelectValue placeholder={loadingHostels ? "Loading..." : "Select a hostel"}/>
              </SelectTrigger>
              <SelectContent>
                {hostels.map((hostel) => (<SelectItem key={hostel._id} value={hostel._id}>
                    {hostel.name} ({hostel.gender})
                  </SelectItem>))}
              </SelectContent>
            </Select>
            {errors.hostelId && (<p className="text-sm text-destructive">{errors.hostelId}</p>)}
          </div>

          <div className="grid grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <Label htmlFor="capacity">
                Capacity <span className="text-destructive">*</span>
              </Label>
              <Input id="capacity" type="number" min="1" placeholder="e.g., 2, 4" value={formData.capacity} onChange={(e) => {
            setFormData({ ...formData, capacity: e.target.value });
            if (errors.capacity) {
                setErrors({ ...errors, capacity: undefined });
            }
        }} className={errors.capacity ? "border-destructive" : ""}/>
              {errors.capacity && (<p className="text-sm text-destructive">{errors.capacity}</p>)}
            </div>

            
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input id="floor" type="number" min="0" placeholder="e.g., 1, 2" value={formData.floor} onChange={(e) => {
            setFormData({ ...formData, floor: e.target.value });
        }}/>
            </div>
          </div>

          
          <div className="space-y-2">
            <Label htmlFor="level">
              Level <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.level} onValueChange={(value) => {
            setFormData({ ...formData, level: value });
            if (errors.level) {
                setErrors({ ...errors, level: undefined });
            }
        }}>
              <SelectTrigger className={errors.level ? "border-destructive" : ""}>
                <SelectValue placeholder="Select level"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100 Level</SelectItem>
                <SelectItem value="200">200 Level</SelectItem>
                <SelectItem value="300">300 Level</SelectItem>
                <SelectItem value="400">400 Level</SelectItem>
                <SelectItem value="500">500 Level</SelectItem>
              </SelectContent>
            </Select>
            {errors.level && (<p className="text-sm text-destructive">{errors.level}</p>)}
          </div>

          
          <div className="space-y-2">
            <Label htmlFor="gender">
              Gender <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.gender} onValueChange={(value: "male" | "female" | "mixed") => {
            setFormData({ ...formData, gender: value });
            if (errors.gender) {
                setErrors({ ...errors, gender: undefined });
            }
        }}>
              <SelectTrigger className={errors.gender ? "border-destructive" : ""}>
                <SelectValue placeholder="Select gender"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (<p className="text-sm text-destructive">{errors.gender}</p>)}
          </div>

          
          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type</Label>
            <Select value={formData.roomType} onValueChange={(value) => {
            setFormData({ ...formData, roomType: value });
        }}>
              <SelectTrigger>
                <SelectValue placeholder="Select room type"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Deluxe">Deluxe</SelectItem>
                <SelectItem value="Suite">Suite</SelectItem>
                <SelectItem value="Shared">Shared</SelectItem>
              </SelectContent>
            </Select>
          </div>

          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);
}
