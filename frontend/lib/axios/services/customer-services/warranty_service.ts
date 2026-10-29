import { customerAxios } from "../../customer-axios";

// CALL DIRECT API
const WARRANTY_SERVICE_URL = "http://localhost:3010/api/v1/customer-session/warranty-service";

// CALL THROUGH API GATEWAY (NGINX)
// const WARRANTY_SERVICE_URL = "http://localhost/api/v1/customer-session/warranty-service";

export const customerCustomerService = {
  // ======================================== CUSTOMER_INFORMATION MODULE =================================================//

  // 1. (GET) WARRANTY-INFORMATION
  async getWarranty(search?: string, status?: string) {
    const response = await customerAxios.get(
      `${WARRANTY_SERVICE_URL}/warranty-infomation`,
      {
        params: {
          ...(search?.trim() && { search: search.trim() }),
          ...(status && { status }),
        },
      },
    );

    return response.data;
  },
};