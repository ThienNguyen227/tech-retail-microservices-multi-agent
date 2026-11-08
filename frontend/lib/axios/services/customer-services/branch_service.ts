import { customerAxios } from "../../customer-axios";

// CALL DIRECT API
// const BRANCH_SERVICE_URL = "http://localhost:3005/api/v1/customer-session/branch-service";

// CALL THROUGH API GATEWAY (NGINX)
const BRANCH_SERVICE_URL = "http://localhost/api/v1/customer-session/branch-service";

export const customerBranchService = {
  // 1. (GET) BRANCH LIST
  async getBranchList(status?: string) {
    const response = await customerAxios.get(
      `${BRANCH_SERVICE_URL}/branch-list`,
      {
        params: { status },
      },
    );

    return response.data;
  },
};