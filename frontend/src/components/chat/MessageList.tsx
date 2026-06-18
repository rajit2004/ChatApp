import { useRef, useEffect } from "react";
import FileMessage from "../FileMessage";
import Loader from "../ui/Loader";

function getReplyPreview(replyTo: any): string | null {
  if (!replyTo) return null;
  if (replyTo.fileType === "image") return "Photo";
  if (replyTo.fileType === "pdf") return "PDF";
  if (replyTo.fileType === "word") return "Document";
  if (replyTo.text) {
    return replyTo.text.length > 60 ? replyTo.text.slice(0, 60) + "..." : replyTo.text;
  }
  return "File";
}

export default function MessageList({
  messages,
  user,
  isGroup,
  onRightClick,
  hasMore,
  loadMoreMessages,
  loadingMore,
}: {
  messages: any[];
  user: any;
  isGroup: boolean;
  onRightClick: (e: React.MouseEvent, msgId: string, isMine: boolean) => void;
  hasMore: boolean;
  loadMoreMessages: () => void;
  loadingMore: boolean;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef<number>(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length === 0 || messages[messages.length - 1]?._id]);

  useEffect(() => {
    if (containerRef.current && prevScrollHeight.current) {
      const newScrollHeight = containerRef.current.scrollHeight;
      containerRef.current.scrollTop = newScrollHeight - prevScrollHeight.current;
      prevScrollHeight.current = 0;
    }
  }, [messages]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    if (containerRef.current.scrollTop === 0 && hasMore && !loadingMore) {
      prevScrollHeight.current = containerRef.current.scrollHeight;
      loadMoreMessages();
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto scroll-container px-4 py-4 space-y-2"
    >
      {loadingMore && (
        <div className="flex justify-center py-2">
          <Loader size="sm" message="Loading older messages..." />
        </div>
      )}

      {!hasMore && messages.length > 0 && (
        <p className="text-center text-muted text-xs py-2">Beginning of conversation</p>
      )}

      {messages.length === 0 && (
        <p className="text-center text-muted text-sm mt-16">
          No messages yet. Say hello!
        </p>
      )}

      {messages.map((msg, i) => {
        const senderId = msg.sender?._id || msg.sender;
        const isMine = senderId?.toString() === user?._id?.toString();
        const hasFile = !!msg.fileUrl;
        const isImageMsg = msg.fileType === "image";
        const replyPreview = getReplyPreview(msg.replyTo);

        return (
          <div
            key={msg._id || i}
            onContextMenu={(e) => onRightClick(e, msg._id, isMine)}
            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={[
                "max-w-[75%] rounded-lg cursor-context-menu break-words",
                isMine ? "bg-bubble-sent text-bubble-sent-text" : "bg-bubble-received text-text border border-border shadow-sm",
                hasFile && isImageMsg ? "p-1" : "px-3 py-2",
              ].join(" ")}
            >
              {isGroup && !isMine && (
                <p className={`text-xs text-accent font-medium mb-1 ${hasFile ? "px-2 pt-1" : ""}`}>
                  {msg.sender?.username || ""}
                </p>
              )}

              {replyPreview && (
                <div
                  className={[
                    "border-l-2 border-accent rounded-md px-2.5 py-1.5 mb-2 mx-0.5",
                    isMine ? "bg-black/15" : "bg-bubble-reply",
                  ].join(" ")}
                >
                  <p className={`text-xs font-medium ${isMine ? "text-bubble-sent-text/90" : "text-accent"}`}>
                    {msg.replyTo?.sender?.username || "Unknown"}
                  </p>
                  <p className={`text-xs truncate ${isMine ? "text-bubble-sent-text/70" : "text-muted"}`}>
                    {replyPreview}
                  </p>
                </div>
              )}

              {hasFile ? (
                <FileMessage msg={msg} />
              ) : (
                <p className="text-sm leading-relaxed">{msg.text}</p>
              )}

              <p
                className={`text-[10px] text-right mt-1 ${
                  isMine ? "text-bubble-sent-text/60" : "text-muted"
                } ${hasFile && isImageMsg ? "px-1 pb-0.5" : ""}`}
              >
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
