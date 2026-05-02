import { useRef, useState } from "react";
import { socket } from "../socket";
import { api } from "../services/api";
import { toast } from "react-toastify";
import { useChatInit } from "../hooks/useChatInit";
import { useFileUpload } from "../hooks/useFileUpload";
import ChatHeader from "./chat/ChatHeader";
import ClearConfirm from "./chat/ClearConfirm";
import MessageContextMenu from "./chat/MessageContextMenu";
import MessageList from "./chat/MessageList";
import ChatInput from "./chat/ChatInput";

export default function ChatWindow({
  receiver,
  onClose,
}: {
  receiver: any;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [headerMenu, setHeaderMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    msgId: string;
    isMine: boolean;
  } | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isGroup = receiver?.isGroup === true;

  // ── Custom hooks ──
  const { messages, setMessages, user, conversationId, receiverStatus } =
    useChatInit(receiver);

  const {
    selectedFile,
    filePreview,
    uploading,
    fileInputRef,
    handleFileSelect,
    clearSelectedFile,
    uploadFile,
  } = useFileUpload();

  // close menus on click anywhere
  useState(() => {
    const handleClick = () => {
      setContextMenu(null);
      setHeaderMenu(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  });

  const sendMessage = async () => {
    if (!message.trim() && !selectedFile) return;
    if (!user || !conversationId) return;

    try {
      const fileData = await uploadFile();

      socket.emit("send_message", {
        conversationId,
        text: message,
        senderId: user._id,
        receiverId: isGroup ? null : receiver._id,
        ...fileData,
      });

      setMessage("");
      clearSelectedFile();
    } catch {
      toast.error("Failed to send file");
    }
  };

  const deleteMessage = async (msgId: string) => {
    setContextMenu(null);
    try {
      await api.delete(`/messages/${msgId}`);
      socket.emit("delete_message", { messageId: msgId, conversationId });
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Could not delete message");
    }
  };

  const clearChat = async () => {
    if (!conversationId) return;
    try {
      await api.delete(`/messages/clear/${conversationId}`);
      socket.emit("clear_chat", { conversationId });
      setMessages([]);
      setShowClearConfirm(false);
      toast.success("Chat cleared");
    } catch {
      toast.error("Could not clear chat");
    }
  };

  const handleRightClick = (e: React.MouseEvent, msgId: string, isMine: boolean) => {
    e.preventDefault();
    const container = chatContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const menuWidth = 150;
    const menuHeight = isMine ? 80 : 40;
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    if (x + menuWidth > rect.width) x = rect.width - menuWidth - 8;
    if (y + menuHeight > rect.height) y = y - menuHeight;

    setContextMenu({ visible: true, x, y, msgId, isMine });
  };

  return (
    <div ref={chatContainerRef} className="h-full flex flex-col bg-[#111b21] text-white relative">

      <ChatHeader
        receiver={receiver}
        receiverStatus={receiverStatus}
        onClose={onClose}
        onClearClick={() => setShowClearConfirm(true)}
        headerMenu={headerMenu}
        setHeaderMenu={setHeaderMenu}
      />

      {showClearConfirm && (
        <ClearConfirm
          onConfirm={clearChat}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

      <MessageContextMenu
        contextMenu={contextMenu?.visible ? contextMenu : null}
        messages={messages}
        onCopy={(text) => { navigator.clipboard.writeText(text); toast.success("Copied!"); }}
        onDelete={deleteMessage}
        onClose={() => setContextMenu(null)}
      />

      <MessageList
        messages={messages}
        user={user}
        isGroup={isGroup}
        onRightClick={handleRightClick}
      />

      <ChatInput
        message={message}
        setMessage={setMessage}
        selectedFile={selectedFile}
        filePreview={filePreview}
        uploading={uploading}
        fileInputRef={fileInputRef}
        onSend={sendMessage}
        onFileSelect={handleFileSelect}
        onClearFile={clearSelectedFile}
      />

    </div>
  );
}