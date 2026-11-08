import { customerAxios } from "../../customer-axios";

// CALL DIRECT API
// const PROMOTION_SERVICE_URL = "http://localhost:3008/api/v1/customer-session/promotion-service";

// CALL THROUGH API GATEWAY (NGINX)
const PROMOTION_SERVICE_URL = "http://localhost/api/v1/customer-session/promotion-service";

export const customerPromotionService = {
  // ======================================== PROMOTION MODULE =================================================//

  // 1. (GET) DIRECT DISCOUNT BY SKU
  async getDirectDiscount(sku: string) {
    const response = await customerAxios.get(
      `${PROMOTION_SERVICE_URL}/direct-discount`,
      {
        params: { sku },
      },
    );

    return response.data;
  },

  // 2. (POST) GET DIRECT DISCOUNTS BY MULTIPLE SKUS
  async getDirectDiscounts(skus: string[]) {
    const response = await customerAxios.post(
      `${PROMOTION_SERVICE_URL}/direct-discounts`,
      { skus },
    );

    return response.data;
  },

  // 3. (GET) GET ALL COUPONS
  async getAllCoupons() {
    const response = await customerAxios.get(
      `${PROMOTION_SERVICE_URL}/coupons`,
    );

    return response.data;
  },
};