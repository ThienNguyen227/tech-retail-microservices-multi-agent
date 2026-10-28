import { adminAxios } from "../../admin-axios";

// CALL DIRECT API
const CUSTOMER_SERVICE_URL = "http://localhost:3002/api/v1/admin-session/customer-service";

// CALL THROUGH API GATEWAY (NGINX)
// const CUSTOMER_SERVICE_URL = "http://localhost/api/v1/admin-session/customer-service";

interface UpdateCustomerListDto {
    customer_code?: string;
    customer_full_name?: string;
    customer_date_of_birth?: string;
    customer_gender?: string;
    customer_status?: "ACTIVE" | "INACTIVE" | "BLOCKED";
}

export const adminCustomerService = {
    //============================================= CUSTOMER-LIST MODULE ==================================================================//
    // 1. (GET) CUSTOMER-LIST
    async getCustomerList(params?: {search?: string; status?: string;}) {
        const response = await adminAxios.get(`${CUSTOMER_SERVICE_URL}/customer-list`, {params});
        return response.data;
    },

    // 2. (PATCH) CUSTOMER-LIST
    async updateCustomer(customerId: string, data: UpdateCustomerListDto) {
        const response = await adminAxios.patch(`${CUSTOMER_SERVICE_URL}/customer/${customerId}`, data);
        return response.data;
    },
};