import { useEffect, useState } from "react";
import { socket } from "../socket";
import { api } from "../services/api";

export default function ChatWindow({ receiver }: { receiver: any }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [receiverStatus, setReceiverStatus] = useState<{ lastSeen: Date | null } | null>(null);

  const isGroup = receiver?.isGroup === true;

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Get logged in user
        const res = await api.get("/auth/me");
        const currentUser = res.data.user;
        setUser(currentUser);

        let convId: string;

        if (isGroup) {
          
          convId = receiver.conversationId;
          setConversationId(convId);
          setReceiverStatus(null); 
        } else {
          // private — get or create conversation
          const convRes = await api.post("/conversations", {
            receiverId: receiver._id,
          });
          convId = convRes.data.conversation._id;
          setConversationId(convId);

          // fetch receiver's status
          const statusRes = await api.get(`/users/${receiver._id}/status`);
          setReceiverStatus(statusRes.data);
        }

        // 2. Load message history
        const msgRes = await api.get(`/conversations/${convId}/messages`);
        setMessages(msgRes.data.messages);

        // 3. Connect socket and join room
        const joinRoom = () => {
          socket.emit("register_user", currentUser._id);
          socket.emit("join_conversation", convId);
        };

        if (socket.connected) {
          joinRoom();
        } else {
          socket.connect();
          socket.once("connect", joinRoom);
        }

        socket.on("connect", () => {
          socket.emit("register_user", currentUser._id);
        });

        // 4. Listen for new messages
        socket.off("receive_message");
        socket.on("receive_message", (data) => {
          setMessages((prev) => [...prev, data]);
        });

        // 5. Listen for status changes (private only)
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
    };
  }, [receiver?.isGroup ? receiver.conversationId : receiver._id]);

  const sendMessage = () => {
    if (!message.trim() || !user || !conversationId) return;

    socket.emit("send_message", {
      conversationId,
      text: message,
      senderId: user._id,
      receiverId: isGroup ? null : receiver._id,
    });

    setMessage("");
  };

  return (
    <div className="h-full flex flex-col bg-[#111b21] text-white">

      {/* Header */}
      <div className="p-4 border-b border-[#2a3942] flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center font-bold uppercase">
            {isGroup ? receiver.groupName[0] : receiver.username[0]}
          </div>
          {/* online dot — private only */}
          {!isGroup && receiverStatus?.lastSeen === null && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#111b21]" />
          )}
        </div>
        <div>
          <p className="font-medium">
            {isGroup ? receiver.groupName : receiver.username}
          </p>
          <p className="text-xs text-[#8696a0]">
            {isGroup
              ? `${receiver.participants?.length} members`
              : receiverStatus?.lastSeen === null
              ? "online"
              : receiverStatus?.lastSeen
              ? `last seen ${new Date(receiverStatus.lastSeen).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => {
          const senderId = msg.sender?._id || msg.sender;
          const isMine = senderId?.toString() === user?._id?.toString();

          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  maxWidth: "70%",
                  backgroundColor: isMine ? "#005c4b" : "#202c33",
                  color: "white",
                }}
              >
                {/* show sender name in group chats */}
                {isGroup && !isMine && (
                  <p style={{ fontSize: "11px", color: "#00a884", marginBottom: "2px" }}>
                    {msg.sender?.username || ""}
                  </p>
                )}
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 flex gap-2 border-t border-[#2a3942]">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 p-2 bg-[#2a3942] rounded text-white outline-none"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-[#00a884] px-4 rounded"
        >
          Send
        </button>
      </div>

    </div>
  );
}