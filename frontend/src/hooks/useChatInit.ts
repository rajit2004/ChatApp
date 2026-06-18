import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { api, skipGlobalLoader } from "../services/api";
import { useNotificationSound } from "./useNotificationSound";
import { toast } from "react-toastify";

export function useChatInit(receiver: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [receiverStatus, setReceiverStatus] = useState<{
    lastSeen: Date | null;
  } | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number>(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isReceiverTyping, setIsReceiverTyping] = useState(false);

  const rateLimitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const convIdRef = useRef<string | null>(null);
  const userRef = useRef<any>(null);
  const cachedUserRef = useRef<any>(null); // ✅ cache user across chat switches
  const pageRef = useRef(1);

  const { playNotification } = useNotificationSound();
  const isGroup = receiver?.isGroup === true;

  const loadMoreMessages = async () => {
    const convId = convIdRef.current;
    if (!convId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const res = await api.get(`/conversations/${convId}/messages?page=${nextPage}`);
      setMessages(prev => [...res.data.messages, ...prev]);
      setHasMore(res.data.hasMore);
      pageRef.current = nextPage;
    } catch (err) {
      console.log("Failed to load more:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // ✅ Clear immediately on chat switch — no stale UI
    setMessages([]);
    setHasMore(false);
    setIsReceiverTyping(false);
    setReceiverStatus(null);
    setInitialLoading(true);
    pageRef.current = 1;

    const init = async () => {
      try {
        let currentUser = cachedUserRef.current;
        if (!currentUser) {
          const res = await api.get("/auth/me", skipGlobalLoader());
          currentUser = res.data.user;
          cachedUserRef.current = currentUser;
        }
        setUser(currentUser);
        userRef.current = currentUser;

        let convId: string;

        if (isGroup) {
          convId = receiver.conversationId;
          setConversationId(convId);
          convIdRef.current = convId;
        } else {
          const [convRes, statusRes] = await Promise.all([
            api.post("/conversations", { receiverId: receiver._id }, skipGlobalLoader()),
            api.get(`/users/${receiver._id}/status`, skipGlobalLoader()),
          ]);
          convId = convRes.data.conversation._id;
          setConversationId(convId);
          convIdRef.current = convId;
          setReceiverStatus(statusRes.data);
        }

        // ✅ Fetch first page
        const msgRes = await api.get(
          `/conversations/${convId}/messages?page=1`,
          skipGlobalLoader()
        );
        setMessages(msgRes.data.messages);
        setHasMore(msgRes.data.hasMore);
        pageRef.current = 1;

        const joinRoom = () => {
          socket.emit("register_user", currentUser._id);
          socket.emit("join_conversation", convId);
        };

        if (socket.connected) joinRoom();
        else {
          socket.connect();
          socket.once("connect", joinRoom);
        }

        socket.on("connect", () =>
          socket.emit("register_user", currentUser._id)
        );

        socket.off("receive_message");
        socket.on("receive_message", (data) => {
          setMessages((prev) => {
            const filtered = prev.filter(m =>
              !(m._id.startsWith('temp_') && m.sender._id === data.sender._id)
            );
            const exists = filtered.some(m => m._id === data._id);
            if (exists) return filtered;
            return [...filtered, data];
          });

          const isOwnMessage = data.sender._id === userRef.current._id;
          const isActiveConversation = data.conversationId === convIdRef.current;
          const windowUnfocused = !window.document.hasFocus();
          if (!isOwnMessage && (!isActiveConversation || windowUnfocused)) {
            playNotification();
          }
        });

        socket.off("message_deleted");
        socket.on("message_deleted", ({ messageId }) => {
          setMessages((prev) => prev.filter((m) => m._id !== messageId));
        });

        socket.off("chat_cleared");
        socket.on("chat_cleared", ({ conversationId: clearedId }) => {
          if (clearedId === convId) setMessages([]);
        });

        socket.off("user_typing");
        socket.on("user_typing", ({ senderId }) => {
          if (senderId === receiver._id) {
            setIsReceiverTyping(true);
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => {
              setIsReceiverTyping(false);
            }, 3000);
          }
        });

        socket.off("user_stop_typing");
        socket.on("user_stop_typing", ({ senderId }) => {
          if (senderId === receiver._id) {
            setIsReceiverTyping(false);
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          }
        });

        socket.off("session_kicked");
        socket.on("session_kicked", () => {
          localStorage.removeItem("token");
          toast.error("You were logged in from another device.", {
            position: "top-center",
            theme: "dark",
            autoClose: 3000,
          });
          setTimeout(() => {
            window.location.href = "/";
          }, 3000);
        });

        socket.off("rate_limited");
        socket.on("rate_limited", (data: { message: string; ttl: number }) => {
          toast.error(`Too many messages. You can send again in ${data.ttl}s`, {
            toastId: "rate-limit",
          });

          setRateLimitSeconds(data.ttl);

          if (rateLimitTimerRef.current) clearInterval(rateLimitTimerRef.current);

          rateLimitTimerRef.current = setInterval(() => {
            setRateLimitSeconds((prev) => {
              if (prev <= 1) {
                clearInterval(rateLimitTimerRef.current!);
                rateLimitTimerRef.current = null;
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        });

        socket.off("user_status_change");
        if (!isGroup) {
          socket.on("user_status_change", (data) => {
            if (data.userId === receiver._id) {
              setReceiverStatus({ lastSeen: data.lastSeen });
            }
          });
        }

      } catch (err: any) {
        console.log("Error:", err.response?.data || err.message);
      } finally {
        setInitialLoading(false);
      }
    };

    init();

    return () => {
      socket.off("receive_message");
      socket.off("connect");
      socket.off("user_status_change");
      socket.off("message_deleted");
      socket.off("chat_cleared");
      socket.off("rate_limited");
      socket.off("session_kicked");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (rateLimitTimerRef.current) clearInterval(rateLimitTimerRef.current);
    };
  }, [isGroup ? receiver.conversationId : receiver._id]);

  return {
    messages,
    setMessages,
    user,
    conversationId,
    receiverStatus,
    rateLimitSeconds,
    isReceiverTyping,
    hasMore,
    loadMoreMessages,
    loadingMore,
    initialLoading,
  };
}