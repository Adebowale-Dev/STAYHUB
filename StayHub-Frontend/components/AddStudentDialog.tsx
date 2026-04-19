"use client";
import { useState, useEffect } from "react";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { adminAPI } from "@/services/api";
import { toast } from "sonner";
interface College {
    _id: string;
    name: string;
    code: string;
}
interface Department {
    _id: string;
    name: string;
    code: string;
}
interface AddStudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}
interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    matricNo: string;
    phoneNumber: string;
    dateOfBirth: string;
    gender: "male" | "female" | "";
    level: string;
    college: string;
    department: string;
    address: string;
    password: string;
}
export function AddStudentDialog({ open, onOpenChange, onSuccess, }: AddStudentDialogProps) {
    const [formData, setFormData] = useState<FormData>({
        firstName: "",
        lastName: "",
        email: "",
        matricNo: "",
        phoneNumber: "",
        dateOfBirth: "",
        gender: "",
        level: "100",
        college: "",
        department: "",
        address: "",
        password: "",
    });
    const [colleges, setColleges] = useState<College[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loadingColleges, setLoadingColleges] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    useEffect(() => {
        if (open) {
            loadColleges();
        }
    }, [open]);
    useEffect(() => {
        if (formData.college) {
            loadDepartments(formData.college);
        }
        else {
            setDepartments([]);
            setFormData(prev => ({ ...prev, department: "" }));
        }
    }, [formData.college]);
    const loadColleges = async () => {
        try {
            setLoadingColleges(true);
            const response = await adminAPI.getColleges();
            const collegesData = response.data.data || response.data || [];
            setColleges(Array.isArray(collegesData) ? collegesData : []);
        }
        catch (error) {
            console.error("Failed to load colleges:", error);
            toast.error("Failed to load colleges");
        }
        finally {
            setLoadingColleges(false);
        }
    };
    const loadDepartments = async (collegeId: string) => {
        try {
            setLoadingDepartments(true);
            console.log("Loading departments for college:", collegeId);
            const response = await adminAPI.getDepartmentsByCollege(collegeId);
            console.log("Full API response:", response);
            console.log("Response.data:", response.data);
            console.log("Response.data.data:", response.data.data);
            let departmentsData = [];
            if (response.data.data && response.data.data.departments && Array.isArray(response.data.data.departments)) {
                departmentsData = response.data.data.departments;
            }
            else if (response.data.data && Array.isArray(response.data.data)) {
                departmentsData = response.data.data;
            }
            else if (response.data.departments && Array.isArray(response.data.departments)) {
                departmentsData = response.data.departments;
            }
            else if (Array.isArray(response.data)) {
                departmentsData = response.data;
            }
            console.log("Extracted departments:", departmentsData);
            setDepartments(departmentsData);
        }
        catch (error) {
            console.error("Failed to load departments:", error);
            toast.error("Failed to load departments");
            setDepartments([]);
        }
        finally {
            setLoadingDepartments(false);
        }
    };
    const generatePassword = () => {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const generatedPassword = `${formData.firstName || 'Student'}${randomNum}`;
        setFormData(prev => ({ ...prev, password: generatedPassword }));
    };
    const generateMatricNo = () => {
        const college = colleges.find(c => c._id === formData.college);
        const year = new Date().getFullYear().toString().slice(-2);
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const matricNo = college
            ? `${college.code}${year}${formData.level}${randomNum}`
            : `STU${year}${randomNum}`;
        setFormData(prev => ({ ...prev, matricNo }));
    };
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }
        if (!formData.matricNo.trim()) {
            newErrors.matricNo = "Matric number is required";
        }
        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = "Phone number is required";
        }
        if (!formData.gender) {
            newErrors.gender = "Gender is required";
        }
        if (!formData.level) {
            newErrors.level = "Level is required";
        }
        if (!formData.college) {
            newErrors.college = "College is required";
        }
        if (!formData.department) {
            newErrors.department = "Department is required";
        }
        if (!formData.password.trim()) {
            newErrors.password = "Password is required";
        }
        else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fix the validation errors");
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim().toLowerCase(),
                matricNo: formData.matricNo.trim().toUpperCase(),
                phoneNumber: formData.phoneNumber.trim(),
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                level: parseInt(formData.level),
                college: formData.college,
                department: formData.department,
                address: formData.address.trim(),
                password: formData.password,
            };
            console.log("Creating student with payload:", payload);
            const response = await adminAPI.createStudent(payload);
            console.log("Student created:", response.data);
            const loginInfo = `
Student Account Created Successfully!

Login Credentials:
📧 Email: ${formData.email.trim().toLowerCase()}
🎓 Matric No: ${formData.matricNo.trim().toUpperCase()}
🔑 Password: ${formData.password}

The student can login using either their email or matric number along with the password.
      `.trim();
            console.log(loginInfo);
            alert(loginInfo);
            toast.success(`Student created successfully!`);
            onSuccess();
            onOpenChange(false);
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                matricNo: "",
                phoneNumber: "",
                dateOfBirth: "",
                gender: "",
                level: "100",
                college: "",
                department: "",
                address: "",
                password: "",
            });
            setErrors({});
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
                            errors?: Record<string, string>;
                        };
                    };
                    message?: string;
                };
                console.error("Error response:", axiosError.response);
                if (axiosError.response?.data?.errors) {
                    setErrors(axiosError.response.data.errors);
                    toast.error("Please fix the validation errors");
                    return;
                }
                if (axiosError.response?.status === 409 || axiosError.response?.status === 400) {
                    const errorMsg = axiosError.response?.data?.message || axiosError.response?.data?.error;
                    if (errorMsg?.toLowerCase().includes('email')) {
                        setErrors({ email: errorMsg });
                    }
                    else if (errorMsg?.toLowerCase().includes('matric')) {
                        setErrors({ matricNo: errorMsg });
                    }
                    toast.error(errorMsg || "Student with this email or matric number already exists");
                    return;
                }
                const errorMessage = axiosError.response?.data?.message ||
                    axiosError.response?.data?.error ||
                    axiosError.message ||
                    "Failed to create student";
                toast.error(errorMessage);
            }
            else {
                toast.error("Failed to create student");
            }
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Create a new student account with login credentials
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))} placeholder="John"/>
                {errors.firstName && (<p className="text-xs text-red-500">{errors.firstName}</p>)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Doe"/>
                {errors.lastName && (<p className="text-xs text-red-500">{errors.lastName}</p>)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="gender">
                  Gender <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.gender} onValueChange={(value: "male" | "female") => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (<p className="text-xs text-red-500">{errors.gender}</p>)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="john.doe@example.com"/>
                {errors.email && (<p className="text-xs text-red-500">{errors.email}</p>)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input id="phoneNumber" type="tel" value={formData.phoneNumber} onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))} placeholder="08012345678"/>
                {errors.phoneNumber && (<p className="text-xs text-red-500">{errors.phoneNumber}</p>)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="123 Main Street, City"/>
            </div>
          </div>

          
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-semibold text-foreground">Academic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="matricNo">
                Matric Number <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input id="matricNo" value={formData.matricNo} onChange={(e) => setFormData(prev => ({ ...prev, matricNo: e.target.value.toUpperCase() }))} placeholder="BU22CSC1005" className="flex-1"/>
                <Button type="button" variant="outline" onClick={generateMatricNo} disabled={!formData.college || !formData.level}>
                  <RefreshCw className="h-4 w-4"/>
                </Button>
              </div>
              {errors.matricNo && (<p className="text-xs text-red-500">{errors.matricNo}</p>)}
              <p className="text-xs text-muted-foreground">
                Select college and level first, then click refresh to auto-generate
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">
                Level <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
                <SelectTrigger>
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
              {errors.level && (<p className="text-xs text-red-500">{errors.level}</p>)}
            </div>

            <div className="space-y-2">
              <Label htmlFor="college">
                College <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.college} onValueChange={(value) => setFormData(prev => ({ ...prev, college: value }))} disabled={loadingColleges}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingColleges ? "Loading..." : "Select college"}/>
                </SelectTrigger>
                <SelectContent>
                  {colleges.map((college) => (<SelectItem key={college._id} value={college._id}>
                      {college.name} ({college.code})
                    </SelectItem>))}
                </SelectContent>
              </Select>
              {errors.college && (<p className="text-xs text-red-500">{errors.college}</p>)}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">
                Department <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))} disabled={!formData.college || loadingDepartments}>
                <SelectTrigger>
                  <SelectValue placeholder={!formData.college
            ? "Select college first"
            : loadingDepartments
                ? "Loading..."
                : "Select department"}/>
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (<SelectItem key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </SelectItem>))}
                </SelectContent>
              </Select>
              {errors.department && (<p className="text-xs text-red-500">{errors.department}</p>)}
            </div>
          </div>

          
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-semibold text-foreground">Login Credentials</h3>
            
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder="Enter password"/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={generatePassword} disabled={!formData.firstName}>
                  <RefreshCw className="h-4 w-4"/>
                </Button>
              </div>
              {errors.password && (<p className="text-xs text-red-500">{errors.password}</p>)}
              <p className="text-xs text-muted-foreground">
                Student will use their email or matric number with this password to login
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Login Details:</strong><br />
                Username: {formData.email || formData.matricNo || "(email or matric number)"}<br />
                Password: {formData.password || "(password will be set)"}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);
}
