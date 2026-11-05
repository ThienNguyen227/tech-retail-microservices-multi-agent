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

export const customerCartService = {
  async getCart() {
    const response = await customerAxios.get(`${CUSTOMER_URLS.cart}/cart`);
    return response.data;
  },

  async addItem(payload: AddCartItemPayload) {
    const response = await customerAxios.post(`${CUSTOMER_URLS.cart}/item`, payload);
    return response.data;
  },

  async updateQuantity(payload: { sku: string; action: 'increase' | 'decrease' }) {
    const response = await customerAxios.put(
      `${CUSTOMER_URLS.cart}/item/quantity`,
      payload,
    );
    return response.data;
  },

  async removeItem(sku: string) {
    const response = await customerAxios.delete(`${CUSTOMER_URLS.cart}/item`, {
      params: { sku },
    });
    return response.data;
  },

  async clearCart() {
    const response = await customerAxios.delete(`${CUSTOMER_URLS.cart}/all-items`);
    return response.data;
  },
};
