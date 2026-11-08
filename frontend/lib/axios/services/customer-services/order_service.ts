import { customerAxios } from "../../customer-axios";

// CALL DIRECT API
// const ORDER_SERVICE_URL = "http://localhost:3007/api/v1/customer-session/order-service";

// CALL THROUGH API GATEWAY (NGINX)
const ORDER_SERVICE_URL = "http://localhost/api/v1/customer-session/order-service";

export const customerOrderService = {
  // CUSTOMR-SESSION
  
  // 1. (GET) ORDER-LIST
  async getOrderList() {
    const response = await customerAxios.get(`${ORDER_SERVICE_URL}/order-list`);
    return response.data;
  },

  // 2. (PATCH) CANCEL-ORDER
  async cancelOrder(orderId: number) {
    const response = await customerAxios.patch(
      `${ORDER_SERVICE_URL}/${orderId}/cancel`,
    );

    return response.data;
  },

  // 3. (POST) CREATE-ORDER
  async createOrder(orderData: any) {
    const response = await customerAxios.post(
      `${ORDER_SERVICE_URL}/order`,
      orderData,
    );

    return response.data;
  },
};