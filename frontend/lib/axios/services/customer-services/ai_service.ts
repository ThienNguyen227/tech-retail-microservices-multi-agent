
import { customerAxios } from "../../customer-axios";

// CALL THROUGH API GATEWAY (NGINX)
// const AI_SERVICE_URL = "http://localhost/api/v1/ai-service";

//
const AI_SERVICE_URL = "http://127.0.0.1:8000/api/v1/ai-service";

// REQUEST
export interface ProductChatRequest {
  message: string;
  userId: string;
  conversationId?: string | null;
}

// RESPONSE
export interface ProductChatResponse {
  conversation_id: string;
  message: string;
}

export const aiService = {
  // 1. (POST) PRODUCT CHAT
  async productChat(
    data: ProductChatRequest,
  ): Promise<ProductChatResponse> {
    const message = data.message.trim();
    const userId = data.userId.trim();

    if (!message) {
      throw new Error("Message không được để trống.");
    }

    if (!userId) {
      throw new Error("Không tìm thấy User ID.");
    }

    const params: {
      message: string;
      user_id: string;
      conversation_id?: string;
    } = {
      message,
      user_id: userId,
    };

    if (data.conversationId?.trim()) {
      params.conversation_id = data.conversationId.trim();
    }

    const response = await customerAxios.post<ProductChatResponse>(
      `${AI_SERVICE_URL}/product`,
      null,
      {
        params,
      },
    );

    return response.data;
  },
};
