# import os
# import time
# import json
# import logging
# from typing import List, TypedDict

# from dotenv import load_dotenv
# from pymongo import MongoClient

# from langchain_ollama import ChatOllama
# from langchain_core.messages import (
#     SystemMessage,
#     HumanMessage,
#     AIMessage,
# )
# from langgraph.graph import StateGraph, MessagesState, START, END
# from langgraph.prebuilt import ToolNode
# from langgraph.checkpoint.mongodb import MongoDBSaver
# from transformers import AutoTokenizer

# from .single_agent_prompt import SINGLE_AGENT_PROMPT

# # ============================================================
# # 1. IMPORT TOOLS
# # ============================================================

# # USER-SERVICE
# from tools.user_tools import search_user

# # CUSTOMER-SERVICE
# from tools.customer_tools import (
#     search_customer,
#     get_customer_addresses,
# )

# # PRODUCT-SERVICE
# from tools.product_tools import (
#     get_phone_detail,
#     get_laptop_detail,
#     get_tablet_detail,
#     compare_phones,
#     compare_laptops,
#     compare_tablets,
#     search_products,
# )

# # BRANCH-SERVICE
# from tools.branch_tools import get_branch_address

# # ORDER-SERVICE
# from tools.order_tools import create_order

# # PROMOTION_SERVICE
# from tools.promotion_tools import (
#     get_all_coupons, 
#     get_direct_discount,
#     get_direct_discounts,
# )

# # ============================================================
# # 2. ENVIRONMENT
# # ============================================================

# load_dotenv()

# logger = logging.getLogger(__name__)

# OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL")
# MONGODB_URI = os.getenv("MONGODB_URI")

# if not OLLAMA_BASE_URL:
#     raise RuntimeError("Thiếu biến môi trường OLLAMA_BASE_URL.")

# if not MONGODB_URI:
#     raise RuntimeError("Thiếu biến môi trường MONGODB_URI.")


# # ============================================================
# # 3. LLM CONFIGURATION
# # ============================================================


# # Context Window
# MODEL_NUM_CTX = int(
#     os.getenv("AGENT_NUM_CTX", "16384")
# )

# # Output budget
# MODEL_NUM_PREDICT = int(
#     os.getenv("AGENT_NUM_PREDICT", "512")
# )

# # Tool Schema budget
# TOOL_SCHEMA_RESERVE_TOKENS = int(
#     os.getenv("AGENT_TOOL_SCHEMA_RESERVE", "5000")
# )

# # Dành ngân sách cho kết quả Tool
# TOOL_RESULT_RESERVE_TOKENS = int(
#     os.getenv("AGENT_TOOL_RESULT_RESERVE", "2500")
# )

# # Safety margin
# CONTEXT_SAFETY_MARGIN = 1024

# # Maximum budget for messages
# MAX_SAFE_MESSAGE_TOKENS = (
#     MODEL_NUM_CTX
#     - MODEL_NUM_PREDICT
#     - TOOL_SCHEMA_RESERVE_TOKENS
#     - TOOL_RESULT_RESERVE_TOKENS
#     - CONTEXT_SAFETY_MARGIN
# )

# if MAX_SAFE_MESSAGE_TOKENS <= 0:
#     raise RuntimeError(
#         "Cấu hình context không hợp lệ."
#     )

# print(
#     "[CONTEXT CONFIG]",
#     {
#         "model_ctx": MODEL_NUM_CTX,
#         "output": MODEL_NUM_PREDICT,
#         "tool_schema": TOOL_SCHEMA_RESERVE_TOKENS,
#         "tool_result": TOOL_RESULT_RESERVE_TOKENS,
#         "safety_margin": CONTEXT_SAFETY_MARGIN,
#         "safe_message_budget": MAX_SAFE_MESSAGE_TOKENS,
#     }
# )

# # LLM chính: suy luận và quyết định gọi Tool.
# llm = ChatOllama(
#     model="qwen3.5:4b",
#     base_url=OLLAMA_BASE_URL,
#     temperature=0,
#     reasoning=False,
#     num_ctx=MODEL_NUM_CTX,
#     num_predict=MODEL_NUM_PREDICT,
#     keep_alive="30m",
# )


# # LLM tóm tắt lịch sử.
# SUMMARIZER_NUM_CTX = min(MODEL_NUM_CTX, 8192)

# summarizer_llm = ChatOllama(
#     model="qwen3.5:4b",
#     base_url=OLLAMA_BASE_URL,
#     temperature=0,
#     reasoning=False,
#     num_ctx=SUMMARIZER_NUM_CTX,
#     num_predict=512,
#     keep_alive="30m",
# )

# # ============================================================
# # QWEN TOKENIZER
# # ============================================================

# TOKENIZER_NAME = "Qwen/Qwen3.5-4B"

# print("[TOKENIZER] Loading Qwen tokenizer...")

# tokenizer = AutoTokenizer.from_pretrained(
#     TOKENIZER_NAME,
#     use_fast=True,
# )

# print("[TOKENIZER] Qwen tokenizer loaded successfully.")


# # ============================================================
# # 4. TOOL CONFIGURATION
# # ============================================================

# tools = [
#     # USER
#     search_user,

#     # CUSTOMER
#     search_customer,
#     get_customer_addresses,

#     # PRODUCT
#     get_phone_detail,
#     get_laptop_detail,
#     get_tablet_detail,
#     compare_phones,
#     compare_laptops,
#     compare_tablets,
#     search_products,

#     # BRANCH
#     get_branch_address,

#     # ORDER
#     create_order,

#     # PROMOTION
#     get_all_coupons,
#     get_direct_discount,
#     get_direct_discounts,
# ]

# # Agent có quyền lựa chọn các Tool.
# llm_with_tools = llm.bind_tools(tools)

# # Thực thi Tool Call.
# tool_node = ToolNode(tools)


# # ============================================================
# # 5. CONTEXT MANAGEMENT CONFIGURATION
# # ============================================================

# # Khi prompt vượt ngân sách an toàn, bắt đầu tóm tắt.
# #
# # Không còn sử dụng SUMMARY_TRIGGER_TOKENS riêng biệt.
# # Việc kích hoạt Summary dựa trên tổng prompt thực tế.
# #
# # Giữ lại các lượt hội thoại gần nhất chưa tóm tắt.
# KEEP_RECENT_TOKENS = 2500

# # Mỗi lần gửi cho Summarizer một phần lịch sử có giới hạn.
# MAX_SUMMARIZER_CHUNK_TOKENS = 4500

# # Giới hạn kích thước văn bản lịch sử gửi cho Summarizer.
# MAX_SUMMARIZER_HISTORY_CHARS = 24000

# # Mỗi lần chạy summarize_node có thể tóm tắt nhiều đợt.
# MAX_SUMMARIZER_ROUNDS = 8

# # Giới hạn Summary để tránh Summary liên tục phình to.
# MAX_SUMMARY_TARGET_TOKENS = 700


# # ============================================================
# # 6. STATE
# # ============================================================

# class SingleAgentState(MessagesState):
#     summary: str
#     summarized_message_count: int


# # ============================================================
# # 7. RUNTIME CONTEXT
# # ============================================================

# class AgentRuntimeContext(TypedDict):
#     user_id: str
#     access_token: str


# # ============================================================
# # 8. HELPER FUNCTIONS
# # ============================================================

# def content_to_text(content) -> str:
#     """
#     Chuyển nội dung message thành string.

#     Hỗ trợ:
#     - String
#     - List
#     - Content blocks dạng dictionary
#     """

#     if isinstance(content, str):
#         return content

#     if isinstance(content, list):
#         parts = []

#         for item in content:
#             if isinstance(item, str):
#                 parts.append(item)

#             elif isinstance(item, dict):
#                 text = item.get("text")

#                 if isinstance(text, str):
#                     parts.append(text)

#         return "\n".join(parts)

#     return str(content) if content is not None else ""


# def get_token_ids_length(encoded) -> int:
#     """
#     Lấy chính xác số token từ output của tokenizer.

#     Hỗ trợ:
#     - List[int]
#     - List[List[int]]
#     - BatchEncoding
#     - Dictionary chứa input_ids
#     - Tensor
#     """

#     # BatchEncoding / Dictionary
#     if hasattr(encoded, "keys"):
#         input_ids = encoded.get("input_ids")

#         if input_ids is not None:
#             encoded = input_ids

#     # Tensor / NumPy
#     if hasattr(encoded, "shape"):
#         return int(encoded.shape[-1])

#     # List hoặc Tuple
#     if isinstance(encoded, (list, tuple)):

#         if (
#             encoded
#             and isinstance(encoded[0], (list, tuple))
#         ):
#             return len(encoded[0])

#         return len(encoded)

#     raise TypeError(
#         f"Không xác định được kiểu token output: {type(encoded)}"
#     )


# def count_tokens(messages) -> int:
#     """
#     Đếm token bằng Qwen tokenizer.

#     Bao gồm:
#     - Message content
#     - AI Tool Calls
#     - Tool arguments
#     """

#     if not messages:
#         return 0

#     chat_messages = []

#     for message in messages:

#         content = content_to_text(
#             message.content
#         )

#         if message.type == "system":
#             role = "system"

#         elif message.type == "human":
#             role = "user"

#         elif message.type == "tool":
#             role = "tool"

#         elif message.type == "ai":
#             role = "assistant"

#             tool_calls = getattr(
#                 message,
#                 "tool_calls",
#                 [],
#             ) or []

#             if tool_calls:

#                 tool_call_text = json.dumps(
#                     tool_calls,
#                     ensure_ascii=False,
#                     default=str,
#                 )

#                 content += (
#                     "\n[TOOL CALLS]\n"
#                     + tool_call_text
#                 )

#         else:
#             role = "user"

#         chat_messages.append({
#             "role": role,
#             "content": content,
#         })

#     try:

#         encoded = tokenizer.apply_chat_template(
#             chat_messages,
#             tokenize=True,
#             add_generation_prompt=True,
#         )

#         return get_token_ids_length(encoded)

#     except Exception:

#         logger.exception(
#             "[QWEN TOKENIZER ERROR]"
#         )

#         serialized_text = "\n".join(
#             f"{message['role']}: {message['content']}"
#             for message in chat_messages
#         )

#         return (
#             len(
#                 tokenizer.encode(
#                     serialized_text,
#                     add_special_tokens=False,
#                 )
#             )
#             + len(chat_messages) * 8
#             + 4
#         )


# def normalize_summarized_count(
#     value,
#     total_messages: int,
# ) -> int:
#     """Giới hạn summarized_message_count trong phạm vi hợp lệ."""

#     if not isinstance(value, int):
#         return 0

#     return max(
#         0,
#         min(value, total_messages),
#     )


# def get_safe_summarized_count(
#     messages,
#     value,
# ) -> int:
#     """
#     Đảm bảo summarized_message_count không nằm giữa
#     một lượt hội thoại.

#     Nếu index nằm giữa AI Tool Call và ToolMessage,
#     đưa index về đầu lượt HumanMessage tương ứng.
#     """

#     index = normalize_summarized_count(
#         value,
#         len(messages),
#     )

#     if 0 < index < len(messages):

#         while (
#             index > 0
#             and messages[index].type != "human"
#         ):
#             index -= 1

#     return index


# def find_last_human_index(messages) -> int:
#     """Tìm vị trí HumanMessage gần nhất."""

#     for index in range(
#         len(messages) - 1,
#         -1,
#         -1,
#     ):
#         if messages[index].type == "human":
#             return index

#     raise RuntimeError(
#         "Không tìm thấy HumanMessage."
#     )


# def split_messages_into_turns(messages) -> List[list]:
#     """
#     Chia lịch sử thành từng lượt hội thoại hoàn chỉnh.

#     Ví dụ:

#     Human
#       AI
#       Tool
#       AI
#       Tool
#       AI

#     Human
#       AI

#     Mỗi lượt bao gồm toàn bộ Tool Calling phát sinh
#     cho đến trước HumanMessage tiếp theo.
#     """

#     turns = []
#     current_turn = []

#     for message in messages:

#         if (
#             message.type == "human"
#             and current_turn
#         ):
#             turns.append(current_turn)
#             current_turn = []

#         current_turn.append(message)

#     if current_turn:
#         turns.append(current_turn)

#     return turns


# # ============================================================
# # 9. MESSAGE FORMATTING FOR SUMMARY
# # ============================================================

# def format_message_for_summary(message) -> str:
#     """
#     Chuyển message sang dạng văn bản để Summarizer đọc.

#     Đặc biệt giữ lại:
#     - Nội dung HumanMessage.
#     - Nội dung AIMessage.
#     - Tên Tool được gọi.
#     - Arguments của Tool.
#     - Kết quả ToolMessage.
#     """

#     message_type = message.type.upper()

#     content = content_to_text(
#         message.content
#     )

#     result = f"[{message_type}]\n{content}"

#     # Giữ lại thông tin Tool Call trong AIMessage.
#     tool_calls = getattr(
#         message,
#         "tool_calls",
#         [],
#     ) or []

#     if tool_calls:

#         tool_call_text = []

#         for call in tool_calls:

#             name = call.get("name", "unknown")
#             args = call.get("args", {})

#             try:
#                 args_text = json.dumps(
#                     args,
#                     ensure_ascii=False,
#                     default=str,
#                 )

#             except Exception:
#                 args_text = str(args)

#             tool_call_text.append(
#                 f"Tool: {name}\n"
#                 f"Arguments: {args_text}"
#             )

#         result += (
#             "\n[TOOL CALLS]\n"
#             + "\n".join(tool_call_text)
#         )

#     # Giữ tên Tool nếu message có thuộc tính name.
#     message_name = getattr(
#         message,
#         "name",
#         None,
#     )

#     if message_name:
#         result += f"\nTool Name: {message_name}"

#     return result


# def messages_to_summary_text(
#     messages,
#     max_chars: int = MAX_SUMMARIZER_HISTORY_CHARS,
# ) -> str:
#     """
#     Chuyển nhiều messages thành văn bản.

#     Có giới hạn ký tự để tránh gửi một lịch sử quá lớn
#     sang Summarizer.
#     """

#     parts = []
#     used_chars = 0

#     for message in messages:

#         text = format_message_for_summary(message)

#         remaining = max_chars - used_chars

#         if remaining <= 0:
#             parts.append(
#                 "[Phần lịch sử còn lại đã được lược bỏ do giới hạn đầu vào.]"
#             )
#             break

#         if len(text) > remaining:

#             text = (
#                 text[:remaining]
#                 + "\n[Nội dung đã được rút gọn.]"
#             )

#             parts.append(text)
#             break

#         parts.append(text)
#         used_chars += len(text)

#     return "\n\n".join(parts)


# # ============================================================
# # 10. BUILD MODEL MESSAGES
# # ============================================================

# def build_model_messages_from_parts(
#     history,
#     summary: str,
#     summarized_count: int,
# ) -> list:
#     """
#     Xây dựng prompt hoàn chỉnh cho Agent.

#     Cấu trúc:

#     1. System Prompt
#     2. Summary
#     3. Lịch sử chưa summarize
#     4. Lượt hội thoại hiện tại

#     Không đưa các message đã được summarize vào prompt lần nữa.
#     """

#     if not history:
#         raise RuntimeError(
#             "Không có message trong hội thoại."
#         )

#     last_human_index = find_last_human_index(
#         history
#     )

#     safe_count = get_safe_summarized_count(
#         history,
#         summarized_count,
#     )

#     safe_count = min(
#         safe_count,
#         last_human_index,
#     )

#     # Các lượt cũ chưa được summarize.
#     previous_messages = history[
#         safe_count:last_human_index
#     ]

#     # Giữ nguyên toàn bộ lượt hiện tại.
#     current_turn_messages = history[
#         last_human_index:
#     ]

#     model_messages = [
#         SystemMessage(
#             content=SINGLE_AGENT_PROMPT
#         )
#     ]

#     if summary:

#         model_messages.append(
#             SystemMessage(
#                 content=(
#                     "TÓM TẮT NGỮ CẢNH HỘI THOẠI:\n\n"
#                     f"{summary}\n\n"
#                     "Hãy sử dụng Summary làm thông tin tham khảo "
#                     "cho hội thoại hiện tại.\n"
#                     "Ưu tiên kết quả Tool mới nhất khi có mâu thuẫn "
#                     "với thông tin trong Summary.\n"
#                     "Không tự suy diễn những thông tin không được xác nhận."
#                 )
#             )
#         )

#     model_messages.extend(
#         previous_messages
#     )

#     model_messages.extend(
#         current_turn_messages
#     )

#     return model_messages


# def build_model_messages(
#     state: SingleAgentState,
# ) -> list:
#     """Xây dựng prompt từ LangGraph State."""

#     return build_model_messages_from_parts(
#         history=state.get("messages", []),
#         summary=state.get("summary", ""),
#         summarized_count=state.get(
#             "summarized_message_count",
#             0,
#         ),
#     )


# # ============================================================
# # 11. SELECT OLD HISTORY CHUNK
# # ============================================================

# def select_oldest_turn_chunk(
#     pending_messages,
# ) -> list:
#     """
#     Chọn các lượt hội thoại cũ nhất để summarize.

#     Quy tắc:

#     - Không cắt giữa Tool Call và Tool Result.
#     - Ưu tiên giữ lại các lượt gần nhất.
#     - Chỉ lấy một phần lịch sử cũ mỗi lần summarize.
#     - Nếu chỉ còn một lượt cũ, có thể summarize lượt đó
#       vì lượt hiện tại vẫn được giữ riêng.
#     """

#     if not pending_messages:
#         return []

#     turns = split_messages_into_turns(
#         pending_messages
#     )

#     if not turns:
#         return []

#     # Xác định phần lịch sử gần nhất cần giữ lại.
#     keep_start = len(turns)
#     recent_tokens = 0

#     for index in range(
#         len(turns) - 1,
#         -1,
#         -1,
#     ):

#         turn_tokens = count_tokens(
#             turns[index]
#         )

#         if (
#             recent_tokens + turn_tokens
#             <= KEEP_RECENT_TOKENS
#         ):
#             keep_start = index
#             recent_tokens += turn_tokens

#         else:
#             break

#     # Nếu tất cả lượt đều nằm trong KEEP_RECENT_TOKENS
#     # nhưng prompt vẫn vượt ngân sách, summarize ít nhất
#     # lượt cũ nhất.
#     if keep_start == 0:
#         keep_start = 1

#     old_turns = turns[:keep_start]

#     if not old_turns:
#         return []

#     selected_chunk = []
#     selected_tokens = 0

#     for turn in old_turns:

#         turn_tokens = count_tokens(turn)

#         if (
#             selected_chunk
#             and selected_tokens + turn_tokens
#             > MAX_SUMMARIZER_CHUNK_TOKENS
#         ):
#             break

#         # Nếu một lượt riêng lẻ đã vượt giới hạn chunk,
#         # vẫn lấy nguyên lượt để không cắt Tool sequence.
#         selected_chunk.extend(turn)

#         selected_tokens += turn_tokens

#         if (
#             selected_tokens
#             >= MAX_SUMMARIZER_CHUNK_TOKENS
#         ):
#             break

#     return selected_chunk


# # ============================================================
# # 12. SUMMARIZER
# # ============================================================

# async def summarize_history_chunk(
#     old_summary: str,
#     messages_to_summarize,
# ) -> str:
#     """
#     Tóm tắt một phần lịch sử cũ.

#     Summary mới phải kết hợp với Summary trước đó.
#     """

#     history_text = messages_to_summary_text(
#         messages_to_summarize
#     )

#     summarizer_prompt = """
# Bạn là hệ thống quản lý ngữ cảnh hội thoại cho AI Agent.

# Nhiệm vụ:
# Kết hợp bản tóm tắt trước đó với lịch sử hội thoại mới
# để tạo ra một bản tóm tắt ngữ cảnh ngắn gọn.

# ƯU TIÊN GIỮ LẠI:

# 1. Thông tin người dùng đã cung cấp và đã được xác nhận.
# 2. Mục đích và yêu cầu hiện tại của người dùng.
# 3. Các quyết định đã được thống nhất.
# 4. Thông tin sản phẩm:
#    - Tên sản phẩm.
#    - SKU.
#    - ID.
#    - Thông số quan trọng.
#    - Kết quả Tool đã xác nhận.
# 5. Thông tin khách hàng và tài khoản cần thiết cho nghiệp vụ.
# 6. Thông tin địa chỉ và chi nhánh đã được xác nhận.
# 7. Thông tin đơn hàng:
#    - Order ID.
#    - Trạng thái.
#    - Sản phẩm.
#    - Số lượng.
#    - Giá trị.
#    - Phương thức nhận hàng.
# 8. Những thông tin cần thiết để Agent tiếp tục thực hiện
#    các bước Tool tiếp theo.

# QUY TẮC:

# - Không tự suy diễn hoặc tạo dữ liệu.
# - Không biến thông tin chưa xác nhận thành sự thật.
# - Không tự thay đổi ID, SKU hoặc số liệu.
# - Phân biệt thông tin người dùng cung cấp với kết quả Tool.
# - Không giữ lại các câu hội thoại xã giao không cần thiết.
# - Loại bỏ thông tin trùng lặp.
# - Nếu dữ liệu cũ và dữ liệu mới mâu thuẫn,
#   ghi nhận dữ liệu mới nhất đã được xác nhận.
# - Viết bằng tiếng Việt.
# - Tóm tắt ngắn gọn, có cấu trúc.
# - Cố gắng giữ Summary trong khoảng 700 token.
# """

#     response = await summarizer_llm.ainvoke(
#         [
#             SystemMessage(
#                 content=summarizer_prompt
#             ),
#             HumanMessage(
#                 content=(
#                     "SUMMARY TRƯỚC ĐÓ:\n\n"
#                     f"{old_summary or 'Chưa có.'}\n\n"
#                     "LỊCH SỬ HỘI THOẠI CẦN TÓM TẮT:\n\n"
#                     f"{history_text}"
#                 )
#             ),
#         ]
#     )

#     new_summary = content_to_text(
#         response.content
#     ).strip()

#     if not new_summary:
#         raise ValueError(
#             "Summarizer trả về nội dung rỗng."
#         )

#     return new_summary


# # ============================================================
# # 13. SUMMARIZE NODE
# # ============================================================

# async def summarize_node(
#     state: SingleAgentState,
# ):
#     """
#     Quản lý ngân sách ngữ cảnh trước khi gọi Agent.

#     Không chỉ đếm lịch sử chưa summarize.

#     Thay vào đó, đo toàn bộ prompt:

#     - System Prompt.
#     - Summary hiện tại.
#     - Lịch sử chưa summarize.
#     - Lượt hiện tại.

#     Sau đó cộng thêm ngân sách dự phòng cho Tool Schemas.
#     """

#     messages = state.get(
#         "messages",
#         [],
#     )

#     if not messages:
#         return {}

#     summary = state.get(
#         "summary",
#         "",
#     )

#     summarized_count = get_safe_summarized_count(
#         messages,
#         state.get(
#             "summarized_message_count",
#             0,
#         ),
#     )

#     last_human_index = find_last_human_index(
#         messages
#     )

#     # Chỉ summarize các lượt trước lượt hiện tại.
#     current_turn_messages = messages[
#         last_human_index:
#     ]

#     print("\n========== CONTEXT MANAGEMENT ==========")

#     print(
#         "Tổng số messages:",
#         len(messages),
#     )

#     print(
#         "Số messages đã summarize:",
#         summarized_count,
#     )

#     print(
#         "Số messages trong lượt hiện tại:",
#         len(current_turn_messages),
#     )

#     print(
#         "Tool schema reserve:",
#         TOOL_SCHEMA_RESERVE_TOKENS,
#     )

#     print(
#         "Safe message budget:",
#         MAX_SAFE_MESSAGE_TOKENS,
#     )

#     summary_updated = False

#     # Có thể summarize nhiều đợt cho đến khi prompt đạt ngân sách.
#     for round_index in range(
#         MAX_SUMMARIZER_ROUNDS
#     ):

#         model_messages = build_model_messages_from_parts(
#             history=messages,
#             summary=summary,
#             summarized_count=summarized_count,
#         )

#         message_tokens = count_tokens(
#             model_messages
#         )

#         estimated_context_tokens = (
#             message_tokens
#             + TOOL_SCHEMA_RESERVE_TOKENS
#         )

#         print(
#             f"\n[CONTEXT CHECK {round_index + 1}]"
#         )

#         print(
#             "Message tokens:",
#             message_tokens,
#         )

#         print(
#             "Estimated context tokens:",
#             estimated_context_tokens,
#         )

#         if (
#             message_tokens
#             <= MAX_SAFE_MESSAGE_TOKENS
#         ):
#             print(
#                 "Context nằm trong ngân sách an toàn."
#             )
#             break

#         print(
#             "Context vượt ngân sách. Bắt đầu summarize."
#         )

#         # Những lượt cũ chưa summarize,
#         # không bao gồm lượt hiện tại.
#         pending_messages = messages[
#             min(
#                 summarized_count,
#                 last_human_index,
#             ):last_human_index
#         ]

#         if not pending_messages:

#             print(
#                 "[CONTEXT WARNING] "
#                 "Không còn lịch sử cũ để summarize."
#             )

#             print(
#                 "Phần context vượt ngân sách đến từ "
#                 "System Prompt hoặc lượt hiện tại."
#             )

#             break

#         # Lấy các lượt cũ nhất theo từng lượt hoàn chỉnh.
#         old_chunk = select_oldest_turn_chunk(
#             pending_messages
#         )

#         if not old_chunk:

#             print(
#                 "[CONTEXT WARNING] "
#                 "Không tìm được chunk để summarize."
#             )

#             break

#         old_chunk_tokens = count_tokens(
#             old_chunk
#         )

#         print(
#             "Chunk tokens:",
#             old_chunk_tokens,
#         )

#         print(
#             "Chunk messages:",
#             len(old_chunk),
#         )

#         start_time = time.perf_counter()

#         # Tạo Summary mới.
#         summary = await summarize_history_chunk(
#             old_summary=summary,
#             messages_to_summarize=old_chunk,
#         )

#         elapsed = (
#             time.perf_counter()
#             - start_time
#         )

#         summary_updated = True

#         # Tăng summarized_message_count theo số message
#         # thuộc các lượt đã được summarize.
#         summarized_count += len(old_chunk)

#         print(
#             f"[SUMMARIZER LATENCY] {elapsed:.2f}s"
#         )

#         print(
#             "Summary tokens:",
#             count_tokens(
#                 [
#                     SystemMessage(
#                         content=summary
#                     )
#                 ]
#             ),
#         )

#         print(
#             "Tổng messages đã summarize:",
#             summarized_count,
#         )

#     # Kiểm tra lại ngân sách sau các lần summarize.
#     final_model_messages = build_model_messages_from_parts(
#         history=messages,
#         summary=summary,
#         summarized_count=summarized_count,
#     )

#     final_message_tokens = count_tokens(
#         final_model_messages
#     )

#     final_estimated_tokens = (
#         final_message_tokens
#         + TOOL_SCHEMA_RESERVE_TOKENS
#     )

#     print("\n========== CONTEXT RESULT ==========")

#     print(
#         "Final message tokens:",
#         final_message_tokens,
#     )

#     print(
#         "Final estimated context tokens:",
#         final_estimated_tokens,
#     )

#     print(
#         "Context limit:",
#         MODEL_NUM_CTX,
#     )

#     if (
#         final_message_tokens
#         > MAX_SAFE_MESSAGE_TOKENS
#     ):
#         logger.warning(
#             "Context vẫn vượt ngân sách sau summarize. "
#             "Agent sẽ kiểm tra lại trước khi gọi LLM."
#         )

#     if summary_updated:

#         return {
#             "summary": summary,
#             "summarized_message_count": summarized_count,
#         }

#     return {}


# # ============================================================
# # 14. AGENT NODE
# # ============================================================

# async def call_model(
#     state: SingleAgentState,
# ):
#     """
#     Agent Node theo ReAct pattern.

#     1. Xây dựng prompt từ Summary và lịch sử.
#     2. Kiểm tra ngân sách context.
#     3. Gọi LLM.
#     4. Nếu có Tool Call, chuyển sang ToolNode.
#     5. Nếu có câu trả lời, kết thúc.
#     """

#     messages = build_model_messages(
#         state
#     )

#     message_tokens = count_tokens(
#         messages
#     )

#     estimated_context_tokens = (
#         message_tokens
#         + TOOL_SCHEMA_RESERVE_TOKENS
#     )

#     print("\n========== AGENT NODE ==========")

#     print(
#         "Số messages gửi vào LLM:",
#         len(messages),
#     )

#     print(
#         "Message tokens:",
#         message_tokens,
#     )

#     print(
#         "Estimated context tokens:",
#         estimated_context_tokens,
#     )

#     # Không gửi prompt vượt ngân sách.
#     if (
#         message_tokens
#         > MAX_SAFE_MESSAGE_TOKENS
#     ):

#         logger.error(
#             "Agent input vượt ngân sách context."
#         )

#         return {
#             "messages": [
#                 AIMessage(
#                     content=(
#                         "Ngữ cảnh hội thoại hiện tại quá dài "
#                         "nên mình chưa thể xử lý yêu cầu này "
#                         "một cách an toàn. Bạn vui lòng tách "
#                         "yêu cầu thành một bước ngắn hơn "
#                         "hoặc bắt đầu một cuộc hội thoại mới."
#                     )
#                 )
#             ]
#         }

#     start_time = time.perf_counter()

#     try:

#         response = await llm_with_tools.ainvoke(
#             messages
#         )

#         elapsed = (
#             time.perf_counter()
#             - start_time
#         )

#         tool_calls = getattr(
#             response,
#             "tool_calls",
#             [],
#         ) or []

#         invalid_tool_calls = getattr(
#             response,
#             "invalid_tool_calls",
#             [],
#         ) or []

#         response_content = content_to_text(
#             response.content
#         ).strip()

#         response_metadata = getattr(
#             response,
#             "response_metadata",
#             {},
#         ) or {}

#         usage_metadata = getattr(
#             response,
#             "usage_metadata",
#             {},
#         ) or {}

#         print(
#             f"[AGENT LLM LATENCY] {elapsed:.2f}s"
#         )

#         print(
#             "Tool calls:",
#             [
#                 call.get("name")
#                 for call in tool_calls
#             ],
#         )

#         print(
#             "Response content:",
#             repr(response_content[:500]),
#         )

#         print(
#             "Usage metadata:",
#             usage_metadata,
#         )

#         print(
#             "Response metadata:",
#             response_metadata,
#         )

#         if invalid_tool_calls:

#             logger.warning(
#                 "Invalid Tool calls: %s",
#                 invalid_tool_calls,
#             )

#         # Không có Tool Call và cũng không có content:
#         # không để Graph kết thúc bằng AIMessage rỗng.
#         if (
#             not response_content
#             and not tool_calls
#         ):

#             logger.error(
#                 "LLM trả về response rỗng và không có Tool Call."
#             )

#             print(
#                 "Response metadata:",
#                 response_metadata,
#             )

#             return {
#                 "messages": [
#                     AIMessage(
#                         content=(
#                             "Mình chưa nhận được phản hồi hoàn chỉnh "
#                             "từ hệ thống AI. Bạn vui lòng gửi lại "
#                             "yêu cầu một lần nữa nhé."
#                         )
#                     )
#                 ]
#             }

#         return {
#             "messages": [
#                 response
#             ]
#         }

#     except Exception:

#         logger.exception(
#             "[AGENT LLM ERROR]"
#         )

#         raise


# # ============================================================
# # 15. ROUTER
# # ============================================================

# def route_after_agent(
#     state: SingleAgentState,
# ):
#     """
#     Có Tool Call -> chuyển sang ToolNode.
#     Không có Tool Call -> kết thúc Graph.
#     """

#     messages = state.get(
#         "messages",
#         [],
#     )

#     if not messages:
#         return END

#     last_message = messages[-1]

#     tool_calls = getattr(
#         last_message,
#         "tool_calls",
#         [],
#     ) or []

#     if tool_calls:
#         return "tools"

#     return END


# # ============================================================
# # 16. BUILD LANGGRAPH - REACT LOOP
# # ============================================================

# builder = StateGraph(
#     SingleAgentState,
#     context_schema=AgentRuntimeContext,
# )

# # Register Nodes.
# builder.add_node(
#     "summarize",
#     summarize_node,
# )

# builder.add_node(
#     "agent",
#     call_model,
# )

# builder.add_node(
#     "tools",
#     tool_node,
# )


# # START -> SUMMARIZE -> AGENT
# builder.add_edge(
#     START,
#     "summarize",
# )

# builder.add_edge(
#     "summarize",
#     "agent",
# )


# # Agent -> Tools hoặc END.
# builder.add_conditional_edges(
#     "agent",
#     route_after_agent,
#     {
#         "tools": "tools",
#         END: END,
#     },
# )


# # Tools -> Agent.
# # Agent tiếp tục đọc kết quả Tool và quyết định bước tiếp theo.
# builder.add_edge(
#     "tools",
#     "agent",
# )


# # ============================================================
# # 17. MONGODB CHECKPOINTER
# # ============================================================

# mongo_client = MongoClient(
#     MONGODB_URI,
#     serverSelectionTimeoutMS=5000,
# )

# checkpointer = MongoDBSaver(
#     mongo_client,
#     db_name="single_agent_service",
# )


# # ============================================================
# # 18. COMPILE GRAPH
# # ============================================================

# single_agent = builder.compile(
#     checkpointer=checkpointer,
# )

import os
import json
import logging
from typing import Any, List, TypedDict

from dotenv import load_dotenv
from pymongo import MongoClient
from transformers import AutoTokenizer

from langchain_ollama import ChatOllama
from langchain_core.messages import (
    SystemMessage,
    HumanMessage,
    AIMessage,
)
from langchain_core.utils.function_calling import convert_to_openai_tool

from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.mongodb import MongoDBSaver

from .single_agent_prompt import SINGLE_AGENT_PROMPT


# ============================================================
# 1. IMPORT TOOLS
# ============================================================

# USER-SERVICE
from tools.user_tools import search_user

# CUSTOMER-SERVICE
from tools.customer_tools import (
    search_customer,
    get_customer_addresses,
)

# PRODUCT-SERVICE
from tools.product_tools import (
    get_phone_detail,
    get_laptop_detail,
    get_tablet_detail,
    compare_phones,
    compare_laptops,
    compare_tablets,
    search_products,
)

# BRANCH-SERVICE
from tools.branch_tools import get_branch_address

# ORDER-SERVICE
from tools.order_tools import create_order

# PROMOTION-SERVICE
from tools.promotion_tools import (
    get_all_coupons,
    get_direct_discount,
    get_direct_discounts,
)


# ============================================================
# 2. ENVIRONMENT
# ============================================================

load_dotenv()

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL")
MONGODB_URI = os.getenv("MONGODB_URI")

if not OLLAMA_BASE_URL:
    raise RuntimeError("Thiếu biến môi trường OLLAMA_BASE_URL.")

if not MONGODB_URI:
    raise RuntimeError("Thiếu biến môi trường MONGODB_URI.")


# ============================================================
# 3. MODEL / CONTEXT CONFIGURATION
# ============================================================

MODEL_NAME = os.getenv("AGENT_MODEL", "qwen3.5:4b")
TOKENIZER_NAME = os.getenv("AGENT_TOKENIZER", "Qwen/Qwen3.5-4B")

MODEL_NUM_CTX = int(os.getenv("AGENT_NUM_CTX", "24576"))
MODEL_NUM_PREDICT = int(os.getenv("AGENT_NUM_PREDICT", "512"))

CONTEXT_SAFETY_MARGIN = 1024

CONTEXT_EXTRA_MARGIN = 1024

MAX_SAFE_MESSAGE_TOKENS = (
    MODEL_NUM_CTX
    - MODEL_NUM_PREDICT
    - CONTEXT_SAFETY_MARGIN
    - CONTEXT_EXTRA_MARGIN
)

if MAX_SAFE_MESSAGE_TOKENS <= 0:
    raise RuntimeError(
        "Cấu hình context không hợp lệ. Hãy kiểm tra AGENT_NUM_CTX, "
        "AGENT_NUM_PREDICT và AGENT_CONTEXT_SAFETY_MARGIN."
    )


llm = ChatOllama(
    model=MODEL_NAME,
    base_url=OLLAMA_BASE_URL,
    temperature=0,
    reasoning=False,
    num_ctx=MODEL_NUM_CTX,
    num_predict=MODEL_NUM_PREDICT,
    keep_alive="30m",
)

SUMMARIZER_NUM_CTX = min(MODEL_NUM_CTX, 8192)
SUMMARIZER_NUM_PREDICT = 512

summarizer_llm = ChatOllama(
    model=MODEL_NAME,
    base_url=OLLAMA_BASE_URL,
    temperature=0,
    reasoning=False,
    num_ctx=SUMMARIZER_NUM_CTX,
    num_predict=SUMMARIZER_NUM_PREDICT,
    keep_alive="30m",
)


# ============================================================
# 4. TOKENIZER
# ============================================================

logger.info("Loading tokenizer: %s", TOKENIZER_NAME)

tokenizer = AutoTokenizer.from_pretrained(
    TOKENIZER_NAME,
    use_fast=True,
)


# ============================================================
# 5. TOOL CONFIGURATION
# ============================================================

tools = [
    # USER
    search_user,

    # CUSTOMER
    search_customer,
    get_customer_addresses,

    # PRODUCT
    get_phone_detail,
    get_laptop_detail,
    get_tablet_detail,
    compare_phones,
    compare_laptops,
    compare_tablets,
    search_products,

    # BRANCH
    get_branch_address,

    # ORDER
    create_order,

    # PROMOTION
    get_all_coupons,
    get_direct_discount,
    get_direct_discounts,
]

# Dùng cùng cách chuyển đổi schema với giao diện bind_tools.
TOOL_SCHEMAS = [
    convert_to_openai_tool(tool)
    for tool in tools
]

llm_with_tools = llm.bind_tools(tools)
tool_node = ToolNode(tools)


# ============================================================
# 6. CONTEXT MANAGEMENT CONFIGURATION
# ============================================================

KEEP_RECENT_TOKENS = 2500
MAX_SUMMARIZER_CHUNK_TOKENS = 3500
MAX_SUMMARIZER_HISTORY_CHARS = 16000
MAX_SUMMARIZER_ROUNDS = 8


# ============================================================
# 7. STATE / RUNTIME CONTEXT
# ============================================================

class SingleAgentState(MessagesState):
    summary: str
    summarized_message_count: int


class AgentRuntimeContext(TypedDict):
    user_id: str
    access_token: str


# ============================================================
# 8. TOKEN / MESSAGE HELPERS
# ============================================================

def content_to_text(content: Any) -> str:
    """Chuyển message content thành văn bản để đếm và summarize."""

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = []

        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text_value = item.get("text")
                if isinstance(text_value, str):
                    parts.append(text_value)

        return "\n".join(parts)

    return str(content) if content is not None else ""


def get_token_ids_length(encoded: Any) -> int:
    """Lấy số token từ output của apply_chat_template."""

    if hasattr(encoded, "keys"):
        input_ids = encoded.get("input_ids")
        if input_ids is not None:
            encoded = input_ids

    if hasattr(encoded, "shape"):
        return int(encoded.shape[-1])

    if isinstance(encoded, (list, tuple)):
        if encoded and isinstance(encoded[0], (list, tuple)):
            return len(encoded[0])
        return len(encoded)

    raise TypeError(
        f"Không xác định được kiểu output tokenizer: {type(encoded)}"
    )


def normalize_tool_call_for_qwen(call: dict) -> dict:
    """Đổi LangChain AIMessage.tool_calls sang format Qwen3.5."""

    function_data = call.get("function") or call

    name = function_data.get("name")
    arguments = function_data.get(
        "arguments",
        function_data.get("args", call.get("args", {})),
    )

    if not isinstance(arguments, dict):
        arguments = {}

    if not name:
        raise ValueError("Tool call không có tên function.")

    return {
        "name": name,
        "arguments": arguments,
    }


def count_tokens(
    messages: list,
    include_tools: bool = False,
) -> int:
    """
    Đếm token với Qwen3.5 chat template.

    include_tools=True sẽ tính cả toàn bộ Tool Schema của Agent.
    Tool results được đếm vì chúng nằm trong messages.
    """

    if not messages:
        return 0

    chat_messages = []

    for message in messages:
        content = content_to_text(
            getattr(message, "content", "")
        )

        if message.type == "system":
            role = "system"
        elif message.type == "human":
            role = "user"
        elif message.type == "tool":
            role = "tool"
        elif message.type == "ai":
            role = "assistant"
        else:
            raise ValueError(
                f"Message type không được hỗ trợ: {message.type}"
            )

        chat_message = {
            "role": role,
            "content": content,
        }

        if message.type == "ai":
            tool_calls = getattr(message, "tool_calls", None) or []

            if tool_calls:
                chat_message["tool_calls"] = [
                    normalize_tool_call_for_qwen(call)
                    for call in tool_calls
                ]

        chat_messages.append(chat_message)

    template_kwargs = {
        "tokenize": True,
        "add_generation_prompt": True,
        "enable_thinking": False,
    }

    if include_tools:
        template_kwargs["tools"] = TOOL_SCHEMAS

    try:
        encoded = tokenizer.apply_chat_template(
            chat_messages,
            **template_kwargs,
        )
        return get_token_ids_length(encoded)

    except Exception as exc:
        logger.exception("Qwen tokenizer failed")
        raise RuntimeError(
            "Không thể đếm token bằng Qwen3.5 chat template. "
            "Dừng request để tránh gửi prompt vượt context."
        ) from exc


def get_tool_schema_token_count() -> int:
    """Ước lượng phần token tăng thêm khi gắn 15 Tool Schema."""

    probe_messages = [
        SystemMessage(content=""),
        HumanMessage(content="tokenizer test"),
    ]

    with_tools = count_tokens(
        probe_messages,
        include_tools=True,
    )

    without_tools = count_tokens(
        probe_messages,
        include_tools=False,
    )

    return max(0, with_tools - without_tools)


TOOL_SCHEMA_TOKEN_COUNT = get_tool_schema_token_count()

print(
    f"[CONFIG] tools={len(TOOL_SCHEMAS)} "
    f"tool_schema_tokens={TOOL_SCHEMA_TOKEN_COUNT} "
    f"context={MODEL_NUM_CTX} "
    f"prompt_budget={MAX_SAFE_MESSAGE_TOKENS}"
)


def normalize_summarized_count(
    value: Any,
    total_messages: int,
) -> int:
    if not isinstance(value, int):
        return 0

    return max(0, min(value, total_messages))


def get_safe_summarized_count(
    messages: list,
    value: Any,
) -> int:
    """Không để summarized_message_count nằm giữa một lượt hội thoại."""

    index = normalize_summarized_count(
        value,
        len(messages),
    )

    if 0 < index < len(messages):
        while index > 0 and messages[index].type != "human":
            index -= 1

    return index


def find_last_human_index(messages: list) -> int:
    for index in range(len(messages) - 1, -1, -1):
        if messages[index].type == "human":
            return index

    raise RuntimeError("Không tìm thấy HumanMessage.")


def split_messages_into_turns(messages: list) -> List[list]:
    """Chia lịch sử thành các lượt Human -> AI/Tool hoàn chỉnh."""

    turns = []
    current_turn = []

    for message in messages:
        if message.type == "human" and current_turn:
            turns.append(current_turn)
            current_turn = []

        current_turn.append(message)

    if current_turn:
        turns.append(current_turn)

    return turns


# ============================================================
# 9. SUMMARY FORMATTING
# ============================================================

def format_message_for_summary(message) -> str:
    message_type = message.type.upper()
    content = content_to_text(message.content)

    result = f"[{message_type}]\n{content}"

    tool_calls = getattr(message, "tool_calls", None) or []

    if tool_calls:
        formatted_calls = []

        for call in tool_calls:
            name = call.get("name", "unknown")
            arguments = call.get("args", {})

            formatted_calls.append(
                "Tool: "
                + name
                + "\nArguments: "
                + json.dumps(
                    arguments,
                    ensure_ascii=False,
                    default=str,
                )
            )

        result += "\n[TOOL CALLS]\n" + "\n".join(formatted_calls)

    message_name = getattr(message, "name", None)
    if message_name:
        result += f"\nTool Name: {message_name}"

    return result


def messages_to_summary_text(
    messages: list,
    max_chars: int = MAX_SUMMARIZER_HISTORY_CHARS,
) -> str:
    parts = []
    used_chars = 0

    for message in messages:
        message_text = format_message_for_summary(message)
        remaining = max_chars - used_chars

        if remaining <= 0:
            parts.append("[Phần lịch sử còn lại đã được lược bỏ.] ")
            break

        if len(message_text) > remaining:
            parts.append(
                message_text[:remaining]
                + "\n[Nội dung đã được rút gọn.]"
            )
            break

        parts.append(message_text)
        used_chars += len(message_text)

    return "\n\n".join(parts)


# ============================================================
# 10. BUILD AGENT MESSAGES
# ============================================================

def build_model_messages_from_parts(
    history: list,
    summary: str,
    summarized_count: int,
) -> list:
    """Tạo prompt với duy nhất một SystemMessage ở vị trí đầu tiên."""

    if not history:
        raise RuntimeError("Không có message trong hội thoại.")

    last_human_index = find_last_human_index(history)

    safe_count = get_safe_summarized_count(
        history,
        summarized_count,
    )
    safe_count = min(safe_count, last_human_index)

    previous_messages = history[
        safe_count:last_human_index
    ]

    current_turn_messages = history[
        last_human_index:
    ]

    system_content = SINGLE_AGENT_PROMPT

    if summary:
        system_content += (
            "\n\nTÓM TẮT NGỮ CẢNH HỘI THOẠI:\n\n"
            f"{summary}\n\n"
            "Sử dụng Summary làm thông tin tham khảo. "
            "Ưu tiên kết quả Tool mới nhất khi có mâu thuẫn. "
            "Không tự suy diễn thông tin chưa được xác nhận."
        )

    model_messages = [
        SystemMessage(content=system_content)
    ]

    model_messages.extend(previous_messages)
    model_messages.extend(current_turn_messages)

    return model_messages


def build_model_messages(state: SingleAgentState) -> list:
    return build_model_messages_from_parts(
        history=state.get("messages", []),
        summary=state.get("summary", ""),
        summarized_count=state.get("summarized_message_count", 0),
    )


# ============================================================
# 11. SELECT OLD HISTORY FOR SUMMARY
# ============================================================

def select_oldest_turn_chunk(pending_messages: list) -> list:
    if not pending_messages:
        return []

    turns = split_messages_into_turns(pending_messages)
    if not turns:
        return []

    keep_start = len(turns)
    recent_tokens = 0

    for index in range(len(turns) - 1, -1, -1):
        turn_tokens = count_tokens(turns[index])

        if recent_tokens + turn_tokens <= KEEP_RECENT_TOKENS:
            keep_start = index
            recent_tokens += turn_tokens
        else:
            break

    # Nếu không có lượt nào để loại bỏ, summarize ít nhất lượt cũ nhất.
    if keep_start == 0:
        keep_start = 1

    old_turns = turns[:keep_start]
    if not old_turns:
        return []

    selected_chunk = []
    selected_tokens = 0

    for turn in old_turns:
        turn_tokens = count_tokens(turn)

        if (
            selected_chunk
            and selected_tokens + turn_tokens > MAX_SUMMARIZER_CHUNK_TOKENS
        ):
            break

        # Giữ nguyên một lượt hoàn chỉnh, không cắt Tool Call/Tool Result.
        selected_chunk.extend(turn)
        selected_tokens += turn_tokens

        if selected_tokens >= MAX_SUMMARIZER_CHUNK_TOKENS:
            break

    return selected_chunk


# ============================================================
# 12. SUMMARIZER
# ============================================================

async def summarize_history_chunk(
    old_summary: str,
    messages_to_summarize: list,
) -> str:
    history_text = messages_to_summary_text(
        messages_to_summarize
    )

    summarizer_prompt = """
Bạn là hệ thống quản lý ngữ cảnh hội thoại cho AI Agent.

Nhiệm vụ: kết hợp Summary trước đó với lịch sử mới thành một Summary ngắn gọn.

ƯU TIÊN GIỮ LẠI:
1. Thông tin người dùng cung cấp và đã được xác nhận.
2. Mục đích, yêu cầu và quyết định đã thống nhất.
3. Sản phẩm: tên, SKU, ID, thông số và kết quả Tool đã xác nhận.
4. Khách hàng, tài khoản, địa chỉ và chi nhánh cần cho nghiệp vụ.
5. Đơn hàng: Order ID, trạng thái, sản phẩm, số lượng, giá trị, phương thức nhận hàng.
6. Thông tin cần thiết để Agent tiếp tục gọi Tool.

QUY TẮC:
- Không tự suy diễn hoặc tạo dữ liệu.
- Không biến thông tin chưa xác nhận thành sự thật.
- Không thay đổi ID, SKU hoặc số liệu.
- Phân biệt thông tin người dùng cung cấp với kết quả Tool.
- Loại bỏ xã giao, trùng lặp và thông tin không còn cần thiết.
- Khi dữ liệu mâu thuẫn, ưu tiên dữ liệu mới nhất đã được xác nhận.
- Viết bằng tiếng Việt, ngắn gọn, có cấu trúc.
- Cố gắng giữ Summary dưới khoảng 700 token.
"""

    response = await summarizer_llm.ainvoke(
        [
            SystemMessage(content=summarizer_prompt),
            HumanMessage(
                content=(
                    "SUMMARY TRƯỚC ĐÓ:\n\n"
                    f"{old_summary or 'Chưa có.'}\n\n"
                    "LỊCH SỬ HỘI THOẠI CẦN TÓM TẮT:\n\n"
                    f"{history_text}"
                )
            ),
        ]
    )

    new_summary = content_to_text(response.content).strip()

    if not new_summary:
        raise ValueError("Summarizer trả về nội dung rỗng.")

    return new_summary


# ============================================================
# 13. SUMMARIZE NODE
# ============================================================

async def summarize_node(state: SingleAgentState):
    messages = state.get("messages", [])

    if not messages:
        return {}

    summary = state.get("summary", "")
    summarized_count = get_safe_summarized_count(
        messages,
        state.get("summarized_message_count", 0),
    )

    last_human_index = find_last_human_index(messages)
    summary_updated = False

    for _ in range(MAX_SUMMARIZER_ROUNDS):
        model_messages = build_model_messages_from_parts(
            history=messages,
            summary=summary,
            summarized_count=summarized_count,
        )

        # Bao gồm Tool Schema và toàn bộ Tool Result đang có trong messages.
        prompt_tokens = count_tokens(
            model_messages,
            include_tools=True,
        )

        if prompt_tokens <= MAX_SAFE_MESSAGE_TOKENS:
            break

        pending_messages = messages[
            min(summarized_count, last_human_index):last_human_index
        ]

        # Không thể summarize lượt hiện tại hoặc System Prompt.
        if not pending_messages:
            logger.warning(
                "Context vượt ngân sách nhưng không còn lịch sử cũ để summarize."
            )
            break

        old_chunk = select_oldest_turn_chunk(pending_messages)

        if not old_chunk:
            logger.warning("Không tìm được history chunk để summarize.")
            break

        summary = await summarize_history_chunk(
            old_summary=summary,
            messages_to_summarize=old_chunk,
        )

        summary_updated = True
        summarized_count += len(old_chunk)

    # Xác nhận ngân sách sau khi summarize.
    final_messages = build_model_messages_from_parts(
        history=messages,
        summary=summary,
        summarized_count=summarized_count,
    )

    final_prompt_tokens = count_tokens(
        final_messages,
        include_tools=True,
    )

    if final_prompt_tokens > MAX_SAFE_MESSAGE_TOKENS:
        logger.warning(
            "Context vẫn vượt giới hạn an toàn sau summarize: %s/%s tokens.",
            final_prompt_tokens,
            MAX_SAFE_MESSAGE_TOKENS,
        )

    if summary_updated:
        return {
            "summary": summary,
            "summarized_message_count": summarized_count,
        }

    return {}


# ============================================================
# 14. AGENT NODE
# ============================================================

async def call_model(state: SingleAgentState):
    messages = build_model_messages(state)

    # ========================================================
    # 1. COUNT INPUT TOKENS
    # ========================================================

    estimated_prompt_tokens = count_tokens(
        messages,
        include_tools=True,
    )

    print(
        f"[CONTEXT] estimated={estimated_prompt_tokens} "
        f"budget={MAX_SAFE_MESSAGE_TOKENS} "
        f"ctx={MODEL_NUM_CTX}"
    )

    # Kiểm tra ngân sách Context trước khi gọi LLM.
    if estimated_prompt_tokens > MAX_SAFE_MESSAGE_TOKENS:
        logger.warning(
            "Agent request bị chặn vì vượt ngân sách context."
        )

        return {
            "messages": [
                AIMessage(
                    content=(
                        "Ngữ cảnh hội thoại hiện tại quá dài nên mình chưa thể "
                        "xử lý yêu cầu một cách an toàn. Bạn vui lòng tách yêu cầu "
                        "thành bước ngắn hơn hoặc bắt đầu một cuộc hội thoại mới nhé."
                    )
                )
            ]
        }

    try:

        # ====================================================
        # 2. CALL LLM
        # ====================================================

        response = await llm_with_tools.ainvoke(messages)

        tool_calls = getattr(
            response,
            "tool_calls",
            None,
        ) or []

        response_content = content_to_text(
            response.content
        ).strip()

        response_metadata = getattr(
            response,
            "response_metadata",
            {},
        ) or {}

        usage_metadata = getattr(
            response,
            "usage_metadata",
            {},
        ) or {}

        # ====================================================
        # 3. TOKEN USAGE
        # ====================================================

        actual_prompt_tokens = response_metadata.get(
            "prompt_eval_count",
            usage_metadata.get("input_tokens", 0),
        ) or 0

        actual_output_tokens = response_metadata.get(
            "eval_count",
            usage_metadata.get("output_tokens", 0),
        ) or 0

        if actual_prompt_tokens:

            delta = (
                actual_prompt_tokens
                - estimated_prompt_tokens
            )

            print(
                f"[OLLAMA] prompt={actual_prompt_tokens} "
                f"output={actual_output_tokens} "
                f"delta={delta} "
                f"tool_calls={len(tool_calls)}"
            )

        else:

            print(
                f"[OLLAMA] prompt=unavailable "
                f"estimated={estimated_prompt_tokens} "
                f"output={actual_output_tokens} "
                f"tool_calls={len(tool_calls)}"
            )

        # ====================================================
        # 4. OLLAMA PERFORMANCE METRICS
        # ====================================================

        # Ollama trả thời gian theo nanoseconds.
        prompt_eval_duration = (
            response_metadata.get(
                "prompt_eval_duration",
                0,
            ) or 0
        )

        load_duration = (
            response_metadata.get(
                "load_duration",
                0,
            ) or 0
        )

        total_duration = (
            response_metadata.get(
                "total_duration",
                0,
            ) or 0
        )

        print(
            "\n========== OLLAMA PERFORMANCE =========="
        )

        print(
            "Prompt tokens:",
            actual_prompt_tokens or "unavailable",
        )

        print(
            "Output tokens:",
            actual_output_tokens or "unavailable",
        )

        if prompt_eval_duration:
            print(
                "Prompt evaluation time:",
                round(prompt_eval_duration / 1e9, 3),
                "seconds",
            )
        else:
            print("Prompt evaluation time: unavailable")

        if load_duration:
            print(
                "Model load time:",
                round(load_duration / 1e9, 3),
                "seconds",
            )
        else:
            print("Model load time: unavailable")

        if total_duration:
            print(
                "Total inference time:",
                round(total_duration / 1e9, 3),
                "seconds",
            )
        else:
            print("Total inference time: unavailable")

        print(
            "Tool calls:",
            len(tool_calls),
        )

        # ====================================================
        # 5. VALIDATE RESPONSE
        # ====================================================

        if not response_content and not tool_calls:

            logger.error(
                "LLM trả về response rỗng và không có Tool Call."
            )

            return {
                "messages": [
                    AIMessage(
                        content=(
                            "Mình chưa nhận được phản hồi hoàn chỉnh từ hệ thống AI. "
                            "Bạn vui lòng gửi lại yêu cầu nhé."
                        )
                    )
                ]
            }

        # ====================================================
        # 6. RETURN RESPONSE
        # ====================================================

        return {
            "messages": [response]
        }

    except Exception:

        logger.exception(
            "Agent LLM request failed"
        )

        raise


# ============================================================
# 15. ROUTER
# ============================================================

def route_after_agent(state: SingleAgentState):
    messages = state.get("messages", [])

    if not messages:
        return END

    last_message = messages[-1]
    tool_calls = getattr(last_message, "tool_calls", None) or []

    return "tools" if tool_calls else END


# ============================================================
# 16. BUILD LANGGRAPH - REACT LOOP
# ============================================================

builder = StateGraph(
    SingleAgentState,
    context_schema=AgentRuntimeContext,
)

builder.add_node("summarize", summarize_node)
builder.add_node("agent", call_model)
builder.add_node("tools", tool_node)

builder.add_edge(START, "summarize")
builder.add_edge("summarize", "agent")

builder.add_conditional_edges(
    "agent",
    route_after_agent,
    {
        "tools": "tools",
        END: END,
    },
)

# Sau mỗi Tool Result, Agent sẽ đếm lại toàn bộ context trước lần gọi tiếp theo.
builder.add_edge("tools", "agent")


# ============================================================
# 17. MONGODB CHECKPOINTER
# ============================================================

mongo_client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=5000,
)

checkpointer = MongoDBSaver(
    mongo_client,
    db_name="single_agent_service",
)


# ============================================================
# 18. COMPILE GRAPH
# ============================================================

single_agent = builder.compile(
    checkpointer=checkpointer,
)

