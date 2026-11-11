import { CUSTOMER_URLS } from "@/constants/api";
import { customerAxios } from "../../customer-axios";

export const customerOrderService = {
  // CUSTOMR-SESSION

  // 1. (GET) ORDER-LIST
  async getOrderList() {
    const response = await customerAxios.get(`${CUSTOMER_URLS.order}/order-list`);
    return response.data;
  },

  // 2. (PATCH) CANCEL-ORDER
  async cancelOrder(orderId: number) {
    const response = await customerAxios.patch(
      `${CUSTOMER_URLS.order}/${orderId}/cancel`,
    );

    return response.data;
  },

  // 3. (POST) CREATE-ORDER
  async createOrder(orderData: any) {
    const response = await customerAxios.post(
      `${CUSTOMER_URLS.order}/order`,
      orderData,
    );

    return response.data;
  },
};