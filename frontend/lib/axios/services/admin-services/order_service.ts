
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

  // 2. (PATCH) ORDER-PROCESSING-STATUS
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

  // 3. (PATCH) ORDER-LIST
  async updateOrder(
    orderId: number,
    payload: {
      order_recipient_name?: string;
      order_recipient_phone?: string;
      order_address_line?: string;
      order_ward?: string;
      order_province?: string;

      order_order_delivery_method_id?: number;
      order_order_payment_method_id?: number;

      order_coupon_id?: number | null;
      order_coupon_name?: string | null;
      order_coupon_discount_amount?: number | null;

      order_subtotal?: number;
      order_shipping_fee?: number;
      order_discount_amount?: number;
      order_total_amount?: number;
    },
  ) {
    const response = await adminAxios.patch(
      `${ORDER_SERVICE_URL}/order/${orderId}`,
      payload,
    );

    return response.data;
  },
};
