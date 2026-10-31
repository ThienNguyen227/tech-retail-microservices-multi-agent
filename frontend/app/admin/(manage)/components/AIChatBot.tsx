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
  AlertTriangle,
  Network,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ==================== API ====================

const API_ROOT_URL = "http://127.0.0.1:8000/api/v1/ai-service";

// API dành riêng cho Multi-Agent
const MULTI_AGENT_API_URL = `${API_ROOT_URL}/multi-agent`;

// API quản lý hội thoại dùng chung
const CONVERSATION_API_URL = `${MULTI_AGENT_API_URL}/conversations`;

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
  message?: string;
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

type RenameConversationResponse = {
  conversation_id?: string;
  title?: string;
  updated_at?: string;
  message?: string;
  detail?: string;
};

type ConversationDialog =
  | {
      type: "rename" | "delete";
      conversationId: string;
    }
  | null;

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Xin chào! 👋 Tôi là trợ lý AI đa tác tử. Tôi có thể phối hợp các Agent chuyên biệt để hỗ trợ bạn tra cứu thông tin, tìm kiếm sản phẩm, so sánh sản phẩm và giải đáp các câu hỏi. Bạn cần hỗ trợ gì?",
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

  const [openMenuConversationId, setOpenMenuConversationId] =
    useState<string | null>(null);

  const [deletingConversationId, setDeletingConversationId] =
    useState<string | null>(null);

  const [renamingConversationId, setRenamingConversationId] =
    useState<string | null>(null);

  const [conversationDialog, setConversationDialog] =
    useState<ConversationDialog>(null);

  const [renameTitle, setRenameTitle] = useState("");
  const [dialogError, setDialogError] = useState("");

  const [conversationError, setConversationError] = useState("");
  const [messageError, setMessageError] = useState("");

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );

  const messages = activeConversation?.messages ?? [];

  const dialogConversation = conversationDialog
    ? conversations.find(
        (conversation) =>
          conversation.id === conversationDialog.conversationId
      )
    : undefined;

  const isDialogProcessing =
    Boolean(deletingConversationId) ||
    Boolean(renamingConversationId);

  // ==================== LOAD CONVERSATION LIST ====================

  const loadConversations = useCallback(
    async (
      userId: string,
      signal?: AbortSignal
    ): Promise<Conversation[]> => {
      const response = await fetch(
        `${MULTI_AGENT_API_URL}/conversations?user_id=${encodeURIComponent(
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
          "API Multi-Agent không trả về mảng conversations."
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

        console.error("Load Multi-Agent conversations error:", error);

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
        const userId = sessionStorage.getItem("userId");

        if (!userId) {
          throw new Error(
            "Không tìm thấy user_id. Vui lòng đăng nhập lại."
          );
        }

        const response = await fetch(
          `${MULTI_AGENT_API_URL}/conversations/${encodeURIComponent(
            conversationId
          )}/messages?user_id=${encodeURIComponent(userId)}`,
          { signal: controller.signal }
        );

        const data: MessageListResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              data.message ||
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

        console.error("Load Multi-Agent messages error:", error);

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
        "Vui lòng đăng nhập để trò chuyện với Multi-Agent."
      );
      return;
    }

    if (
      isCreatingConversation ||
      isSending ||
      deletingConversationId ||
      renamingConversationId
    ) {
      return;
    }

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

      const now = new Date().toISOString();

      const newConversation: Conversation = {
        id: data.conversation_id,
        title: data.title || "Cuộc trò chuyện mới",
        messages: [],
        created_at: now,
        updated_at: now,
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
      console.error("Create Multi-Agent conversation error:", error);

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
      deletingConversationId ||
      renamingConversationId
    ) {
      return;
    }

    setActiveConversationId(id);
    setInput("");
    setMessageError("");
    setOpenMenuConversationId(null);
  };

  // ==================== TOGGLE MENU ====================

  const handleToggleMenu = (
    event: MouseEvent<HTMLButtonElement>,
    id: string
  ) => {
    event.stopPropagation();

    setOpenMenuConversationId((currentId) =>
      currentId === id ? null : id
    );
  };

  const closeConversationDialog = () => {
    if (isDialogProcessing) return;

    setConversationDialog(null);
    setRenameTitle("");
    setDialogError("");
  };

  // ==================== OPEN RENAME DIALOG ====================

  const handleOpenRenameDialog = (
    event: MouseEvent<HTMLButtonElement>,
    id: string
  ) => {
    event.stopPropagation();

    if (
      isSending ||
      isCreatingConversation ||
      deletingConversationId ||
      renamingConversationId
    ) {
      return;
    }

    const conversation = conversations.find(
      (item) => item.id === id
    );

    if (!conversation) return;

    setRenameTitle(conversation.title);
    setDialogError("");
    setConversationError("");
    setOpenMenuConversationId(null);

    setConversationDialog({
      type: "rename",
      conversationId: id,
    });
  };

  // ==================== RENAME CONVERSATION ====================

  const handleConfirmRename = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      conversationDialog?.type !== "rename" ||
      isDialogProcessing ||
      isSending ||
      isCreatingConversation
    ) {
      return;
    }

    const id = conversationDialog.conversationId;
    const userId = sessionStorage.getItem("userId");
    const title = renameTitle.trim();

    if (!userId) {
      setIsLoggedIn(false);
      setDialogError(
        "Vui lòng đăng nhập để đổi tên cuộc trò chuyện."
      );
      return;
    }

    if (!title) {
      setDialogError("Tên cuộc trò chuyện không được để trống.");
      return;
    }

    if (title.length > 150) {
      setDialogError("Tên cuộc trò chuyện tối đa 150 ký tự.");
      return;
    }

    const conversation = conversations.find(
      (item) => item.id === id
    );

    if (!conversation) {
      setDialogError("Không tìm thấy cuộc trò chuyện.");
      return;
    }

    if (title === conversation.title) {
      closeConversationDialog();
      return;
    }

    setRenamingConversationId(id);
    setDialogError("");

    try {
      const params = new URLSearchParams({
        user_id: userId,
        title,
      });

      const response = await fetch(
        `${CONVERSATION_API_URL}/${encodeURIComponent(
          id
        )}/rename?${params.toString()}`,
        { method: "PATCH" }
      );

      const data: RenameConversationResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            `Không thể đổi tên hội thoại (HTTP ${response.status}).`
        );
      }

      if (!data.title) {
        throw new Error(
          "API đổi tên không trả về title mới."
        );
      }

      setConversations((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                title: data.title!,
                updated_at:
                  data.updated_at ??
                  new Date().toISOString(),
              }
            : item
        )
      );

      setConversationDialog(null);
      setRenameTitle("");
      setDialogError("");
      setConversationError("");
    } catch (error) {
      console.error("Rename conversation error:", error);

      setDialogError(
        error instanceof Error
          ? error.message
          : "Không thể đổi tên cuộc trò chuyện."
      );
    } finally {
      setRenamingConversationId(null);
    }
  };

  // ==================== OPEN DELETE DIALOG ====================

  const handleOpenDeleteDialog = (
    event: MouseEvent<HTMLButtonElement>,
    id: string
  ) => {
    event.stopPropagation();

    if (
      isSending ||
      isCreatingConversation ||
      deletingConversationId ||
      renamingConversationId
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

    setDialogError("");
    setConversationError("");
    setOpenMenuConversationId(null);

    setConversationDialog({
      type: "delete",
      conversationId: id,
    });
  };

  // ==================== DELETE CONVERSATION ====================

  const handleConfirmDelete = async () => {
    if (
      conversationDialog?.type !== "delete" ||
      isDialogProcessing ||
      isSending ||
      isCreatingConversation
    ) {
      return;
    }

    const id = conversationDialog.conversationId;
    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      setIsLoggedIn(false);
      setDialogError(
        "Vui lòng đăng nhập để xóa cuộc trò chuyện."
      );
      return;
    }

    setDeletingConversationId(id);
    setDialogError("");

    try {
      const response = await fetch(
        `${CONVERSATION_API_URL}/${encodeURIComponent(
          id
        )}?user_id=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
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

      setConversations((previous) =>
        previous.filter((item) => item.id !== id)
      );

      if (activeConversationId === id) {
        const nextConversation = conversations.find(
          (item) => item.id !== id
        );

        setActiveConversationId(nextConversation?.id ?? null);
        setInput("");
        setMessageError("");
      }

      setConversationDialog(null);
      setDialogError("");
      setConversationError("");
    } catch (error) {
      console.error("Delete conversation error:", error);

      setDialogError(
        error instanceof Error
          ? error.message
          : "Không thể xóa cuộc trò chuyện."
      );
    } finally {
      setDeletingConversationId(null);
    }
  };

  // ==================== SEND MESSAGE TO MULTI-AGENT ====================

  const handleSend = async () => {
    const content = input.trim();

    if (
      !content ||
      !activeConversationId ||
      isSending ||
      isCreatingConversation ||
      deletingConversationId ||
      renamingConversationId ||
      conversationDialog
    ) {
      return;
    }

    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      setIsLoggedIn(false);
      setMessageError(
        "Vui lòng đăng nhập để trò chuyện với Multi-Agent."
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

      // Gọi Multi-Agent thay vì Product-Agent
      const response = await fetch(
        `${MULTI_AGENT_API_URL}?${params.toString()}`,
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
          "API Multi-Agent không trả về conversation_id."
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

      // Đồng bộ lại danh sách hội thoại từ backend
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
          "Refresh Multi-Agent conversations error:",
          refreshError
        );
      }
    } catch (error) {
      console.error("Send Multi-Agent message error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Multi-Agent đang gặp sự cố. Bạn vui lòng thử lại sau nhé.";

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
    <>
      <div className="fixed bottom-4 right-4 z-50">
        {isOpen && (
          <div className="mb-4 flex h-[min(600px,calc(100dvh-100px))] w-[min(800px,calc(100vw-32px))] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-2xl">

            {/* ==================== SIDEBAR ==================== */}

            {isSidebarOpen && (
              <aside className="flex w-[230px] shrink-0 flex-col border-r border-blue-100 bg-blue-50/70">
                <div className="flex items-center justify-between border-b border-blue-100 px-3 py-4">
                  <span className="text-sm font-semibold text-blue-950">
                    Lịch sử chat
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-label="Đóng sidebar"
                    className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-100"
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
                      Boolean(deletingConversationId) ||
                      Boolean(renamingConversationId)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-medium text-blue-700 transition hover:border-blue-500 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <p className="px-2 pb-2 pt-1 text-xs text-blue-400">
                    Các cuộc trò chuyện
                  </p>

                  {isLoadingConversations && (
                    <div className="flex items-center gap-2 px-2 py-3 text-xs text-blue-600">
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
                    <p className="px-2 py-3 text-xs leading-5 text-blue-700">
                      Vui lòng đăng nhập để xem lịch sử trò chuyện.
                    </p>
                  )}

                  {isLoggedIn &&
                    !isLoadingConversations &&
                    !conversationError &&
                    conversations.length === 0 && (
                      <p className="px-2 py-3 text-xs leading-5 text-blue-400">
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
                          ? "bg-blue-100 text-blue-800"
                          : "text-slate-600 hover:bg-blue-100/60"
                      }`}
                    >
                      <MessageSquare
                        size={16}
                        className="shrink-0"
                      />

                      <span className="min-w-0 flex-1 truncate text-xs">
                        {conversation.title}
                      </span>

                      {(renamingConversationId === conversation.id ||
                        deletingConversationId === conversation.id) && (
                        <LoaderCircle
                          size={15}
                          className="shrink-0 animate-spin"
                        />
                      )}

                      {/* MENU 3 CHẤM */}

                      <button
                        type="button"
                        onClick={(event) =>
                          handleToggleMenu(event, conversation.id)
                        }
                        disabled={
                          isSending ||
                          isCreatingConversation ||
                          Boolean(deletingConversationId) ||
                          Boolean(renamingConversationId)
                        }
                        aria-label="Tùy chọn hội thoại"
                        aria-expanded={
                          openMenuConversationId === conversation.id
                        }
                        className="shrink-0 rounded-md p-1 text-blue-500 opacity-0 transition hover:bg-blue-200/70 group-hover:opacity-100 focus:opacity-100 disabled:cursor-not-allowed"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {/* MENU OPTIONS */}

                      {openMenuConversationId === conversation.id && (
                        <div
                          onClick={(event) => event.stopPropagation()}
                          className="absolute right-2 top-10 z-50 w-48 overflow-hidden rounded-xl border border-blue-100 bg-white py-1 shadow-lg"
                        >
                          <button
                            type="button"
                            onClick={(event) =>
                              handleOpenRenameDialog(
                                event,
                                conversation.id
                              )
                            }
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-slate-700 transition hover:bg-blue-50"
                          >
                            <Pencil size={15} />
                            Đổi tên cuộc trò chuyện
                          </button>

                          <button
                            type="button"
                            onClick={(event) =>
                              handleOpenDeleteDialog(
                                event,
                                conversation.id
                              )
                            }
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                            Xóa cuộc trò chuyện
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-blue-100 p-3">
                  <div className="flex items-center gap-2 text-xs text-blue-700">
                    <Network size={17} />
                    <span>AI Multi-Agent Assistant</span>
                  </div>
                </div>
              </aside>
            )}

            {/* ==================== CHAT PANEL ==================== */}

            <section className="flex min-w-0 flex-1 flex-col">
              <header className="flex items-center justify-between border-b border-blue-700 bg-blue-600 px-3 py-3.5 text-white">
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
                    <Network size={21} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">
                      AI Multi-Agent
                    </h3>

                    <p className="flex items-center gap-1.5 truncate text-xs text-blue-100">
                      {deletingConversationId ? (
                        <>
                          <LoaderCircle
                            size={12}
                            className="animate-spin"
                          />
                          Đang xóa hội thoại...
                        </>
                      ) : renamingConversationId ? (
                        <>
                          <LoaderCircle
                            size={12}
                            className="animate-spin"
                          />
                          Đang đổi tên hội thoại...
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
                          Các Agent đang xử lý...
                        </>
                      ) : (
                        activeConversation?.title ??
                        "Trợ lý AI đa tác tử"
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

              {/* ==================== MESSAGES ==================== */}

              <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-blue-50/40 p-4">
                {!activeConversation && (
                  <div className="m-auto text-center text-sm text-slate-400">
                    <Network
                      size={34}
                      className="mx-auto mb-3 text-blue-400 opacity-70"
                    />

                    {isLoggedIn
                      ? "Chọn một cuộc trò chuyện hoặc tạo cuộc trò chuyện mới."
                      : "Vui lòng đăng nhập để trò chuyện với AI."}
                  </div>
                )}

                {activeConversation && isLoadingMessages && (
                  <div className="m-auto flex items-center gap-2 text-sm text-blue-600">
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Đang tải tin nhắn...
                  </div>
                )}

                {activeConversation && messageError && (
                  <p className="break-words rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                    {messageError}
                  </p>
                )}

                {activeConversation &&
                  !isLoadingMessages &&
                  messages.length === 0 && (
                    <div className="m-auto max-w-md text-center text-sm text-slate-400">
                      <Network
                        size={36}
                        className="mx-auto mb-3 text-blue-400 opacity-70"
                      />
                      <p className="leading-6">
                        {INITIAL_MESSAGE.content}
                      </p>
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
                        <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                          <Network size={17} />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] min-w-0 break-words rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                          message.role === "user"
                            ? "whitespace-pre-wrap rounded-br-sm bg-blue-600 text-white"
                            : "rounded-bl-sm border border-blue-100 bg-white text-slate-700 shadow-sm"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0">
                                  {children}
                                </p>
                              ),

                              strong: ({ children }) => (
                                <strong className="font-semibold text-slate-900">
                                  {children}
                                </strong>
                              ),

                              em: ({ children }) => (
                                <em className="italic">{children}</em>
                              ),

                              h1: ({ children }) => (
                                <h1 className="mb-2 mt-3 text-lg font-bold text-slate-900 first:mt-0">
                                  {children}
                                </h1>
                              ),

                              h2: ({ children }) => (
                                <h2 className="mb-2 mt-3 text-base font-bold text-slate-900 first:mt-0">
                                  {children}
                                </h2>
                              ),

                              h3: ({ children }) => (
                                <h3 className="mb-2 mt-3 text-sm font-bold text-slate-900 first:mt-0">
                                  {children}
                                </h3>
                              ),

                              ul: ({ children }) => (
                                <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">
                                  {children}
                                </ul>
                              ),

                              ol: ({ children }) => (
                                <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">
                                  {children}
                                </ol>
                              ),

                              li: ({ children }) => (
                                <li className="pl-1">{children}</li>
                              ),

                              blockquote: ({ children }) => (
                                <blockquote className="my-2 border-l-4 border-blue-300 pl-3 text-slate-500">
                                  {children}
                                </blockquote>
                              ),

                              table: ({ children }) => (
                                <div className="my-3 w-full overflow-x-auto rounded-lg border border-blue-100">
                                  <table className="w-full border-collapse text-left text-xs">
                                    {children}
                                  </table>
                                </div>
                              ),

                              thead: ({ children }) => (
                                <thead className="bg-blue-50 text-slate-800">
                                  {children}
                                </thead>
                              ),

                              th: ({ children }) => (
                                <th className="border-b border-blue-100 px-3 py-2 font-semibold">
                                  {children}
                                </th>
                              ),

                              td: ({ children }) => (
                                <td className="border-b border-blue-50 px-3 py-2">
                                  {children}
                                </td>
                              ),

                              code: ({ children, className }) => {
                                const isBlock = Boolean(className);

                                return isBlock ? (
                                  <code className="block overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs leading-5 text-slate-100">
                                    {children}
                                  </code>
                                ) : (
                                  <code className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                                    {children}
                                  </code>
                                );
                              },

                              pre: ({ children }) => (
                                <pre className="my-2 max-w-full overflow-x-auto rounded-lg bg-slate-900">
                                  {children}
                                </pre>
                              ),

                              a: ({ children, href }) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800"
                                >
                                  {children}
                                </a>
                              ),

                              hr: () => (
                                <hr className="my-3 border-blue-100" />
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      <Network size={17} />
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-blue-100 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                      <LoaderCircle
                        size={16}
                        className="animate-spin text-blue-600"
                      />
                      <span>Các Agent đang phối hợp xử lý...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ==================== INPUT ==================== */}

              <form
                onSubmit={handleSubmit}
                className="border-t border-blue-100 bg-white p-3"
              >
                {!isLoggedIn && (
                  <p className="mb-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                    Vui lòng đăng nhập để trò chuyện với Multi-Agent.
                  </p>
                )}

                <div className="flex items-end gap-2 rounded-2xl border border-blue-200 bg-blue-50/50 p-2 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
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
                          ? "Nhập câu hỏi cho AI Multi-Agent..."
                          : "Tạo cuộc trò chuyện mới trước..."
                    }
                    rows={1}
                    disabled={
                      !isLoggedIn ||
                      !activeConversation ||
                      isSending ||
                      isCreatingConversation ||
                      Boolean(deletingConversationId) ||
                      Boolean(renamingConversationId) ||
                      Boolean(conversationDialog)
                    }
                    className="max-h-24 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                  />

                  <button
                    type="submit"
                    disabled={
                      !isLoggedIn ||
                      !input.trim() ||
                      !activeConversation ||
                      isSending ||
                      isCreatingConversation ||
                      Boolean(deletingConversationId) ||
                      Boolean(renamingConversationId) ||
                      Boolean(conversationDialog)
                    }
                    aria-label="Gửi tin nhắn"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
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

                <p className="mt-2 text-center text-[10px] text-slate-400">
                  Multi-Agent có thể đưa ra thông tin chưa chính xác.
                </p>
              </form>
            </section>
          </div>
        )}

        {/* ==================== FLOATING BUTTON ==================== */}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsOpen((previous) => !previous)}
            aria-label={
              isOpen ? "Đóng trợ lý AI" : "Mở trợ lý AI"
            }
            className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition hover:scale-105 hover:bg-blue-700 active:scale-95"
          >
            {isOpen ? (
              <X size={26} />
            ) : (
              <Network size={25} />
            )}
          </button>
        </div>
      </div>

      {/* ==================== RENAME / DELETE DIALOG ==================== */}

      {conversationDialog && dialogConversation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isDialogProcessing
            ) {
              closeConversationDialog();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="conversation-dialog-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl"
          >
            {/* DIALOG HEADER */}

            <div className="flex items-start gap-3 px-5 pb-4 pt-5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  conversationDialog.type === "delete"
                    ? "bg-red-50 text-red-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {conversationDialog.type === "delete" ? (
                  <AlertTriangle size={22} />
                ) : (
                  <Pencil size={21} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="conversation-dialog-title"
                  className="text-base font-semibold text-slate-900"
                >
                  {conversationDialog.type === "rename"
                    ? "Đổi tên cuộc trò chuyện"
                    : "Xóa cuộc trò chuyện"}
                </h2>

                <p className="mt-1 break-words text-sm leading-5 text-slate-500">
                  {conversationDialog.type === "rename"
                    ? "Nhập tên mới để dễ dàng nhận biết cuộc trò chuyện."
                    : "Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Toàn bộ tin nhắn liên quan cũng sẽ bị xóa và không thể khôi phục."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeConversationDialog}
                disabled={isDialogProcessing}
                aria-label="Đóng popup"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-slate-700 disabled:opacity-40"
              >
                <X size={19} />
              </button>
            </div>

            {/* DIALOG BODY */}

            {conversationDialog.type === "rename" ? (
              <form onSubmit={handleConfirmRename}>
                <div className="px-5 pb-5">
                  <label
                    htmlFor="rename-conversation-title"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Tên cuộc trò chuyện
                  </label>

                  <input
                    id="rename-conversation-title"
                    type="text"
                    value={renameTitle}
                    onChange={(event) => {
                      setRenameTitle(event.target.value);
                      setDialogError("");
                    }}
                    maxLength={150}
                    autoFocus
                    disabled={isDialogProcessing}
                    placeholder="Nhập tên cuộc trò chuyện..."
                    className="w-full rounded-xl border border-blue-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />

                  <div className="mt-1.5 flex justify-end">
                    <span className="text-xs text-slate-400">
                      {renameTitle.length}/150
                    </span>
                  </div>

                  {dialogError && (
                    <p
                      role="alert"
                      className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                    >
                      {dialogError}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t border-blue-100 bg-blue-50/50 px-5 py-4">
                  <button
                    type="button"
                    onClick={closeConversationDialog}
                    disabled={isDialogProcessing}
                    className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 disabled:opacity-50"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    disabled={
                      isDialogProcessing ||
                      !renameTitle.trim() ||
                      renameTitle.trim() === dialogConversation.title
                    }
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {renamingConversationId && (
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                    )}

                    {renamingConversationId
                      ? "Đang lưu..."
                      : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="mx-5 mb-5 rounded-xl border border-red-100 bg-red-50/70 p-3">
                  <div className="flex items-start gap-2">
                    <MessageSquare
                      size={17}
                      className="mt-0.5 shrink-0 text-red-500"
                    />

                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-slate-800">
                        {dialogConversation.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Hội thoại và toàn bộ tin nhắn liên quan sẽ bị xóa.
                      </p>
                    </div>
                  </div>
                </div>

                {dialogError && (
                  <p
                    role="alert"
                    className="mx-5 mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                  >
                    {dialogError}
                  </p>
                )}

                <div className="flex justify-end gap-2 border-t border-blue-100 bg-blue-50/50 px-5 py-4">
                  <button
                    type="button"
                    onClick={closeConversationDialog}
                    disabled={isDialogProcessing}
                    className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 disabled:opacity-50"
                  >
                    Hủy
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleConfirmDelete()}
                    disabled={isDialogProcessing}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingConversationId && (
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                    )}

                    {deletingConversationId
                      ? "Đang xóa..."
                      : "Xóa cuộc trò chuyện"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}