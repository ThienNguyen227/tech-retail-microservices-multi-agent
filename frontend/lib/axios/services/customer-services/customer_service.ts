import { customerAxios } from "../../customer-axios";

// CALL DIRECT API
const CUSTOMER_SERVICE_URL = "http://localhost:3002/api/v1/customer-session/customer-service";

// CALL THROUGH API GATEWAY (NGINX)
// const CUSTOMER_SERVICE_URL = "http://localhost/api/v1/customer-session/customer-service";

export const customerCustomerService = {
  // ======================================== CUSTOMER_INFORMATION MODULE =================================================//

  // 1. (GET) CUSTOMER-INFORMATION
  async getCustomerInformation() {
    const response = await customerAxios.get(`${CUSTOMER_SERVICE_URL}/customer-information`);
    return response.data;
  },

  // 2. (PATCH) CUSTOMER-INFORMATION
  async updateCustomerInformation(payload: {
    customer_full_name: string | null;
    customer_date_of_birth: string | null;
    customer_gender: string | null;
  }) {
    return customerAxios.patch(`${CUSTOMER_SERVICE_URL}/customer-information`, payload);
  },

  // 3. (POST) CUSTOMER-ADDRESS
  async createCustomerAddress(payload: {
    customer_address_line: string;
    customer_address_ward: string;
    customer_address_province: string;
    customer_address_default: boolean;
  }) {
    return customerAxios.post(`${CUSTOMER_SERVICE_URL}/customer-address`, payload);
  },

  // 4. (PATCH) CUSTOMER-ADDRESS
  async updateCustomerAddress(
    addressId: string,
    payload: {
      customer_address_line: string;
      customer_address_ward: string;
      customer_address_province: string;
      customer_address_default: boolean;
    },
  ) {
    return customerAxios.patch(`${CUSTOMER_SERVICE_URL}/customer-address/${addressId}`, payload);
  },

  // 5. (DELETE) CUSTOMER-ADDRESS
  async deleteCustomerAddress(addressId: string) {
    return customerAxios.delete(`${CUSTOMER_SERVICE_URL}/customer-address/${addressId}`);
  },
};