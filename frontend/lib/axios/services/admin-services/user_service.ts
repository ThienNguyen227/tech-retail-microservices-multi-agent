import { adminAxios } from "../../admin-axios";

const USER_SERVICE_URL = "http://localhost:3001/api/v1/admin-session/user-service";

export const adminUserService = {
    // 1. GET PROFILE
    async getProfile() {
        const response = await adminAxios.get(`${USER_SERVICE_URL}/profile`);
        return response.data;
    }
};