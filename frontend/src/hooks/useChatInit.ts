import { useEffect, useState } from "react";
import { socket } from "../socket";
import { api } from "../services/api";

export function useChatInit(receiver: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [receiverStatus, setReceiverStatus] = useState<{ lastSeen: Date | null } | null>(null);

  const isGroup = receiver?.isGroup === true;

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get("/auth/me");
        const currentUser = res.data.user;
        setUser(currentUser);

        let convId: string;

        if (isGroup) {
          convId = receiver.conversationId;
          setConversationId(convId);
          setReceiverStatus(null);
        } else {
          const convRes = await api.post("/conversations", { receiverId: receiver._id });
          convId = convRes.data.conversation._id;
          setConversationId(convId);
          const statusRes = await api.get(`/users/${receiver._id}/status`);
          setReceiverStatus(statusRes.data);
        }

        const msgRes = await api.get(`/conversations/${convId}/messages`);
        setMessages(msgRes.data.messages);

        const joinRoom = () => {
          socket.emit("register_user", currentUser._id);
          socket.emit("join_conversation", convId);
        };

        if (socket.connected) joinRoom();
        else { socket.connect(); socket.once("connect", joinRoom); }

        socket.on("connect", () => socket.emit("register_user", currentUser._id));

        socket.off("receive_message");
        socket.on("receive_message", (data) => {
          setMessages((prev) => [...prev, data]);
        });

        socket.off("message_deleted");
        socket.on("message_deleted", ({ messageId }) => {
          setMessages((prev) => prev.filter((m) => m._id !== messageId));
        });

        socket.off("chat_cleared");
        socket.on("chat_cleared", ({ conversationId: clearedId }) => {
          if (clearedId === convId) setMessages([]);
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
      }
    };

    init();

    return () => {
      socket.off("receive_message");
      socket.off("connect");
      socket.off("user_status_change");
      socket.off("message_deleted");
      socket.off("chat_cleared");
    };
  }, [isGroup ? receiver.conversationId : receiver._id]);

  return { messages, setMessages, user, conversationId, receiverStatus };
}