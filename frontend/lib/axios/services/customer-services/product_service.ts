import { customerAxios } from "../../customer-axios";

// CALL DIRECT API
// const PRODUCT_SERVICE_URL = "http://localhost:3003/api/v1/customer-session/product-service";

// CALL THROUGH API GATEWAY (NGINX)
const PRODUCT_SERVICE_URL = "http://localhost/api/v1/customer-session/product-service";

export const customerProductService = {
  // ======================================== PRODUCT MODULE =================================================//

  // 1. (GET) PRODUCT LIST
  async getProductList(category: string, brand?: string) {
    const response = await customerAxios.get(
      `${PRODUCT_SERVICE_URL}/product-list`,
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
      `${PRODUCT_SERVICE_URL}/brand-list`,
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
      `${PRODUCT_SERVICE_URL}/product-detail`,
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
      `${PRODUCT_SERVICE_URL}/compare-phones`,
      {
        ids,
      },
    );

    return response.data;
  },

  // 5. (POST) COMPARE LAPTOPS
  async compareLaptops(ids: string[]) {
    const response = await customerAxios.post(
      `${PRODUCT_SERVICE_URL}/compare-laptops`,
      {
        ids,
      },
    );

    return response.data;
  },

  // 6. (POST) COMPARE LAPTOPS
  async compareTablets(ids: string[]) {
    const response = await customerAxios.post(
      `${PRODUCT_SERVICE_URL}/compare-tablets`,
      {
        ids,
      },
    );

    return response.data;
  },
};