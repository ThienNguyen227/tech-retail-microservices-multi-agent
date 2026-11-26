import { adminAxios } from "../../admin-axios";

// CALL DIRECT API
// const WARRANTY_SERVICE_URL = "http://localhost:3010/api/v1/admin-session/warranty-service";

// CALL THROUGH API GATEWAY (NGINX)
const WARRANTY_SERVICE_URL =
  "http://localhost/api/v1/admin-session/warranty-service";

export const adminWarrantyService = {
  // ======================================== WARRANTY MODULE =================================================//

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

  // 3. (PATCH) UPDATE WARRANTY REQUEST STATUS
  async updateWarrantyRequest(
    warrantyRequestId: number,
    payload: {
      warranty_request_status_id: number;
    },
  ) {
    const response = await adminAxios.patch(
      `${WARRANTY_SERVICE_URL}/warranty-request/${warrantyRequestId}/status`,
      payload,
    );

    return response.data;
  },
};