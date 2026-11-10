import { CUSTOMER_URLS } from "@/constants/api";
import { customerAxios } from "../../customer-axios";

export const customerBranchService = {
  async getBranchList(status?: string) {
    const response = await customerAxios.get(
      `${CUSTOMER_URLS.branch}/branch-list`,
      {
        params: { status },
      },
    );
    return response.data;
  },
};
