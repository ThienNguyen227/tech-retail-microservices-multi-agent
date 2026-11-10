import { CUSTOMER_URLS } from "@/constants/api";
import { customerAxios } from "../../customer-axios";

export type CreateOrderPayload = {
  userId: string;
  fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";
  branchId: number;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  ward: string;
  province: string;
  items: {
    sku: string;
    productName: string;
    imageUrl: string;
    quantity: number;
    price: number;
    subtotal: number;
    promotionId: number | string | null;
    promotionName: string | null;
    directDiscountAmount: number;
  }[];
  subtotal: number;
  shippingFee: number;
  couponId: number | null;
  couponName: string | null;
  couponDiscountAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
};

export const customerOrderService = {
  async createOrder(orderData: CreateOrderPayload) {
    const response = await customerAxios.post(
      `${CUSTOMER_URLS.order}/order`,
      orderData,
    );
    return response.data;
  },
};
