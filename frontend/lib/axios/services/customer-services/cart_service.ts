import { customerAxios } from "../../customer-axios";

// CALL DIRECT API
const CART_API_URL = 'http://localhost:3004/api/v1/customer-session/cart-service';

// CALL THROUGH API GATEWAY (NGINX)
// const CART_API_URL = "http://localhost/api/v1/customer-session/customer-service";

export type AddCartItemPayload = {
  userId: string;
  item: {
    productId: string;
    sku: string;
    variantSlug: string;
    productName: string;
    imageUrl: string;
    quantity: number;
    price: number;
  };
};

export type UpdateCartQuantityPayload = {
  sku: string;
  action: "increase" | "decrease";
};

export const customerCartService = {
  // 1. (GET) CART
  async getCart() {
    const response = await customerAxios.get(`${CART_API_URL}/cart`);
    return response.data;
  },

  // 2. (POST) ADD ITEM
  async addItem(payload: AddCartItemPayload) {
    const response = await customerAxios.post(`${CART_API_URL}/item`, payload);
    return response.data;
  },

  // 3. (PUT) UPDATE ITEM QUANTITY
  async updateQuantity(payload: UpdateCartQuantityPayload) {
    const response = await customerAxios.put(
      `${CART_API_URL}/item/quantity`,
      payload,
    );
    return response.data;
  },

  // 4. (DELETE) REMOVE ITEM
  async removeItem(sku: string) {
    const response = await customerAxios.delete(`${CART_API_URL}/item`, {
      params: { sku },
    });
    return response.data;
  },

  // 5. (DELETE) CLEAR CART
  async clearCart() {
    const response = await customerAxios.delete(`${CART_API_URL}/all-items`);
    return response.data;
  },
};