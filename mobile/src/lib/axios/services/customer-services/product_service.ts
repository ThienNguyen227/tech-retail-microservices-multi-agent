import { CUSTOMER_URLS } from '@/constants/api';
import { customerAxios } from '@/lib/axios/customer-axios';

export const customerProductService = {
  // ======================================== PRODUCT MODULE =================================================//

  // 1. (GET) PRODUCT LIST
  async getProductList(category: string, brand?: string) {
    const response = await customerAxios.get(
      `${CUSTOMER_URLS.product}/product-list`,
      {
        params: {
          category,
          ...(brand && { brand }),
        },
      },
    );

    return response.data;
  },

  // 2. (GET) BRAND LIST
  async getBrandList(category: string) {
    const response = await customerAxios.get(
      `${CUSTOMER_URLS.product}/brand-list`,
      {
        params: {
          category,
        },
      },
    );

    return response.data;
  },

  // 3. (GET) PRODUCT DETAIL
  async getProductDetail(slug: string) {
    const response = await customerAxios.get(
      `${CUSTOMER_URLS.product}/product-detail`,
      {
        params: {
          name: slug,
        },
      },
    );

    return response.data;
  },

  // 4. (POST) COMPARE PHONES
  async comparePhones(ids: string[]) {
    const response = await customerAxios.post(
      `${CUSTOMER_URLS.product}/compare-phones`,
      {
        ids,
      },
    );

    return response.data;
  },

  // 5. (POST) COMPARE LAPTOPS
  async compareLaptops(ids: string[]) {
    const response = await customerAxios.post(
      `${CUSTOMER_URLS.product}/compare-laptops`,
      {
        ids,
      },
    );

    return response.data;
  },

  // 6. (POST) COMPARE TABLETS
  async compareTablets(ids: string[]) {
    const response = await customerAxios.post(
      `${CUSTOMER_URLS.product}/compare-tablets`,
      {
        ids,
      },
    );

    return response.data;
  },
};
