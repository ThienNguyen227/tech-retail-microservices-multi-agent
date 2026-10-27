import { customerAxios } from "../../customer-axios";

// CALL DIRECT API
const CUSTOMER_SERVICE_URL = "http://localhost:3002/api/v1/customer-session/customer-service";

// CALL THROUGH API GATEWAY (NGINX)
// const CUSTOMER_SERVICE_URL = "http://localhost/api/v1/customer-session/customer-service";

export const customerCustomerService = {
    // ======================================== CUSTOMER_INFORMATION MODULE =================================================//

    // 1. (GET) ACCOUNT-INFORMATION
    async getCustomerInformation() {
        const response = await customerAxios.get(`${CUSTOMER_SERVICE_URL}/customer-information`);
        return response.data;
    },

    // // 11. (PATCH) UPDATE ACCOUNT-INFORMATION
    // async updateAccountInformation(data: {user_name?: string; user_phone?: string;}) {
    //     const response = await customerAxios.patch(`${USER_SERVICE_URL}/account-information`, data);
    //     return response.data;
    // },
};