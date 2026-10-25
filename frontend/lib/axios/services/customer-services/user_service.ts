import { customerAxios } from "../../customer-axios";

const USER_SERVICE_URL = "http://localhost:3001/api/v1/customer-session/user-service";

export const customerUserService = {
    // 1. (POST) LOGOUT ADMIN
    async logout() {
        const sessionId = sessionStorage.getItem("customerSessionId");
        const response = await customerAxios.post(`${USER_SERVICE_URL}/logout`, { session_id: sessionId });
        return response.data;
    },

    // 2. (GET) ACCOUNT-INFORMATION
    async getAccountInformation() {
        const response = await customerAxios.get(`${USER_SERVICE_URL}/account-information`);
        return response.data;
    },
};