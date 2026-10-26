import { customerAxios } from "../../customer-axios";

const USER_SERVICE_URL = "http://localhost:3001/api/v1/customer-session/user-service";

export const customerUserService = {
    // (POST) LOGIN
    async login(data: {user_email: string; user_password: string;}) {
        const response = await customerAxios.post(`${USER_SERVICE_URL}/login`, data);
        return response.data;
    },

    // (POST) LOGOUT ADMIN
    async logout() {
        const sessionId = sessionStorage.getItem("customerSessionId");
        const response = await customerAxios.post(`${USER_SERVICE_URL}/logout`, { session_id: sessionId });
        return response.data;
    },

    // (GET) ACCOUNT-INFORMATION
    async getAccountInformation() {
        const response = await customerAxios.get(`${USER_SERVICE_URL}/account-information`);
        return response.data;
    },

    // (PATCH) UPDATE ACCOUNT-INFORMATION
    async updateAccountInformation(data: {user_name?: string; user_phone?: string;}) {
        const response = await customerAxios.patch(`${USER_SERVICE_URL}/account-information`, data);
        return response.data;
    },
};