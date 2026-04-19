import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 120000,
});
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));
api.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});
export const authAPI = {
    login: (credentials: {
        identifier: string;
        password: string;
    }) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data: Record<string, unknown>) => api.put('/auth/profile', data),
    uploadProfilePicture: (formData: FormData) => api.post('/student/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),
    changePassword: (oldPassword: string, newPassword: string, confirmPassword: string) => api.post('/auth/change-password', { oldPassword, newPassword, confirmPassword }),
};
export const adminAPI = {
    getDashboard: () => api.get('/admin/dashboard'),
    search: (params: Record<string, unknown>) => api.get('/admin/search', { params }),
    getColleges: () => api.get('/admin/colleges'),
    getCollegeStatistics: () => api.get('/admin/colleges/statistics'),
    createCollege: (data: Record<string, unknown>) => api.post('/admin/colleges', data),
    updateCollege: (id: string, data: Record<string, unknown>) => api.put(`/admin/colleges/${id}`, data),
    deleteCollege: (id: string, force?: boolean) => api.delete(`/admin/colleges/${id}?force=${force || false}`),
    getDepartments: () => api.get('/admin/departments'),
    getDepartmentsByCollege: (collegeId: string) => api.get(`/admin/colleges/${collegeId}/departments`),
    createDepartment: (collegeId: string, data: Record<string, unknown>) => api.post(`/admin/colleges/${collegeId}/departments`, data),
    updateDepartment: (collegeId: string, deptId: string, data: Record<string, unknown>) => api.put(`/admin/colleges/${collegeId}/departments/${deptId}`, data),
    deleteDepartment: (collegeId: string, deptId: string, force?: boolean) => api.delete(`/admin/colleges/${collegeId}/departments/${deptId}?force=${force || false}`),
    getStudentsByCollege: (collegeId: string, params?: Record<string, unknown>) => api.get(`/admin/colleges/${collegeId}/students`, { params }),
    getStudentsByDepartment: (collegeId: string, deptId: string, params?: Record<string, unknown>) => api.get(`/admin/colleges/${collegeId}/departments/${deptId}/students`, { params }),
    getStudents: (params?: Record<string, unknown>) => api.get('/admin/students', { params }),
    createStudent: (data: Record<string, unknown>) => api.post('/admin/students', data),
    updateStudent: (id: string, data: Record<string, unknown>) => api.put(`/admin/students/${id}`, data),
    updateStudentPassword: (id: string, password: string) => api.patch(`/admin/students/${id}/password`, { password }, { timeout: 60000 }),
    downloadStudentImportTemplate: () => api.get('/admin/students/import-template', { responseType: 'blob' }),
    deleteStudent: (id: string, permanent?: boolean) => api.delete(`/admin/students/${id}?permanent=${permanent || false}`),
    forceDeleteStudent: (id: string) => api.post(`/admin/students/${id}/force-delete`, {}),
    resetStudentPassword: (id: string, data: {
        password: string;
    }) => api.patch(`/admin/students/${id}/password`, data, { timeout: 60000 }),
    bulkUploadStudents: (formData: FormData) => api.post('/admin/students/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getHostels: () => api.get('/admin/hostels'),
    createHostel: (data: Record<string, unknown>) => api.post('/admin/hostels', data),
    downloadHostelImportTemplate: () => api.get('/admin/hostels/import-template', { responseType: 'blob' }),
    bulkUploadHostels: (formData: FormData) => api.post('/admin/hostels/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    updateHostel: (id: string, data: Record<string, unknown>) => api.put(`/admin/hostels/${id}`, data),
    deleteHostel: (id: string, permanent = true) => api.delete(`/admin/hostels/${id}?permanent=${permanent}`),
    getRooms: () => api.get('/admin/rooms'),
    createRoom: (data: Record<string, unknown>) => api.post('/admin/rooms', data),
    downloadRoomImportTemplate: () => api.get('/admin/rooms/import-template', { responseType: 'blob' }),
    bulkUploadRooms: (formData: FormData) => api.post('/admin/rooms/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    updateRoom: (id: string, data: Record<string, unknown>) => api.put(`/admin/rooms/${id}`, data),
    deleteRoom: (id: string) => api.delete(`/admin/rooms/${id}`),
    getPorters: () => api.get('/admin/porters'),
    approvePorter: (porterId: string, hostelId: string) => api.post('/admin/porters/approve', { porterId, hostelId }),
    createPorter: (data: Record<string, unknown>) => api.post('/admin/porters', data),
    reassignHostel: (porterId: string, hostelId: string) => api.post('/admin/porters/assign-hostel', { porterId, hostelId }),
    getNotificationHistory: (params?: Record<string, unknown>) => api.get('/admin/notifications/history', { params }),
    sendTestNotification: (data: Record<string, unknown>) => api.post('/admin/notifications/test', data),
    sendBroadcastNotification: (data: Record<string, unknown>) => api.post('/admin/notifications/broadcast', data),
    getPayments: (params?: Record<string, unknown>) => api.get('/admin/payments', { params }),
    getPaymentStats: () => api.get('/admin/payment/stats'),
    getPaymentAmount: () => api.get('/admin/payment/amount'),
    setPaymentAmount: (amount: number) => api.post('/admin/payment/set-amount', { amount }),
};
export const studentAPI = {
    getDashboard: () => api.get('/student/dashboard'),
    getAlerts: () => api.get('/student/alerts'),
    getNotifications: () => api.get('/student/notifications'),
    markNotificationsRead: (payload: {
        ids?: string[];
        markAll?: boolean;
    }) => api.post('/student/notifications/read', payload),
    getInvitationHistory: () => api.get('/student/invitations/history'),
    getHostels: () => api.get('/student/hostels'),
    getRooms: (hostelId: string) => api.get(`/student/hostels/${hostelId}/rooms`),
    getBunks: (roomId: string) => api.get(`/student/rooms/${roomId}/bunks`),
    previewReservationInvite: (payload: {
        roomId: string;
        matricNo: string;
        hostelId?: string;
    }) => api.post('/student/reservation/invite-preview', payload, {
        validateStatus: (status) => status >= 200 && status < 500,
    }),
    reserveRoom: (data: Record<string, unknown>) => api.post('/student/reservations', data),
    addGroupMembers: (reservationId: string, matricNumbers: string[]) => api.post('/student/reservation/members', {
        reservationId,
        matrics: matricNumbers,
    }),
    removeGroupMember: (memberId: string) => api.delete(`/student/reservation/members/${memberId}`),
    getReservation: () => api.get('/student/reservation'),
    respondToInvitation: (action: 'approve' | 'reject') => api.post('/student/reservation/respond', { action }),
};
export const porterAPI = {
    apply: (data: Record<string, unknown>) => api.post('/porter/apply', data),
    getDashboard: () => api.get('/porter/dashboard'),
    getStudents: () => api.get('/porter/students'),
    getRooms: () => api.get('/porter/rooms'),
    checkInStudent: (studentId: string) => api.post(`/porter/checkin/${studentId}`),
    releaseExpired: () => api.post('/porter/release-expired'),
};
export const paymentAPI = {
    getAmount: () => api.get('/student/payment/amount'),
    initialize: (amount: number) => api.post('/student/payment/initialize', { amount }),
    getStatus: () => api.get('/student/payment/status'),
    verify: (reference: string) => api.get(`/student/payment/verify/${reference}`),
    verifyWithCode: (paymentCode: string) => api.post('/student/payment/verify-code', { paymentCode }),
    resendCode: () => api.post('/student/payment/resend-code'),
};
export default api;
