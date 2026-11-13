import { CUSTOMER_URLS } from '@/constants/api';
import { customerAxios } from '@/lib/axios/customer-axios';

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
  action: 'increase' | 'decrease';
};

export const customerCartService = {
  // 1. (GET) CART
  async getCart() {
    const response = await customerAxios.get(`${CUSTOMER_URLS.cart}/cart`);
    return response.data;
  },

  // 2. (POST) ADD ITEM
  async addItem(payload: AddCartItemPayload) {
    const response = await customerAxios.post(
      `${CUSTOMER_URLS.cart}/item`,
      payload,
    );
    return response.data;
  },

  // 3. (PUT) UPDATE ITEM QUANTITY
  async updateQuantity(payload: UpdateCartQuantityPayload) {
    const response = await customerAxios.put(
      `${CUSTOMER_URLS.cart}/item/quantity`,
      payload,
    );
    return response.data;
  },

  // 4. (DELETE) REMOVE ITEM
  async removeItem(sku: string) {
    const response = await customerAxios.delete(`${CUSTOMER_URLS.cart}/item`, {
      params: { sku },
    });
    return response.data;
  },

  // 5. (DELETE) CLEAR CART
  async clearCart() {
    const response = await customerAxios.delete(
      `${CUSTOMER_URLS.cart}/all-items`,
    );
    return response.data;
  },
};
