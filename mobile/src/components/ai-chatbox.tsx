import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import Svg, { Path } from 'react-native-svg';

import { LinearGradient } from 'expo-linear-gradient';

import { AI_SERVICE_URL } from '@/constants/api';
import { getStoredUser } from '@/lib/storage/secure_storage';

// ==================== API ====================

const AI_PRODUCT_URL = `${AI_SERVICE_URL}/product`;
const AI_CONVERSATION_URL = `${AI_SERVICE_URL}/conversations`;



type AIMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
};

type AIConversation = {
  id: string;
  title: string;
  messages: AIMessage[];
  created_at?: string;
  updated_at?: string;
};

type ConversationListResponse = {
  conversations?: {
    conversation_id: string;
    title?: string;
    created_at?: string;
    updated_at?: string;
  }[];
  detail?: string;
  message?: string;
};

type MessageListResponse = {
  messages?: AIMessage[];
  detail?: string;
  message?: string;
};

type ChatResponse = {
  conversation_id: string;
  message: string;
  detail?: string;
};

type ConversationAction = 'menu' | 'rename' | 'delete' | null;

const welcomeMessage: AIMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Xin chào! 👋 Tôi là trợ lý AI tư vấn sản phẩm công nghệ. Tôi có thể giúp gì cho bạn?',
};

async function requestAI<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json()) as T & {
    detail?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        `Yêu cầu AI thất bại (HTTP ${response.status}).`,
    );
  }

  return data;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function MarkdownMessage({
  content,
  user,
}: {
  content: string;
  user: boolean;
}) {
  const textColor = user ? '#ffffff' : '#334155';

  return (
    <Markdown
      rules={{
        // Văn bản thông thường
        text: (node, _children, _parent, styles) => (
          <Text key={node.key} selectable style={styles.text}>
            {node.content}
          </Text>
        ),

        // Đoạn văn: cho phép chọn cả nội dung trong đoạn
        paragraph: (node, children, _parent, styles) => (
          <Text key={node.key} selectable style={styles.paragraph}>
            {children}
          </Text>
        ),

        // Các tiêu đề
        heading1: (node, children, _parent, styles) => (
          <Text key={node.key} selectable style={styles.heading1}>
            {children}
          </Text>
        ),
        heading2: (node, children, _parent, styles) => (
          <Text key={node.key} selectable style={styles.heading2}>
            {children}
          </Text>
        ),
        heading3: (node, children, _parent, styles) => (
          <Text key={node.key} selectable style={styles.heading3}>
            {children}
          </Text>
        ),
      }}
      style={{
        body: {
          color: textColor,
          fontSize: 12,
          lineHeight: 20,
        },
        text: {
          color: textColor,
        },
        paragraph: {
          color: textColor,
          marginTop: 0,
          marginBottom: 8,
        },
        heading1: {
          color: textColor,
          fontSize: 18,
          fontWeight: '700',
          marginTop: 12,
          marginBottom: 8,
        },
        heading2: {
          color: textColor,
          fontSize: 16,
          fontWeight: '700',
          marginTop: 10,
          marginBottom: 6,
        },
        heading3: {
          color: textColor,
          fontSize: 14,
          fontWeight: '700',
          marginTop: 8,
          marginBottom: 4,
        },
        strong: {
          fontWeight: '700',
        },
        bullet_list: {
          marginVertical: 4,
        },
        ordered_list: {
          marginVertical: 4,
        },
        list_item: {
          marginVertical: 2,
        },
        code_inline: {
          color: user ? '#ffffff' : '#0f766e',
          backgroundColor: user ? '#08717a' : '#f1f5f9',
          fontFamily: 'monospace',
          borderRadius: 4,
        },
        fence: {
          color: '#334155',
          backgroundColor: '#f1f5f9',
          padding: 10,
          borderRadius: 8,
          marginVertical: 6,
        },
        blockquote: {
          borderLeftWidth: 3,
          borderLeftColor: user ? '#ffffff' : '#0d9488',
          paddingLeft: 10,
          marginVertical: 6,
        },
        table: {
          borderWidth: 1,
          borderColor: user ? '#ffffff80' : '#cbd5e1',
          borderRadius: 6,
          marginVertical: 6,
        },
        thead: {
          backgroundColor: user ? '#08717a' : '#e2e8f0',
        },
        th: {
          padding: 5,
          borderWidth: 1,
          borderColor: user ? '#ffffff80' : '#cbd5e1',
          fontWeight: '700',
          color: textColor,
        },
        tr: {
          borderBottomWidth: 1,
          borderColor: user ? '#ffffff80' : '#cbd5e1',
        },
        td: {
          padding: 5,
          borderWidth: 1,
          borderColor: user ? '#ffffff80' : '#cbd5e1',
          color: textColor,
        },
        link: {
          color: user ? '#ffffff' : '#0d9488',
          textDecorationLine: 'underline',
        },
        hr: {
          backgroundColor: user ? '#ffffff80' : '#cbd5e1',
          height: 1,
          marginVertical: 8,
        },
      }}
    >
      {content}
    </Markdown>
  );
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createAnimation = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(300),
        ]),
      );

    const animations = [
      createAnimation(dot1, 0),
      createAnimation(dot2, 180),
      createAnimation(dot3, 360),
    ];

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [dot1, dot2, dot3]);

  return (
    <View className="flex-row items-center gap-1.5 px-1 py-1">
      {[dot1, dot2, dot3].map((dot, index) => (
        <Animated.View
          key={index}
          className="h-2 w-2 rounded-full bg-[#168b87]"
          style={{ opacity: dot }}
        />
      ))}
    </View>
  );
}

export default function AIChatbox() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionConversationId, setActionConversationId] = useState<string | null>(null);
  const [conversationAction, setConversationAction] = useState<ConversationAction>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [historyVersion, setHistoryVersion] = useState(0);
  const messagesScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const conversationRefs = useRef<Record<string, ComponentRef<typeof View> | null>>({});
  // Animation cho hiệu ứng gradient nền khi mở chatbox
  const gradientOpacity = useRef(new Animated.Value(0)).current;

  // Animation cho slide menu lịch sử
  const sidebarTranslateX = useRef(new Animated.Value(-width * 0.82)).current;
  const sidebarOverlayOpacity = useRef(new Animated.Value(0)).current;

  // Animation cho floating AI button
  const pulseScale = useRef(new Animated.Value(0.85)).current;
  const pulseOpacity = useRef(new Animated.Value(0.65)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  // Animation cho popup menu Đổi tên / Xóa
  const actionMenuScale = useRef(new Animated.Value(0.85)).current;
  const actionMenuOpacity = useRef(new Animated.Value(0)).current;
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const buttonSize = 56;
  const horizontalMargin = 16;
  const minimumTop = insets.top + 8;
  const maximumTop = Math.max(
    minimumTop,
    height - insets.bottom - buttonSize,
  );
  const [buttonPosition, setButtonPosition] = useState({
    x: Math.max(horizontalMargin, width - buttonSize - horizontalMargin),
    y: maximumTop,
  });
  const positionRef = useRef(buttonPosition);
  const dragStart = useRef(buttonPosition);
  const hasMoved = useRef(false);

  // Cập nhật vị trí nút AI khi thay đổi kích thước màn hình hoặc lề an toàn
  useEffect(() => {
    setButtonPosition((current) => {
      const nextPosition = {
      x: Math.min(
        Math.max(horizontalMargin, current.x),
        Math.max(horizontalMargin, width - buttonSize - horizontalMargin),
      ),
      y: Math.min(Math.max(minimumTop, current.y), maximumTop),
      };
      positionRef.current = nextPosition;
      return nextPosition;
    });
  }, [height, width, insets.bottom, insets.top, maximumTop, minimumTop]);

  // Hiệu ứng gradient nền khi mở chatbox
  useEffect(() => {
    const gradientAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientOpacity, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(gradientOpacity, {
          toValue: 0,
          duration: 3500,
          useNativeDriver: true,
        }),
      ]),
    );

    gradientAnimation.start();

    return () => gradientAnimation.stop();
  }, [gradientOpacity]);

  // Hiệu ứng hào quang và chuyển động cho icon AI
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 1.55,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    );

    const iconAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseAnimation.start();
    iconAnimation.start();

    return () => {
      pulseAnimation.stop();
      iconAnimation.stop();
    };
  }, [pulseScale, pulseOpacity, iconScale]);

  // Hiệu ứng slide menu lịch sử hội thoại
  useEffect(() => {
    if (!menuOpen) return;

    sidebarTranslateX.setValue(-width * 0.82);
    sidebarOverlayOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(sidebarTranslateX, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(sidebarOverlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [menuOpen, width, sidebarTranslateX, sidebarOverlayOpacity]);

  // Hiệu ứng popup menu Đổi tên / Xóa hội thoại
  useEffect(() => {
    if (conversationAction !== 'menu') return;

    actionMenuScale.setValue(0.85);
    actionMenuOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(actionMenuScale, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(actionMenuOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [conversationAction, actionMenuScale, actionMenuOpacity]);

  // PanResponder callbacks need mutable gesture state between render cycles.
  // eslint-disable-next-line react-hooks/refs
  const panResponder = useMemo(() => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStart.current = positionRef.current;
        hasMoved.current = false;
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3) {
          hasMoved.current = true;
        }

        const nextPosition = {
          x: Math.min(
            Math.max(horizontalMargin, dragStart.current.x + gesture.dx),
            Math.max(horizontalMargin, width - buttonSize - horizontalMargin),
          ),
          y: Math.min(
            Math.max(minimumTop, dragStart.current.y + gesture.dy),
            maximumTop,
          ),
        };
        positionRef.current = nextPosition;
        setButtonPosition(nextPosition);
      },
      onPanResponderRelease: () => {
        if (!hasMoved.current) {
          setVisible(true);
        }
      },
    }), [width, maximumTop, minimumTop]);

  // Lấy danh sách hội thoại khi mở chatbox
  useEffect(() => {
    if (!visible) return;
    getStoredUser().then(({ userId: storedUserId }) => {
      setUserId(storedUserId);
      if (storedUserId) {
        setLoading(true);
        const params = new URLSearchParams({ user_id: storedUserId });
        requestAI<ConversationListResponse>(`${AI_PRODUCT_URL}/conversations?${params.toString()}`)
          .then((data) => {
            const items = (data.conversations ?? []).map((item) => ({
              id: item.conversation_id,
              title: item.title || 'Cuộc trò chuyện mới',
              messages: [],
              created_at: item.created_at,
              updated_at: item.updated_at,
            }));
            setConversations(items);
            setHistoryVersion((version) => version + 1);
            setActiveId((current) =>
              current && items.some((item) => item.id === current)
                ? current
                : items[0]?.id ?? null,
            );
          })
          .catch((requestError) => setError(getErrorMessage(requestError, 'Không thể tải lịch sử chat.')))
          .finally(() => setLoading(false));
      }
    }).catch((requestError) => {
      setError(getErrorMessage(requestError, 'Không thể tải lịch sử chat.'));
    });
  }, [visible]);

  // Lấy danh sách tin nhắn của hội thoại đang hoạt động
  useEffect(() => {
    if (!activeId) return;
    const conversationId = activeId;
    requestAI<MessageListResponse>(
      `${AI_PRODUCT_URL}/conversations/${encodeURIComponent(conversationId)}/messages`,
    )
      .then((data) => {
        setConversations((items) => items.map((item) => item.id === conversationId ? { ...item, messages: data.messages ?? [] } : item));
      })
      .catch((requestError) => setError(getErrorMessage(requestError, 'Không thể tải tin nhắn.')))
      .finally(() => setLoading(false));
  }, [activeId, historyVersion]);

  const activeConversation = conversations.find((item) => item.id === activeId);

  const createConversation = async () => {
    if (!userId || loading || sending) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ user_id: userId });
      if (activeConversation?.messages.length && activeId) {
        params.set('conversation_id', activeId);
      }
      const response = await requestAI<{ conversation_id: string; title?: string }>(
        `${AI_CONVERSATION_URL}?${params.toString()}`,
        { method: 'POST' },
      );
      const conversation: AIConversation = {
        id: response.conversation_id,
        title: response.title || 'Cuộc trò chuyện mới',
        messages: [],
        updated_at: new Date().toISOString(),
      };
      setConversations((items) => [conversation, ...items.filter((item) => item.id !== conversation.id)]);
      setActiveId(conversation.id);
      setInput('');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể tạo cuộc trò chuyện.'));
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!userId || !activeId || !content || sending) return;
    const currentId = activeId;
    const userMessage: AIMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setConversations((items) => items.map((item) => item.id === currentId ? {
      ...item,
      title: item.messages.length === 0 ? content.slice(0, 40) : item.title,
      messages: [...item.messages, userMessage],
    } : item));
    setInput('');
    setSending(true);
    setError('');
    try {
      const params = new URLSearchParams({
        message: content,
        user_id: userId,
        conversation_id: currentId,
      });
      const response = await requestAI<ChatResponse>(
        `${AI_PRODUCT_URL}?${params.toString()}`,
        { method: 'POST' },
      );
      setConversations((items) => items.map((item) => item.id === currentId ? {
        ...item,
        id: response.conversation_id,
        messages: [...item.messages, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          created_at: new Date().toISOString(),
        }],
        updated_at: new Date().toISOString(),
      } : item));
      if (response.conversation_id !== currentId) setActiveId(response.conversation_id);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể gửi tin nhắn.'));
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!userId || loading || sending) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ user_id: userId });
      await requestAI(`${AI_CONVERSATION_URL}/${encodeURIComponent(conversationId)}?${params.toString()}`, {
        method: 'DELETE',
      });
      const remaining = conversations.filter((item) => item.id !== conversationId);
      setConversations(remaining);
      if (activeId === conversationId) setActiveId(remaining[0]?.id ?? null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể xóa cuộc trò chuyện.'));
    } finally {
      setLoading(false);
    }
  };

  const renameConversation = async () => {
    if (!userId || !actionConversationId || !renameTitle.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        user_id: userId,
        title: renameTitle.trim(),
      });
      const response = await requestAI<{ title: string; updated_at?: string }>(
        `${AI_CONVERSATION_URL}/${encodeURIComponent(actionConversationId)}/rename?${params.toString()}`,
        { method: 'PATCH' },
      );
      setConversations((items) => items.map((item) => item.id === actionConversationId
        ? { ...item, title: response.title, updated_at: response.updated_at }
        : item));
      setConversationAction(null);
      setActionConversationId(null);
      setRenameTitle('');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể đổi tên cuộc trò chuyện.'));
    } finally {
      setLoading(false);
    }
  };

  const openConversationActions = (conversation: AIConversation) => {
    const conversationRef = conversationRefs.current[conversation.id];

    if (!conversationRef) return;

    conversationRef.measureInWindow(
      (x: number, y: number, rowWidth: number, rowHeight: number) => {
        const menuWidth = 180;
        const menuHeight = 104;
        const spacing = 6;

        const left = Math.max(
          12,
          Math.min(x + rowWidth - menuWidth, width - menuWidth - 12),
        );

        const top =
          y + rowHeight + menuHeight + spacing <= height - insets.bottom
            ? y + rowHeight + spacing - insets.top
            : y - menuHeight - spacing - insets.top;

        setMenuPosition({ top, left });
        setActionConversationId(conversation.id);
        setRenameTitle(conversation.title);
        setConversationAction('menu');
      },
    );
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarTranslateX, {
        toValue: -width * 0.82,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(sidebarOverlayOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMenuOpen(false);
      }
    });
  };

  return (
    <>
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          position: 'absolute',
          left: buttonPosition.x,
          top: buttonPosition.y,
          width: buttonSize,
          height: buttonSize,
          zIndex: 50,
        }}
      >
        {/* Vòng lan tỏa: tâm trùng với tâm nút */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: buttonSize,
            height: buttonSize,
            left: 0,
            top: 0,
            borderRadius: buttonSize / 2,
            borderWidth: 2,
            borderColor: '#168b87',
            opacity: pulseOpacity,
            transform: [{ scale: pulseScale }],
          }}
        />

        {/* Nút chính */}
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            overflow: 'hidden',
            elevation: 12,
            shadowColor: '#168bff',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.45,
            shadowRadius: 10,
          }}
        >
          {/* Gradient nền thứ nhất */}
          <LinearGradient
            colors={['#087f8c', '#168b87', '#09ac86e6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
            }}
          />

          {/* Gradient thứ hai: chuyển màu luân phiên */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              opacity: gradientOpacity,
            }}
          >
            <LinearGradient
              colors={['#139a9f', '#01b9b9', '#04fcd2f9']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </Animated.View>

          {/* Ngôi sao SVG ở trung tâm */}
          <Animated.View
            style={{
              width: 30,
              height: 30,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: iconScale }],
            }}
          >
            <Svg width={28} height={28} viewBox="0 0 24 24">
              <Path
                d="M12 1.5L14.8 9.2L22.5 12L14.8 14.8L12 22.5L9.2 14.8L1.5 12L9.2 9.2Z"
                fill="#FFFFFF"
              />
            </Svg>
          </Animated.View>

          {/* Hai điểm sáng trang trí bên trong */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 10,
              top: 12,
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: '#ffffff',
            }}
          />

          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: 13,
              bottom: 10,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#b8fff2',
            }}
          />
        </View>

        {/* Điểm sáng nhỏ */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: 9,
            height: 9,
            borderRadius: 5,
            right: 4,
            top: 4,
            backgroundColor: '#00aeff',
            borderWidth: 1.5,
            borderColor: '#ffffff',
          }}
        />
      </Animated.View>

      <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
        <SafeChatArea>
          <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View className="flex-1 bg-[#f7fafb]">
              <View className="flex-row items-center justify-between bg-[#073b4c] px-4 pb-4 pt-3">
                <Pressable
                  className="mr-3 h-10 w-10 items-center justify-center rounded-lg bg-white/10"
                  onPress={() => setMenuOpen(true)}
                  accessibilityLabel="Mở lịch sử hội thoại"
                >
                  <Text className="text-2xl text-white">☰</Text>
                </Pressable>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-white">AI Assistant</Text>
                  <Text className="mt-1 text-xs text-teal-100">{activeConversation?.title || 'Trợ lý tư vấn sản phẩm'}</Text>
                </View>
                <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white/15" onPress={() => setVisible(false)}><Text className="text-xl text-white">×</Text></Pressable>
              </View>

              {!userId ? (
                <View className="flex-1 items-center justify-center px-8"><Text className="text-center text-sm leading-6 text-slate-500">Vui lòng đăng nhập để trò chuyện với AI.</Text></View>
              ) : (
                <>
                  <ScrollView ref={messagesScrollRef} className="flex-1" contentContainerClassName="gap-3 px-4 py-4 pb-6" keyboardShouldPersistTaps="handled" onContentSizeChange={() => messagesScrollRef.current?.scrollToEnd({ animated: true })}>
                    
                    {/* Hiển thị loading khi đang tải tin nhắn */}
                    {loading ? <ActivityIndicator color="#168b87" /> : null}
                    {activeConversation?.messages.length ? activeConversation.messages.map((message) => (
                      <View
                        key={message.id}
                        className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'self-end rounded-br-sm bg-[#087f8c]'
                            : 'self-start rounded-bl-sm border border-slate-100 bg-white'
                        }`}
                      >
                        <MarkdownMessage
                          content={message.content}
                          user={message.role === 'user'}
                        />
                      </View>
                    )) : (
                      <View className="flex-1 items-center justify-center">
                        <Text className="text-center text-sm leading-6 text-slate-400">
                          {welcomeMessage.content}
                        </Text>
                      </View>
                    )}
                    
                    {/* Hiển thị lỗi ở cuối đoạn chat */}
                    {error ? <Text className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</Text> : null}

                    {/* Hiển thị hiệu ứng khi AI đang xử lý câu hỏi */}
                    {sending && (
                      <View className="self-start rounded-2xl rounded-bl-sm border border-slate-100 bg-white px-4 py-3">
                        <TypingIndicator />
                      </View>
                    )}
                  </ScrollView>
                  <View className="shrink-0 flex-row items-end gap-2 border-t border-slate-200 bg-white p-3">
                    <TextInput className="max-h-24 min-h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" value={input} onChangeText={setInput} placeholder="Hỏi về sản phẩm..." placeholderTextColor="#94a3b8" multiline editable={!sending} />
                    <Pressable className={`h-11 w-11 items-center justify-center rounded-xl bg-[#168b87] ${sending ? 'opacity-50' : ''}`} onPress={() => void sendMessage()} disabled={sending}><Text className="text-lg text-white">➤</Text></Pressable>
                  </View>
                </>
              )}

              {menuOpen ? (
                <View className="absolute inset-0 z-20 flex-row">
                  {/* Lớp nền tối */}
                  <Animated.View
                    className="absolute inset-0 bg-black/30"
                    style={{ opacity: sidebarOverlayOpacity }}
                  />

                  {/* Nhấn bên ngoài để đóng */}
                  <Pressable
                    className="absolute inset-0"
                    onPress={closeSidebar}
                  />

                  {/* Slide menu */}
                  <Animated.View
                    className="h-full w-[82%] bg-white px-4 pb-6 pt-12 shadow-2xl"
                    style={{
                      transform: [{ translateX: sidebarTranslateX }],
                    }}
                  >
                    <View className="mb-5">
                      <Text className="text-lg font-bold text-slate-800">
                        Lịch sử hội thoại
                      </Text>
                    </View>

                    <Pressable
                      className="mb-4 rounded-xl bg-[#168b87] px-4 py-3"
                      onPress={() => {
                        closeSidebar();
                        void createConversation();
                      }}
                    >
                      <Text className="font-bold text-white">
                        + Cuộc trò chuyện mới
                      </Text>
                    </Pressable>

                    <ScrollView showsVerticalScrollIndicator={false}>
                      {conversations.map((conversation) => (
                        <View
                          key={conversation.id}
                          ref={(ref) => {
                            conversationRefs.current[conversation.id] = ref;
                          }}
                        >
                          <Pressable
                            className={`mb-2 rounded-xl px-3 py-3 ${
                              conversation.id === activeId
                                ? 'bg-[#dff1f2]'
                                : 'bg-slate-50'
                            }`}
                            onPress={() => {
                              setActiveId(conversation.id);
                              closeSidebar();
                            }}
                            onLongPress={() => openConversationActions(conversation)}
                          >
                            <Text
                              className={`font-semibold ${
                                conversation.id === activeId
                                  ? 'text-[#087f8c]'
                                  : 'text-slate-700'
                              }`}
                              numberOfLines={2}
                            >
                              {conversation.title}
                            </Text>

                            <Text className="mt-1 text-xs text-slate-400">
                              Giữ để xem tùy chọn
                            </Text>
                          </Pressable>
                        </View>
                      ))}
                    </ScrollView>
                  </Animated.View>
                </View>
              ) : null}

              {conversationAction && actionConversationId ? (
                <View className="absolute inset-0 z-30 items-center justify-center bg-black/40 px-6">
                  {conversationAction === 'menu' ? (
                    // Menu lựa chọn thao tác
                    <View className="absolute inset-0 z-30">
                      {/* Nhấn bên ngoài để đóng menu */}
                      <Pressable
                        className="absolute inset-0"
                        onPress={() => setConversationAction(null)}
                      />

                      {/* Menu thao tác */}
                      <Animated.View
                        className="absolute overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl"
                        style={{
                          top: menuPosition.top,
                          left: menuPosition.left,
                          width: 180,
                          elevation: 12,
                          opacity: actionMenuOpacity,
                          transform: [{ scale: actionMenuScale }],
                        }}
                      >
                        <Pressable
                          className="flex-row items-center gap-3 px-4 py-3.5 active:bg-slate-100"
                          onPress={() => setConversationAction('rename')}
                        >
                          <Text className="text-lg text-slate-500">✎</Text>
                          <Text className="text-sm font-medium text-slate-700">
                            Đổi tên
                          </Text>
                        </Pressable>

                        <View className="h-px bg-slate-100" />

                        <Pressable
                          className="flex-row items-center gap-3 px-4 py-3.5 active:bg-red-50"
                          onPress={() => setConversationAction('delete')}
                        >
                          <Text className="text-lg text-red-500">⌫</Text>
                          <Text className="text-sm font-medium text-red-600">
                            Xóa
                          </Text>
                        </Pressable>
                      </Animated.View>
                    </View>
                  ) : conversationAction === 'rename' ? (
                    // Popup đổi tên
                    <View className="w-full rounded-2xl bg-white p-5">
                      <Text className="text-lg font-bold text-slate-800">
                        Đổi tên cuộc trò chuyện
                      </Text>

                      <TextInput
                        className="mt-4 rounded-xl border border-slate-200 px-3 py-3 text-slate-700"
                        value={renameTitle}
                        onChangeText={setRenameTitle}
                        placeholder="Tên hội thoại"
                        autoFocus
                      />

                      <View className="mt-4 flex-row justify-end gap-2">
                        <Pressable
                          className="rounded-lg px-3 py-2"
                          onPress={() => setConversationAction(null)}
                        >
                          <Text className="text-slate-500">Hủy</Text>
                        </Pressable>

                        <Pressable
                          className="rounded-lg bg-[#168b87] px-3 py-2"
                          onPress={() => void renameConversation()}
                        >
                          <Text className="font-bold text-white">Lưu</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    // Popup xác nhận xóa
                    <View className="w-full rounded-2xl bg-white p-5">
                      <Text className="text-lg font-bold text-slate-800">
                        Xóa cuộc trò chuyện?
                      </Text>

                      <Text className="mt-3 text-sm leading-6 text-slate-600">
                        Bạn có chắc muốn xóa cuộc trò chuyện này không? Hành động này
                        không thể hoàn tác.
                      </Text>

                      <View className="mt-4 flex-row justify-end gap-2">
                        <Pressable
                          className="rounded-lg px-3 py-2"
                          onPress={() => setConversationAction(null)}
                        >
                          <Text className="text-slate-500">Hủy</Text>
                        </Pressable>

                        <Pressable
                          className="rounded-lg bg-red-600 px-3 py-2"
                          onPress={() => {
                            setConversationAction(null);
                            void deleteConversation(actionConversationId);
                          }}
                        >
                          <Text className="font-bold text-white">Xóa</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </SafeChatArea>
      </Modal>
    </>
  );
}

function SafeChatArea({ children }: { children: React.ReactNode }) {
  return <SafeAreaView className="flex-1 bg-[#f7fafb]" edges={['top', 'bottom']}>{children}</SafeAreaView>;
}
