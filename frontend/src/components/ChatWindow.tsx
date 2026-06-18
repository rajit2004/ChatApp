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
import IconButton from "./ui/IconButton";
import { XIcon } from "./ui/Icons";
import { SectionLoader } from "./ui/Loader";

interface FileData {
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

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
  const [replyTo, setReplyTo] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    msgId: string;
    isMine: boolean;
  } | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isGroup = receiver?.isGroup === true;

  const {
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
  } = useChatInit(receiver);

  const {
    selectedFile,
    filePreview,
    uploading,
    fileInputRef,
    handleFileSelect,
    clearSelectedFile,
    uploadFile,
  } = useFileUpload();

  useState(() => {
    const handleClick = () => {
      setContextMenu(null);
      setHeaderMenu(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  });

  const handleTyping = () => {
    if (!user || !conversationId) return;
    socket.emit("typing", { conversationId, senderId: user._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => handleStopTyping(), 2000);
  };

  const handleStopTyping = () => {
    if (!user || !conversationId) return;
    socket.emit("stop_typing", { conversationId, senderId: user._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const sendMessage = async () => {
    if (!message.trim() && !selectedFile) return;
    if (!user || !conversationId) return;

    handleStopTyping();

    try {
      const fileData = (await uploadFile()) as FileData;

      const tempMessage = {
        _id: `temp_${Date.now()}`,
        conversationId,
        sender: { _id: user._id, username: user.username, profilePic: user.profilePic },
        text: message,
        fileUrl: fileData?.fileUrl || null,
        fileName: fileData?.fileName || null,
        fileType: fileData?.fileType || null,
        createdAt: new Date().toISOString(),
        replyTo: replyTo
          ? {
              _id: replyTo._id,
              text: replyTo.text,
              fileType: replyTo.fileType,
              sender: replyTo.sender,
            }
          : null,
      };

      setMessages((prev) => [...prev, tempMessage]);
      setMessage("");
      clearSelectedFile();

      const textarea = document.querySelector("textarea");
      if (textarea) {
        textarea.style.height = "auto";
      }

      socket.emit("send_message", {
        conversationId,
        text: message,
        senderId: user._id,
        receiverId: isGroup ? null : receiver._id,
        replyTo: replyTo?._id || null,
        ...fileData,
      });

      setReplyTo(null);
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
    const menuHeight = isMine ? 100 : 80;
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    if (x + menuWidth > rect.width) x = rect.width - menuWidth - 8;
    if (y + menuHeight > rect.height) y = y - menuHeight;
    setContextMenu({ visible: true, x, y, msgId, isMine });
  };

  const getReplyPreview = (reply: any) => {
    if (reply.text) return reply.text;
    if (reply.fileType === "image") return "Photo";
    return "File";
  };

  return (
    <div ref={chatContainerRef} className="h-full flex flex-col bg-app relative">
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
        onCopy={(text) => {
          navigator.clipboard.writeText(text);
          toast.success("Copied");
        }}
        onDelete={deleteMessage}
        onReply={(msg) => setReplyTo(msg)}
        onClose={() => setContextMenu(null)}
      />

      {initialLoading ? (
        <SectionLoader message="Loading conversation..." />
      ) : (
        <MessageList
          messages={messages}
          user={user}
          isGroup={isGroup}
          onRightClick={handleRightClick}
          hasMore={hasMore}
          loadMoreMessages={loadMoreMessages}
          loadingMore={loadingMore}
        />
      )}

      {isReceiverTyping && !isGroup && (
        <div className="px-4 py-1.5 flex items-center gap-2">
          <div className="flex gap-1 items-center">
            <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
          <p className="text-xs text-muted">{receiver.username} is typing</p>
        </div>
      )}

      {replyTo && (
        <div className="px-4 py-2.5 bg-elevated border-t border-border flex items-center gap-3">
          <div className="flex-1 border-l-2 border-accent pl-3 min-w-0">
            <p className="text-xs text-accent font-medium">
              {replyTo.sender?.username || "Unknown"}
            </p>
            <p className="text-xs text-muted truncate">{getReplyPreview(replyTo)}</p>
          </div>
          <IconButton label="Cancel reply" onClick={() => setReplyTo(null)}>
            <XIcon className="w-4 h-4" />
          </IconButton>
        </div>
      )}

      {!initialLoading && (
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
          rateLimitSeconds={rateLimitSeconds}
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
        />
      )}
    </div>
  );
}
