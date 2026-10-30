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

  // 2. (POST) WARRANTY-REQUEST
  async createWarrantyRequest(payload: {
    warranty_request_description: string;
    warranty_id: number;
    warranty_request_type_id: number;
  }) {
    const response = await adminAxios.post(
      `${WARRANTY_SERVICE_URL}/warranty-request`,
      payload,
    );

    return response.data;
  },
};