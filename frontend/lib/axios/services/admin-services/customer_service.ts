import { adminAxios } from "../../admin-axios";

// CALL DIRECT API
const CUSTOMER_SERVICE_URL = "http://localhost:3002/api/v1/admin-session/customer-service";

// CALL THROUGH API GATEWAY (NGINX)
// const CUSTOMER_SERVICE_URL = "http://localhost/api/v1/admin-session/customer-service";

export const adminCustomerService = {
    // 1. GET USER LIST - SEARCH & FILTER
    async getCustomerList(params?: {search?: string; status?: string;}) {
        const response = await adminAxios.get(`${CUSTOMER_SERVICE_URL}/customer-list`, {params});
        return response.data;
    },
};