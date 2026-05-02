import { useRef, useEffect } from "react";
import FileMessage from "../FileMessage";

export default function MessageList({
  messages,
  user,
  isGroup,
  onRightClick,
}: {
  messages: any[];
  user: any;
  isGroup: boolean;
  onRightClick: (e: React.MouseEvent, msgId: string, isMine: boolean) => void;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-4">
      {messages.length === 0 && (
        <p className="text-center text-[#8696a0] text-sm mt-10">
          No messages yet. Say hello! 👋
        </p>
      )}
      {messages.map((msg, i) => {
        const senderId = msg.sender?._id || msg.sender;
        const isMine = senderId?.toString() === user?._id?.toString();
        const hasFile = !!msg.fileUrl;
        const isImageMsg = msg.fileType === "image";

        return (
          <div
            key={msg._id || i}
            onContextMenu={(e) => onRightClick(e, msg._id, isMine)}
            style={{
              display: "flex",
              justifyContent: isMine ? "flex-end" : "flex-start",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                padding: hasFile && isImageMsg ? "4px" : "8px 12px",
                borderRadius: "8px",
                maxWidth: "75%",
                backgroundColor: isMine ? "#005c4b" : "#202c33",
                color: "white",
                cursor: "context-menu",
                wordBreak: "break-word",
              }}
            >
              {isGroup && !isMine && (
                <p style={{
                  fontSize: "11px",
                  color: "#00a884",
                  marginBottom: "2px",
                  padding: hasFile ? "4px 8px 0" : "0",
                }}>
                  {msg.sender?.username || ""}
                </p>
              )}

              {hasFile ? (
                <FileMessage msg={msg} />
              ) : (
                <p style={{ fontSize: "14px" }}>{msg.text}</p>
              )}

              <p style={{
                fontSize: "10px",
                color: "#8696a0",
                textAlign: "right",
                marginTop: "2px",
                padding: hasFile && isImageMsg ? "0 4px 4px" : "0",
              }}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}