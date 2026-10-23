import { adminAxios } from "../../admin-axios";

const USER_SERVICE_URL = "http://localhost:3001/api/v1/admin-session/user-service";

export const adminUserService = {
    // 1. GET PROFILE
    async getProfile() {
        const response = await adminAxios.get(`${USER_SERVICE_URL}/profile`);
        return response.data;
    },

    // 2. UPDATE PROFILE
    async updateProfile(data: {user_name?: string; user_phone?: string;}) {
        const response = await adminAxios.patch(`${USER_SERVICE_URL}/profile`, data);
        return response.data;
    },

    // 3. GET USER LIST - SEARCH & FILTER
    async getUserList(params?: {search?: string; role?: string; status?: string;}) {
        const response = await adminAxios.get(`${USER_SERVICE_URL}/user-list`, {params});
        return response.data;
    },

    // 4. UPDATE USER STATUS - KHÓA / MỞ KHÓA TÀI KHOẢN
    async updateUserStatus(data: {targetUserId: string; status: "ACTIVE" | "INACTIVE" | "BLOCKED";}) {
        const response = await adminAxios.patch(`${USER_SERVICE_URL}/status`, data);
        return response.data;
    },

    // 5. CREATE EMPLOYEE
    async createEmployee(data: {
        user_name: string;
        user_email: string;
        user_phone: string;
        user_password: string;
        user_status: string;
        role_name: string;
        employee_full_name: string;
        employee_gender: string;
        employee_date_of_birth: string;
        employee_address: string;
        employee_status: string;
    }) {
        const response = await adminAxios.post(`${USER_SERVICE_URL}/employee`, data);
        return response.data;
    },

    // 6. LOGOUT ADMIN
    async logout() {
        const sessionId = sessionStorage.getItem("adminSessionId");
        const response = await adminAxios.post(`${USER_SERVICE_URL}/logout`, { session_id: sessionId });
        return response.data;
    },

    // 7. UPDATE USER - CẬP NHẬT THÔNG TIN VÀ VAI TRÒ TÀI KHOẢN
    async updateUser(data: {
        targetUserId: string;
        user_name: string;
        user_email: string;
        user_phone: string;
        roles: string[];
    }) {
        const response = await adminAxios.patch(`${USER_SERVICE_URL}/user`, data);
        return response.data;
    },

    // 8. GET EMPLOYEE LIST - SEARCH & FILTER
    async getEmployeeList(params?: {search?: string; role?: string; gender?: string; status?: string;}) {
        const response = await adminAxios.get(`${USER_SERVICE_URL}/employee-list`, { params });
        return response.data;
    },

    // 9. GET EMPLOYEE INFORMATION
    async getEmployeeInformation() {
        const response = await adminAxios.get(`${USER_SERVICE_URL}/employee-information`);
        return response.data;
    },
};