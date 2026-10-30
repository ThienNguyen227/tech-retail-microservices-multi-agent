import { adminAxios } from "../../admin-axios";

// CALL DIRECT API
const WARRANTY_SERVICE_URL = "http://localhost:3010/api/v1/admin-session/warranty-service";

// CALL THROUGH API GATEWAY (NGINX)
// const WARRANTY_SERVICE_URL = "http://localhost/api/v1/admin-session/warranty-service";

export const adminWarrantyService = {
  // ======================================== CUSTOMER_INFORMATION MODULE =================================================//

  // 1. (GET) WARRANTY-LIST
  async getWarrantyList(search?: string, status?: string) {
    const response = await adminAxios.get(
      `${WARRANTY_SERVICE_URL}/warranty-list`,
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