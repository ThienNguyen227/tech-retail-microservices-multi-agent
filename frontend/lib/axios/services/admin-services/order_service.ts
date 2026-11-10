
import { adminAxios } from "../../admin-axios";

// CALL DIRECT API
// const ORDER_SERVICE_URL = "http://localhost:3007/api/v1/admin-session/order-service";

// CALL THROUGH API GATEWAY (NGINX)
const ORDER_SERVICE_URL = "http://localhost/api/v1/admin-session/order-service";

export const adminOrderService = {
  // ======================================== ORDER MODULE =================================================//

  // 1. (GET) ORDER-LIST
  async getOrderList(
    search?: string,
    processingStatus?: string,
    paymentStatus?: string,
  ) {
    const response = await adminAxios.get(
      `${ORDER_SERVICE_URL}/order-list`,
      {
        params: {
          ...(search?.trim() && { search: search.trim() }),
          ...(processingStatus && { processingStatus }),
          ...(paymentStatus && { paymentStatus }),
        },
      },
    );

    return response.data;
  },

  // 2. (PATCH) UPDATE ORDER PROCESSING STATUS
  async updateOrderProcessingStatus(
    orderId: number,
    processingStatus: string,
  ) {
    const response = await adminAxios.patch(
      `${ORDER_SERVICE_URL}/order/${orderId}/processing-status`,
      {
        processing_status: processingStatus,
      },
    );

    return response.data;
  },
};
