"use client";
import { create } from "zustand";
import api from "@/services/api";
interface Department {
    _id: string;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    studentCount?: number;
}
interface College {
    _id: string;
    name: string;
    code: string;
    description?: string;
    deanName?: string;
    deanEmail?: string;
    isActive: boolean;
    departments?: Department[];
    createdAt?: string;
    updatedAt?: string;
}
interface Statistics {
    totalColleges: number;
    totalDepartments: number;
    totalStudents: number;
    activeColleges: number;
    inactiveColleges: number;
    collegesBreakdown: Array<{
        id: string;
        name: string;
        code: string;
        departmentCount: number;
        studentCount: number;
        isActive: boolean;
    }>;
}
interface Student {
    _id: string;
    firstName: string;
    lastName: string;
    matricNo: string;
    email: string;
    level: number;
    paymentStatus: string;
    reservationStatus?: string;
    assignedHostel?: {
        _id: string;
        name: string;
        code: string;
    };
    assignedRoom?: {
        _id: string;
        roomNumber: string;
    };
    college?: {
        _id: string;
        name: string;
        code: string;
    };
    department?: {
        _id: string;
        name: string;
        code: string;
    };
}
interface DepartmentsResponse {
    college: {
        id: string;
        name: string;
        code: string;
    };
    departments: Department[];
    total: number;
}
interface StudentsResponse {
    college: {
        id: string;
        name: string;
        code: string;
    };
    department?: {
        id: string;
        name: string;
        code: string;
    };
    students: Student[];
    totalPages: number;
    currentPage: number;
    total: number;
}
interface CollegeStore {
    colleges: College[];
    statistics: Statistics | null;
    currentCollege: College | null;
    currentDepartments: Department[];
    currentStudents: Student[];
    studentsTotal: number;
    studentsTotalPages: number;
    studentsCurrentPage: number;
    loading: boolean;
    error: string | null;
    fetchColleges: () => Promise<void>;
    fetchCollegeById: (id: string) => Promise<College | null>;
    fetchStatistics: () => Promise<void>;
    createCollege: (data: Partial<College>) => Promise<College>;
    updateCollege: (id: string, data: Partial<College>) => Promise<College>;
    deleteCollege: (id: string, force?: boolean) => Promise<void>;
    fetchDepartmentsByCollege: (collegeId: string) => Promise<DepartmentsResponse>;
    createDepartment: (collegeId: string, data: {
        name: string;
        code: string;
        description?: string;
    }) => Promise<Department>;
    updateDepartment: (collegeId: string, deptId: string, data: Partial<Department>) => Promise<Department>;
    deleteDepartment: (collegeId: string, deptId: string, force?: boolean) => Promise<void>;
    fetchStudentsByCollege: (collegeId: string, params?: Record<string, unknown>) => Promise<StudentsResponse>;
    fetchStudentsByDepartment: (collegeId: string, deptId: string, params?: Record<string, unknown>) => Promise<StudentsResponse>;
    updateStudent: (id: string, data: Partial<Student>) => Promise<Student>;
    deleteStudent: (id: string, permanent?: boolean) => Promise<void>;
    setError: (error: string | null) => void;
    clearError: () => void;
    clearCurrentCollege: () => void;
    clearCurrentDepartments: () => void;
    clearCurrentStudents: () => void;
}
export const useCollegeStore = create<CollegeStore>((set) => ({
    colleges: [],
    statistics: null,
    currentCollege: null,
    currentDepartments: [],
    currentStudents: [],
    studentsTotal: 0,
    studentsTotalPages: 0,
    studentsCurrentPage: 1,
    loading: false,
    error: null,
    fetchColleges: async () => {
        try {
            set({ loading: true, error: null });
            const response = await api.get("/admin/colleges");
            set({ colleges: response.data.data || [], loading: false });
        }
        catch (error: unknown) {
            const errorMessage = error && typeof error === "object" && "response" in error
                ? String((error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response
                    ?.data?.message || "Failed to fetch colleges")
                : "Failed to fetch colleges";
            set({ error: errorMessage, loading: false });
        }
    },
    fetchCollegeById: async (id: string) => {
        try {
            set({ loading: true, error: null });
            const response = await api.get("/admin/colleges");
            const colleges = response.data.data || [];
            const college = colleges.find((c: College) => c._id === id);
            if (college) {
                set({ currentCollege: college, loading: false });
                return college;
            }
            else {
                set({ error: "College not found", loading: false });
                return null;
            }
        }
        catch (error: unknown) {
            const errorMessage = error && typeof error === "object" && "response" in error
                ? String((error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response
                    ?.data?.message || "Failed to fetch college")
                : "Failed to fetch college";
            set({ error: errorMessage, loading: false });
            return null;
        }
    },
    fetchStatistics: async () => {
        try {
            const response = await api.get("/admin/colleges/statistics");
            set({ statistics: response.data.data || null });
        }
        catch (error: unknown) {
            const errorMessage = error && typeof error === "object" && "response" in error
                ? String((error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response
                    ?.data?.message || "Failed to fetch statistics")
                : "Failed to fetch statistics";
            console.error(errorMessage);
        }
    },
    createCollege: async (data: Partial<College>) => {
        try {
            set({ loading: true, error: null });
            const response = await api.post("/admin/colleges", data);
            const newCollege = response.data.data;
            set((state) => ({
                colleges: [...state.colleges, newCollege],
                loading: false,
            }));
            return newCollege;
        }
        catch (error: unknown) {
            const errorMessage = error && typeof error === "object" && "response" in error
                ? String((error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response
                    ?.data?.message || "Failed to create college")
                : "Failed to create college";
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },
    updateCollege: async (id: string, data: Partial<College>) => {
        try {
            set({ loading: true, error: null });
            const response = await api.put(`/admin/colleges/${id}`, data);
            const updatedCollege = response.data.data;
            set((state) => ({
                colleges: state.colleges.map((c) => (c._id === id ? updatedCollege : c)),
                currentCollege: state.currentCollege?._id === id ? updatedCollege : state.currentCollege,
                loading: false,
            }));
            return updatedCollege;
        }
        catch (error: unknown) {
            const errorMessage = error && typeof error === "object" && "response" in error
                ? String((error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response
                    ?.data?.message || "Failed to update college")
                : "Failed to update college";
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },
    deleteCollege: async (id: string, force = false) => {
        try {
            set({ loading: true, error: null });
            await api.delete(`/admin/colleges/${id}?force=${force}`);
            set((state) => ({
                colleges: state.colleges.filter((c) => c._id !== id),
                loading: false,
            }));
        }
        catch (error: unknown) {
            const errorMessage = error && typeof error === "object" && "response" in error
                ? String((error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response
                    ?.data?.message || "Failed to delete college")
                : "Failed to delete college";
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },
    fetchDepartmentsByCollege: async (collegeId: string) => {
        try {
            set({ loading: true, error: null });
            const response = await api.get(`/admin/colleges/${collegeId}/departments`);
            const data = response.data.data as DepartmentsResponse;
            set({
                currentDepartments: data.departments || [],
                loading: false
            });
            return data;
        }
        catch (error: unknown) {
            const errorMessage = error && typeof error === "object" && "response" in error
                ? String((error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response
                    ?.data?.message || "Failed to fetch departments")
                : "Failed to fetch departments";
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },
    createDepartment: async (collegeId: string, data: {
        name: string;
        code: string;
        description?: string;
    }) => {
        try {
            set({ loading: true, error: null });
            const response = await api.post(`/admin/colleges/${collegeId}/departments`, data);
            const newDept = response.data.data.department;
            set((state) => ({
                currentDepartments: [...state.currentDepartments, newDept],
                loading: false,
            }));
            return newDept;
        }
        catch (error: unknown) {
            const errorMessage = error && typeof error === "object" && "response" in error
                ? String((error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response
                    ?.data?.message || "Failed to create department")
                : "Failed to create department";
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },
    updateDepartment: async (collegeId: string, deptId: string, data: Partial<Department>) => {
        try {
            set({ loading: true, error: null });
            const response = await api.put(`/admin/colleges/${collegeId}/departments/${deptId}`, data);
            const updatedDept = response.data.data;
            set((state) => ({
                currentDepartments: state.currentDepartments.map((d) => d._id === deptId ? updatedDept : d),
                loading: false,
            }));
            return updatedDept;
        }
        catch (error: unknown) {
            const errorMessage = error && typeof error === "object" && "response" in error
                ? String((error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response
                    ?.data?.message || "Failed to update department")
                : "Failed to update department";
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },
    deleteDepartment: async (collegeId: string, deptId: string, force = false) => {
        try {
            set({ loading: true, error: null });
            await api.delete(`/admin/colleges/${collegeId}/departments/${deptId}?force=${force}`);
            set((state) => ({
                currentDepartments: state.currentDepartments.filter((d) => d._id !== deptId),
                loading: false,
            }));
        }
        catch (error: unknown) {
            const errorMessage = error && typeof error === "object" && "response" in error
                ? String((error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response
                    ?.data?.message || "Failed to delete department")
                : "Failed to delete department";
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },
    fetchStudentsByCollege: async (collegeId: string, params?: Record<string, unknown>) => {
        try {
            set({ loading: true, error: null });
            const response = await api.get(`/admin/colleges/${collegeId}/students`, { params });
            const data = response.data.data as StudentsResponse;
            set({
                currentStudents: data.students || [],
                studentsTotal: data.total || 0,
                studentsTotalPages: data.totalPages || 0,
                studentsCurrentPage: data.currentPage || 1,
                loading: false
            });
            return data;
        }
        catch (error: unknown) {
            const errorMessage = error && typeof error === "object" && "response" in error
                ? String((error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response
                    ?.data?.message || "Failed to fetch students")
                : "Failed to fetch students";
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },
    fetchStudentsByDepartment: async (collegeId: string, deptId: string, params?: Record<string, unknown>) => {
        try {
            set({ loading: true, error: null });
            const response = await api.get(`/admin/colleges/${collegeId}/departments/${deptId}/students`, { params });
            const data = response.data.data as StudentsResponse;
            set({
                currentStudents: data.students || [],
                studentsTotal: data.total || 0,
                studentsTotalPages: data.totalPages || 0,
                studentsCurrentPage: data.currentPage || 1,
                loading: false
            });
            return data;
        }
        catch (error: unknown) {
            const errorMessage = error && typeof error === "object" && "response" in error
                ? String((error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response
                    ?.data?.message || "Failed to fetch students")
                : "Failed to fetch students";
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },
    updateStudent: async (id: string, data: Partial<Student>) => {
        try {
            set({ loading: true, error: null });
            const response = await api.put(`/admin/students/${id}`, data);
            const updatedStudent = response.data.data as Student;
            set((state) => ({
                currentStudents: state.currentStudents.map((s) => s._id === id ? updatedStudent : s),
                loading: false,
            }));
            return updatedStudent;
        }
        catch (error: unknown) {
            const errorMessage = error && typeof error === "object" && "response" in error
                ? String((error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response
                    ?.data?.message || "Failed to update student")
                : "Failed to update student";
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },
    deleteStudent: async (id: string, permanent = false) => {
        try {
            set({ loading: true, error: null });
            await api.delete(`/admin/students/${id}?permanent=${permanent}`);
            set((state) => ({
                currentStudents: state.currentStudents.filter((s) => s._id !== id),
                studentsTotal: state.studentsTotal - 1,
                loading: false,
            }));
        }
        catch (error: unknown) {
            const errorMessage = error && typeof error === "object" && "response" in error
                ? String((error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response
                    ?.data?.message || "Failed to delete student")
                : "Failed to delete student";
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },
    setError: (error: string | null) => set({ error }),
    clearError: () => set({ error: null }),
    clearCurrentCollege: () => set({ currentCollege: null }),
    clearCurrentDepartments: () => set({ currentDepartments: [] }),
    clearCurrentStudents: () => set({
        currentStudents: [],
        studentsTotal: 0,
        studentsTotalPages: 0,
        studentsCurrentPage: 1
    }),
}));
