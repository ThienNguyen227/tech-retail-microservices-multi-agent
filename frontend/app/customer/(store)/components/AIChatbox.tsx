
"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  FormEvent,
  KeyboardEvent,
  MouseEvent,
} from "react";

import {
  Bot,
  X,
  Send,
  MessageCircle,
  Minus,
  Menu,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
} from "lucide-react";

// ==================== API ====================

const API_ROOT_URL = "http://127.0.0.1:8000/api/v1/ai-service";
const PRODUCT_API_URL = `${API_ROOT_URL}/product`;
const CONVERSATION_API_URL = `${API_ROOT_URL}/conversations`;

// ==================== TYPES ====================

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  created_at?: string;
  updated_at?: string;
};

type ConversationApiItem = {
  conversation_id: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
};

type ConversationListResponse = {
  user_id?: string | number;
  total?: number;
  conversations?: ConversationApiItem[];
  detail?: string;
  message?: string;
};

type MessageListResponse = {
  conversation_id?: string;
  total?: number;
  messages?: Message[];
  detail?: string;
};

type CreateConversationResponse = {
  conversation_id: string;
  title?: string;
  message?: string;
  detail?: string;
};

type ChatResponse = {
  conversation_id: string;
  message: string;
  detail?: string;
};

type DeleteConversationResponse = {
  conversation_id?: string;
  deleted_messages?: number;
  message?: string;
  detail?: string;
};

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Xin chào! 👋 Tôi là trợ lý AI tư vấn sản phẩm công nghệ. Tôi có thể giúp gì cho bạn?",
};

// ==================== COMPONENT ====================

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [input, setInput] = useState("");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] =
    useState<string | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] =
    useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] =
    useState(false);
  const [isSending, setIsSending] = useState(false);

  // Trạng thái menu 3 chấm và xóa hội thoại
  const [openMenuConversationId, setOpenMenuConversationId] =
    useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] =
    useState<string | null>(null);

  const [conversationError, setConversationError] = useState("");
  const [messageError, setMessageError] = useState("");

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );

  const messages = activeConversation?.messages ?? [];

  // ==================== LOAD CONVERSATION LIST ====================

  const loadConversations = useCallback(
    async (
      userId: string,
      signal?: AbortSignal
    ): Promise<Conversation[]> => {
      const response = await fetch(
        `${PRODUCT_API_URL}/conversations?user_id=${encodeURIComponent(
          userId
        )}`,
        { signal }
      );

      const data: ConversationListResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            `Không thể tải danh sách hội thoại (HTTP ${response.status}).`
        );
      }

      if (!Array.isArray(data.conversations)) {
        throw new Error(
          "API danh sách hội thoại không trả về mảng conversations."
        );
      }

      return data.conversations.map((item) => ({
        id: item.conversation_id,
        title: item.title || "Cuộc trò chuyện mới",
        messages: [],
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
    },
    []
  );

  // ==================== INITIAL LOAD ====================

  useEffect(() => {
    const userId = sessionStorage.getItem("userId");

    setIsLoggedIn(Boolean(userId));

    if (!userId) {
      setConversations([]);
      setActiveConversationId(null);
      setConversationError("");
      return;
    }

    const controller = new AbortController();

    async function initialize() {
      setIsLoadingConversations(true);
      setConversationError("");

      try {
        const loaded = await loadConversations(
          userId,
          controller.signal
        );

        if (controller.signal.aborted) return;

        setConversations(loaded);

        setActiveConversationId((currentId) => {
          if (
            currentId &&
            loaded.some((item) => item.id === currentId)
          ) {
            return currentId;
          }

          return loaded[0]?.id ?? null;
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error("Load conversations error:", error);

        setConversationError(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách hội thoại."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingConversations(false);
        }
      }
    }

    void initialize();

    return () => controller.abort();
  }, [loadConversations]);

  // ==================== LOAD MESSAGES ====================

  useEffect(() => {
    if (!activeConversationId) {
      setIsLoadingMessages(false);
      setMessageError("");
      return;
    }

    const controller = new AbortController();
    const conversationId = activeConversationId;

    async function fetchMessages() {
      setIsLoadingMessages(true);
      setMessageError("");

      try {
        const response = await fetch(
          `${PRODUCT_API_URL}/conversations/${encodeURIComponent(
            conversationId
          )}/messages`,
          { signal: controller.signal }
        );

        const data: MessageListResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              `Không thể tải tin nhắn (HTTP ${response.status}).`
          );
        }

        if (!Array.isArray(data.messages)) {
          throw new Error(
            "API tin nhắn không trả về mảng messages."
          );
        }

        if (controller.signal.aborted) return;

        setConversations((previous) =>
          previous.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  messages: data.messages!,
                }
              : conversation
          )
        );
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error("Load messages error:", error);

        setMessageError(
          error instanceof Error
            ? error.message
            : "Không thể tải tin nhắn của hội thoại này."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingMessages(false);
        }
      }
    }

    void fetchMessages();

    return () => controller.abort();
  }, [activeConversationId]);

  // ==================== CREATE NEW CONVERSATION ====================

  const handleNewConversation = async () => {
    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      setIsLoggedIn(false);
      setMessageError(
        "Vui lòng đăng nhập để tiến hành trò chuyện với AI."
      );
      return;
    }

    if (
      isCreatingConversation ||
      isSending ||
      deletingConversationId
    ) {
      return;
    }

    // Nếu hội thoại hiện tại chưa có tin nhắn thì sử dụng lại.
    if (
      activeConversation &&
      activeConversation.messages.length === 0
    ) {
      setInput("");
      setMessageError("");
      setConversationError("");
      setOpenMenuConversationId(null);
      return;
    }

    setIsCreatingConversation(true);
    setConversationError("");
    setMessageError("");
    setOpenMenuConversationId(null);

    try {
      const params = new URLSearchParams({
        user_id: userId,
      });

      if (
        activeConversationId &&
        activeConversation &&
        activeConversation.messages.length > 0
      ) {
        params.set("conversation_id", activeConversationId);
      }

      const response = await fetch(
        `${CONVERSATION_API_URL}?${params.toString()}`,
        { method: "POST" }
      );

      const data: CreateConversationResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            `Không thể tạo hội thoại (HTTP ${response.status}).`
        );
      }

      if (!data.conversation_id) {
        throw new Error(
          "API tạo hội thoại không trả về conversation_id."
        );
      }

      const newConversation: Conversation = {
        id: data.conversation_id,
        title: data.title || "Cuộc trò chuyện mới",
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setConversations((previous) => [
        newConversation,
        ...previous.filter(
          (item) => item.id !== data.conversation_id
        ),
      ]);

      setActiveConversationId(data.conversation_id);
      setInput("");
      setMessageError("");
      setConversationError("");
    } catch (error) {
      console.error("Create conversation error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể tạo cuộc trò chuyện mới.";

      setConversationError(errorMessage);
      setMessageError(errorMessage);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  // ==================== SELECT CONVERSATION ====================

  const handleSelectConversation = (id: string) => {
    if (
      isSending ||
      isCreatingConversation ||
      deletingConversationId
    ) {
      return;
    }

    setActiveConversationId(id);
    setInput("");
    setMessageError("");
    setOpenMenuConversationId(null);
  };

  // ==================== OPEN 3-DOT MENU ====================

  const handleToggleMenu = (
    event: MouseEvent<HTMLButtonElement>,
    id: string
  ) => {
    event.stopPropagation();

    setOpenMenuConversationId((currentId) =>
      currentId === id ? null : id
    );
  };

  // ==================== RENAME CONVERSATION ====================

  const handleRenameConversation = (
    event: MouseEvent<HTMLButtonElement>,
    id: string
  ) => {
    event.stopPropagation();
    setOpenMenuConversationId(null);

    // Chưa triển khai chức năng đổi tên.
    alert("Chức năng đổi tên cuộc trò chuyện sẽ được bổ sung sau.");
  };

  // ==================== DELETE CONVERSATION ====================

  const handleDeleteConversation = async (
    event: MouseEvent<HTMLButtonElement>,
    id: string
  ) => {
    event.stopPropagation();

    if (
      isSending ||
      isCreatingConversation ||
      deletingConversationId
    ) {
      return;
    }

    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      setIsLoggedIn(false);
      setConversationError(
        "Vui lòng đăng nhập để xóa cuộc trò chuyện."
      );
      setOpenMenuConversationId(null);
      return;
    }

    const conversation = conversations.find(
      (item) => item.id === id
    );

    if (!conversation) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa cuộc trò chuyện "${conversation.title}" không? Toàn bộ tin nhắn cũng sẽ bị xóa.`
    );

    if (!confirmed) {
      setOpenMenuConversationId(null);
      return;
    }

    setDeletingConversationId(id);
    setOpenMenuConversationId(null);
    setConversationError("");

    try {
      const response = await fetch(
        `${CONVERSATION_API_URL}/${encodeURIComponent(
          id
        )}?user_id=${encodeURIComponent(userId)}`,
        {
          method: "DELETE",
        }
      );

      const data: DeleteConversationResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            `Không thể xóa hội thoại (HTTP ${response.status}).`
        );
      }

      // Chỉ cập nhật giao diện sau khi backend xóa thành công.
      const remaining = conversations.filter(
        (item) => item.id !== id
      );

      setConversations(remaining);

      if (activeConversationId === id) {
        setActiveConversationId(remaining[0]?.id ?? null);
        setInput("");
        setMessageError("");
      }
    } catch (error) {
      console.error("Delete conversation error:", error);

      setConversationError(
        error instanceof Error
          ? error.message
          : "Không thể xóa cuộc trò chuyện."
      );
    } finally {
      setDeletingConversationId(null);
    }
  };

  // ==================== SEND MESSAGE ====================

  const handleSend = async () => {
    const content = input.trim();

    if (
      !content ||
      !activeConversationId ||
      isSending ||
      isCreatingConversation ||
      deletingConversationId
    ) {
      return;
    }

    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      setIsLoggedIn(false);
      setMessageError(
        "Vui lòng đăng nhập để tiến hành trò chuyện với AI."
      );
      return;
    }

    const currentId = activeConversationId;

    const currentConversation = conversations.find(
      (item) => item.id === currentId
    );

    if (!currentConversation) return;

    const isFirstMessage =
      currentConversation.messages.length === 0;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === currentId
          ? {
              ...conversation,
              title: isFirstMessage
                ? content.length > 40
                  ? `${content.slice(0, 40)}...`
                  : content
                : conversation.title,
              messages: [
                ...conversation.messages,
                userMessage,
              ],
            }
          : conversation
      )
    );

    setInput("");
    setIsSending(true);
    setMessageError("");

    try {
      const params = new URLSearchParams({
        message: content,
        user_id: userId,
        conversation_id: currentId,
      });

      const response = await fetch(
        `${PRODUCT_API_URL}?${params.toString()}`,
        { method: "POST" }
      );

      const data: ChatResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            `Không thể gửi tin nhắn (HTTP ${response.status}).`
        );
      }

      if (!data.conversation_id) {
        throw new Error(
          "API Product Agent không trả về conversation_id."
        );
      }

      const serverId = data.conversation_id;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        created_at: new Date().toISOString(),
      };

      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === currentId
            ? {
                ...conversation,
                id: serverId,
                messages: [
                  ...conversation.messages,
                  assistantMessage,
                ],
                updated_at: new Date().toISOString(),
              }
            : conversation
        )
      );

      if (serverId !== currentId) {
        setActiveConversationId(serverId);
      }

      // Đồng bộ lại danh sách theo dữ liệu từ backend.
      try {
        const latest = await loadConversations(userId);

        setConversations((previous) => {
          const merged = latest.map((item) => {
            const local = previous.find(
              (conversation) => conversation.id === item.id
            );

            return local
              ? {
                  ...item,
                  messages: local.messages,
                }
              : item;
          });

          for (const local of previous) {
            if (
              local.id === serverId &&
              !merged.some((item) => item.id === serverId)
            ) {
              merged.unshift(local);
            }
          }

          return merged;
        });
      } catch (refreshError) {
        console.error(
          "Refresh conversations error:",
          refreshError
        );
      }
    } catch (error) {
      console.error("Send message error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "AI đang gặp sự cố. Bạn vui lòng thử lại sau nhé.";

      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === currentId
            ? {
                ...conversation,
                messages: [
                  ...conversation.messages,
                  {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: errorMessage,
                  },
                ],
              }
            : conversation
        )
      );

      setMessageError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  // ==================== FORM HANDLERS ====================

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSend();
  };

  const handleInputKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void handleSend();
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="mb-4 flex h-[min(600px,calc(100dvh-100px))] w-[min(800px,calc(100vw-32px))] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* SIDEBAR */}

          {isSidebarOpen && (
            <aside className="flex w-[230px] shrink-0 flex-col border-r border-gray-200 bg-[#f7fafb]">
              <div className="flex items-center justify-between border-b border-gray-200 px-3 py-4">
                <span className="text-sm font-semibold text-gray-800">
                  Lịch sử chat
                </span>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Đóng sidebar"
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>

              <div className="p-3">
                <button
                  type="button"
                  onClick={() => void handleNewConversation()}
                  disabled={
                    !isLoggedIn ||
                    isSending ||
                    isCreatingConversation ||
                    Boolean(deletingConversationId)
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:border-[#087f8c] hover:text-[#087f8c] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreatingConversation ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus size={17} />
                  )}

                  {isCreatingConversation
                    ? "Đang tạo..."
                    : "Cuộc trò chuyện mới"}
                </button>
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
                <p className="px-2 pb-2 pt-1 text-xs text-gray-400">
                  Các cuộc trò chuyện
                </p>

                {isLoadingConversations && (
                  <div className="flex items-center gap-2 px-2 py-3 text-xs text-gray-500">
                    <LoaderCircle
                      size={14}
                      className="animate-spin"
                    />
                    Đang tải...
                  </div>
                )}

                {conversationError && (
                  <p className="break-words px-2 py-3 text-xs text-red-500">
                    {conversationError}
                  </p>
                )}

                {!isLoggedIn && (
                  <p className="px-2 py-3 text-xs leading-5 text-gray-500">
                    Vui lòng đăng nhập để xem lịch sử trò chuyện.
                  </p>
                )}

                {isLoggedIn &&
                  !isLoadingConversations &&
                  !conversationError &&
                  conversations.length === 0 && (
                    <p className="px-2 py-3 text-xs leading-5 text-gray-400">
                      Chưa có hội thoại. Hãy tạo cuộc trò chuyện mới.
                    </p>
                  )}

                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() =>
                      handleSelectConversation(conversation.id)
                    }
                    className={`group relative flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-3 transition ${
                      activeConversationId === conversation.id
                        ? "bg-[#dff1f2] text-[#087f8c]"
                        : "text-gray-600 hover:bg-gray-200/70"
                    }`}
                  >
                    <MessageSquare
                      size={16}
                      className="shrink-0"
                    />

                    <span className="min-w-0 flex-1 truncate text-xs">
                      {conversation.title}
                    </span>

                    {/* NÚT 3 CHẤM */}

                    <button
                      type="button"
                      onClick={(event) =>
                        handleToggleMenu(event, conversation.id)
                      }
                      disabled={
                        isSending ||
                        isCreatingConversation ||
                        Boolean(deletingConversationId)
                      }
                      aria-label="Tùy chọn hội thoại"
                      aria-expanded={
                        openMenuConversationId === conversation.id
                      }
                      className="shrink-0 rounded-md p-1 text-gray-500 opacity-0 transition hover:bg-gray-300/70 group-hover:opacity-100 focus:opacity-100 disabled:cursor-not-allowed"
                    >
                      {deletingConversationId === conversation.id ? (
                        <LoaderCircle
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <MoreHorizontal size={18} />
                      )}
                    </button>

                    {/* MENU OPTIONS */}

                    {openMenuConversationId === conversation.id && (
                      <div
                        onClick={(event) => event.stopPropagation()}
                        className="absolute right-2 top-10 z-50 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={(event) =>
                            handleRenameConversation(
                              event,
                              conversation.id
                            )
                          }
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-gray-700 transition hover:bg-gray-100"
                        >
                          <Pencil size={15} />
                          Đổi tên cuộc trò chuyện
                        </button>

                        <button
                          type="button"
                          onClick={(event) =>
                            void handleDeleteConversation(
                              event,
                              conversation.id
                            )
                          }
                          disabled={Boolean(deletingConversationId)}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                          Xóa cuộc trò chuyện
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Bot size={17} />
                  <span>AI Product Assistant</span>
                </div>
              </div>
            </aside>
          )}

          {/* CHAT PANEL */}

          <section className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-gray-100 bg-[#087f8c] px-3 py-3.5 text-white">
              <div className="flex min-w-0 items-center gap-2">
                {!isSidebarOpen && (
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Mở lịch sử chat"
                    className="rounded-lg p-2 transition hover:bg-white/20"
                  >
                    <Menu size={19} />
                  </button>
                )}

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Bot size={22} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">
                    AI Assistant
                  </h3>

                  <p className="flex items-center gap-1.5 truncate text-xs text-white/80">
                    {deletingConversationId ? (
                      <>
                        <LoaderCircle
                          size={12}
                          className="animate-spin"
                        />
                        Đang xóa hội thoại...
                      </>
                    ) : isCreatingConversation ? (
                      <>
                        <LoaderCircle
                          size={12}
                          className="animate-spin"
                        />
                        Đang tạo hội thoại...
                      </>
                    ) : isSending ? (
                      <>
                        <LoaderCircle
                          size={12}
                          className="animate-spin"
                        />
                        Đang xử lý câu hỏi...
                      </>
                    ) : (
                      activeConversation?.title ??
                      "Trợ lý tư vấn sản phẩm"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Thu nhỏ chat"
                  className="rounded-full p-2 transition hover:bg-white/20"
                >
                  <Minus size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Đóng chat"
                  className="rounded-full p-2 transition hover:bg-white/20"
                >
                  <X size={19} />
                </button>
              </div>
            </header>

            {/* MESSAGES */}

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-[#f7fafb] p-4">
              {!activeConversation && (
                <div className="m-auto text-center text-sm text-gray-400">
                  <MessageCircle
                    size={32}
                    className="mx-auto mb-3 opacity-50"
                  />

                  {isLoggedIn
                    ? "Chọn một cuộc trò chuyện hoặc tạo cuộc trò chuyện mới."
                    : "Vui lòng đăng nhập để tiến hành trò chuyện với AI."}
                </div>
              )}

              {activeConversation && isLoadingMessages && (
                <div className="m-auto flex items-center gap-2 text-sm text-gray-500">
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                  Đang tải tin nhắn...
                </div>
              )}

              {activeConversation && messageError && (
                <p className="break-words rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {messageError}
                </p>
              )}

              {activeConversation &&
                !isLoadingMessages &&
                messages.length === 0 && (
                  <div className="m-auto text-center text-sm text-gray-400">
                    <Bot
                      size={32}
                      className="mx-auto mb-3 opacity-50"
                    />
                    {INITIAL_MESSAGE.content}
                  </div>
                )}

              {!isLoadingMessages &&
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d8f0f1] text-[#087f8c]">
                        <Bot size={18} />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                        message.role === "user"
                          ? "rounded-br-sm bg-[#087f8c] text-white"
                          : "rounded-bl-sm border border-gray-100 bg-white text-gray-700 shadow-sm"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d8f0f1] text-[#087f8c]">
                    <Bot size={18} />
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-gray-100 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
                    <LoaderCircle
                      size={16}
                      className="animate-spin text-[#087f8c]"
                    />
                    <span>AI đang suy nghĩ...</span>
                  </div>
                </div>
              )}
            </div>

            {/* INPUT */}

            <form
              onSubmit={handleSubmit}
              className="border-t border-gray-100 bg-white p-3"
            >
              {!isLoggedIn && (
                <p className="mb-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                  Vui lòng đăng nhập để tiến hành trò chuyện với AI.
                </p>
              )}

              <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 focus-within:border-[#087f8c]">
                <textarea
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  onKeyDown={handleInputKeyDown}
                  placeholder={
                    !isLoggedIn
                      ? "Đăng nhập để trò chuyện với AI..."
                      : activeConversation
                        ? "Hỏi về sản phẩm..."
                        : "Tạo cuộc trò chuyện mới trước..."
                  }
                  rows={1}
                  disabled={
                    !isLoggedIn ||
                    !activeConversation ||
                    isSending ||
                    isCreatingConversation ||
                    Boolean(deletingConversationId)
                  }
                  className="max-h-24 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
                />

                <button
                  type="submit"
                  disabled={
                    !isLoggedIn ||
                    !input.trim() ||
                    !activeConversation ||
                    isSending ||
                    isCreatingConversation ||
                    Boolean(deletingConversationId)
                  }
                  aria-label="Gửi tin nhắn"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#087f8c] text-white transition hover:bg-[#066873] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSending ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={17} />
                  )}
                </button>
              </div>

              <p className="mt-2 text-center text-[10px] text-gray-400">
                AI có thể đưa ra thông tin chưa chính xác.
              </p>
            </form>
          </section>
        </div>
      )}

      {/* FLOATING BUTTON */}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((previous) => !previous)}
          aria-label={
            isOpen ? "Đóng trợ lý AI" : "Mở trợ lý AI"
          }
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#087f8c] text-white shadow-lg shadow-[#087f8c]/30 transition hover:scale-105 hover:bg-[#066873] active:scale-95"
        >
          {isOpen ? (
            <X size={26} />
          ) : (
            <MessageCircle size={27} />
          )}
        </button>
      </div>
    </div>
  );
}
