import { CUSTOMER_URLS } from '@/constants/api';
import { customerAxios } from '@/lib/axios/customer-axios';

export const customerPromotionService = {
  async getDirectDiscount(sku: string) {
    const response = await customerAxios.get(`${CUSTOMER_URLS.promotion}/direct-discount`, {
      params: { sku },
    });
    return response.data;
  },

  async getDirectDiscounts(skus: string[]) {
    const response = await customerAxios.post(
      `${CUSTOMER_URLS.promotion}/direct-discounts`,
      { skus },
    );
    return response.data;
  },

  async getAllCoupons() {
    const response = await customerAxios.get(`${CUSTOMER_URLS.promotion}/coupons`);
    return response.data;
  },
};
