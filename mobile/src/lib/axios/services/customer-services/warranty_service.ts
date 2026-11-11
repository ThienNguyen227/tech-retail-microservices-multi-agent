import { CUSTOMER_URLS } from "@/constants/api";
import { customerAxios } from "../../customer-axios";

export const customerCustomerService = {
  // ======================================== CUSTOMER_INFORMATION MODULE =================================================//

  // 1. (GET) WARRANTY-INFORMATION
  async getWarranty(search?: string, status?: string) {
    const response = await customerAxios.get(
      `${CUSTOMER_URLS.warranty}/warranty-infomation`,
      {
        params: {
          ...(search?.trim() && { search: search.trim() }),
          ...(status && { status }),
        },
      },
    );

    return response.data;
  },
};