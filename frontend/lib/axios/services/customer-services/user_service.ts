import { customerAxios } from "../../customer-axios";

// CALL DIRECT API
// const USER_SERVICE_URL = "http://localhost:3001/api/v1/customer-session/user-service";

// CALL THROUGH API GATEWAY (NGINX)
const USER_SERVICE_URL = "http://localhost/api/v1/customer-session/user-service";

export const customerUserService = {
    // ======================================== REGISTER MODULE =================================================//

    // 1. (POST) SEND OTP FOR REGISTRATION
    async sendOtp(data: {user_email: string; user_phone: string;}) {
        const response = await customerAxios.post(`${USER_SERVICE_URL}/register/otp-sending`, data);
        return response.data;
    },

    // 2. (POST) RESEND OTP FOR REGISTRATION
    async resendOtp(data: {user_email: string;}) {
        const response = await customerAxios.post(`${USER_SERVICE_URL}/register/otp-resending`, data);
        return response.data;
    },

    // 3. (POST) VERIFY OTP FOR REGISTRATION
    async verifyOtp(data: {user_email: string; otp_code: string; user_name: string; user_phone: string; user_password_hash: string;}) {
        const response = await customerAxios.post(`${USER_SERVICE_URL}/register/otp-verifying`, data,);
        return response.data;
    },

    // ======================================== FORGOT_PASSWORD MODULE =================================================//

    // 4. (POST) SEND OTP FOR FORGOT PASSWORD
    async sendOtpForgotPassword(data: { user_email: string }) {
        const response = await customerAxios.post(`${USER_SERVICE_URL}/forgot-password/otp-sending`, data);
        return response.data;
    },

    // 5. (POST) RESEND OTP FOR FORGOT PASSWORD
    async resendOtpForgotPassword(data: { user_email: string }) {
        const response = await customerAxios.post(`${USER_SERVICE_URL}/forgot-password/otp-resending`, data);
        return response.data;
    },

    // 6. (POST) VERIFY OTP FOR FORGOT PASSWORD
    async verifyOtpForgotPassword(data: {user_email: string; otp_code: string;}) {
        const response = await customerAxios.post(`${USER_SERVICE_URL}/forgot-password/otp-verifying`, data);
        return response.data;
    },

    // 7. (POST) CHANGE PASSWORD FOR FORGOT PASSWORD
    async changePasswordForgotPassword(data: {user_id: string; new_password: string;}) {
        const response = await customerAxios.post(`${USER_SERVICE_URL}/forgot-password/password-change`, data);
        return response.data;
    },

    // ======================================== LOGIN MODULE =================================================//

    // 8. (POST) LOGIN
    async login(data: {user_email: string; user_password: string;}) {
        const response = await customerAxios.post(`${USER_SERVICE_URL}/login`, data);
        return response.data;
    },

    // ======================================== LOGOUT MODULE =================================================//

    // 9. (POST) LOGOUT ADMIN
    async logout() {
        const sessionId = sessionStorage.getItem("customerSessionId");
        const response = await customerAxios.post(`${USER_SERVICE_URL}/logout`, { session_id: sessionId });
        return response.data;
    },

    // ======================================== ACCOUNT_INFORMATION MODULE =================================================//

    // 10. (GET) ACCOUNT-INFORMATION
    async getAccountInformation() {
        const response = await customerAxios.get(`${USER_SERVICE_URL}/account-information`);
        return response.data;
    },

    // 11. (PATCH) UPDATE ACCOUNT-INFORMATION
    async updateAccountInformation(data: {user_name?: string; user_phone?: string;}) {
        const response = await customerAxios.patch(`${USER_SERVICE_URL}/account-information`, data);
        return response.data;
    },
};