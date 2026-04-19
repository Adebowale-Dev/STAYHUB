"use client";
import { useState, useEffect } from "react";
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
interface Room {
    _id: string;
    roomNumber: string;
    hostel: {
        _id: string;
        name: string;
    };
    capacity: number;
    currentOccupants: number;
    level: number;
    status?: string;
    isActive: boolean;
}
interface EditRoomDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    room: Room | null;
    onSuccess?: () => void;
}
interface FormData {
    roomNumber: string;
    hostelId: string;
    capacity: string;
    level: string;
}
interface FormErrors {
    roomNumber?: string;
    hostelId?: string;
    capacity?: string;
    level?: string;
}
export function EditRoomDialog({ open, onOpenChange, room, onSuccess }: EditRoomDialogProps) {
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingHostels, setLoadingHostels] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        roomNumber: "",
        hostelId: "",
        capacity: "",
        level: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    useEffect(() => {
        if (open) {
            loadHostels();
            if (room) {
                setFormData({
                    roomNumber: room.roomNumber,
                    hostelId: room.hostel._id,
                    capacity: String(room.capacity),
                    level: String(room.level),
                });
            }
            setErrors({});
        }
    }, [open, room]);
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
        if (!formData.level) {
            newErrors.level = "Please select level";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !room) {
            return;
        }
        setLoading(true);
        try {
            const payload = {
                roomNumber: formData.roomNumber.trim(),
                hostel: formData.hostelId,
                capacity: Number(formData.capacity),
                level: Number(formData.level),
            };
            console.log("Updating room with payload:", payload);
            console.log("Original room data:", {
                roomNumber: room.roomNumber,
                hostel: room.hostel._id,
                capacity: room.capacity,
                level: room.level,
            });
            const response = await adminAPI.updateRoom(room._id, payload);
            console.log("Room updated successfully:", response.data);
            alert("Room updated successfully!");
            onOpenChange(false);
            if (onSuccess) {
                onSuccess();
            }
        }
        catch (err: unknown) {
            console.error("Error updating room:", err);
            console.error("Full error object:", JSON.stringify(err, null, 2));
            if (err && typeof err === "object" && "isAxiosError" in err && err.isAxiosError) {
                const axiosError = err as {
                    response?: {
                        status?: number;
                        data?: {
                            message?: string;
                            error?: string;
                            errors?: Array<{
                                field: string;
                                message: string;
                            }>;
                        };
                    };
                    message?: string;
                    code?: string;
                };
                console.log("Axios error details:", {
                    status: axiosError.response?.status,
                    data: axiosError.response?.data,
                    message: axiosError.message,
                    code: axiosError.code,
                });
                if (axiosError.response?.status === 404) {
                    alert("❌ Room editing is not yet supported by the backend.\n\nThe backend needs to implement: PUT /api/admin/rooms/:id\n\nPlease contact the backend team.");
                }
                else if (axiosError.response?.status === 400) {
                    const errorData = axiosError.response?.data;
                    const validationErrors = errorData?.errors || [];
                    if (validationErrors.length > 0) {
                        const errorDetails = validationErrors.map(e => `${e.field}: ${e.message}`).join("\n");
                        alert(`Validation Error:\n${errorDetails}`);
                    }
                    else {
                        alert(`Validation Error: ${errorData?.message || "Invalid data provided"}`);
                    }
                }
                else if (axiosError.response?.status === 409) {
                    setErrors({
                        roomNumber: "A room with this number already exists in the selected hostel",
                    });
                    alert("A room with this number already exists in the selected hostel");
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
                    alert(`Failed to update room. Status: ${axiosError.response?.status}`);
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
    if (!room)
        return null;
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Room</DialogTitle>
          <DialogDescription>
            Update the room details. All fields marked with * are required.
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
                  <SelectValue placeholder="Level"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100L</SelectItem>
                  <SelectItem value="200">200L</SelectItem>
                  <SelectItem value="300">300L</SelectItem>
                  <SelectItem value="400">400L</SelectItem>
                  <SelectItem value="500">500L</SelectItem>
                </SelectContent>
              </Select>
              {errors.level && (<p className="text-sm text-destructive">{errors.level}</p>)}
            </div>
          </div>

          
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Current Occupancy:</span> {room.currentOccupants}/{room.capacity}
            </p>
          </div>

          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);
}
