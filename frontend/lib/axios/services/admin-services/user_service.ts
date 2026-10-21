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
};