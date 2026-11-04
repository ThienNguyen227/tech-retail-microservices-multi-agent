import { CUSTOMER_URLS } from '@/constants/api';
import { customerAxios } from '@/lib/axios/customer-axios';

export const customerProductService = {
  async getProductList(category: string, brand?: string) {
    const response = await customerAxios.get(`${CUSTOMER_URLS.product}/product-list`, {
      params: { category, ...(brand ? { brand } : {}) },
    });
    return response.data;
  },

  async getBrandList(category: string) {
    const response = await customerAxios.get(`${CUSTOMER_URLS.product}/brand-list`, {
      params: { category },
    });
    return response.data;
  },

  async getProductDetail(slug: string) {
    const response = await customerAxios.get(`${CUSTOMER_URLS.product}/product-detail`, {
      params: { name: slug },
    });
    return response.data;
  },
};
