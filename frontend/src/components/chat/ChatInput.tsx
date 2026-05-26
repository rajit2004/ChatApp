import { useState, useRef, useEffect } from "react";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";

export default function ChatInput({
  message,
  setMessage,
  selectedFile,
  filePreview,
  uploading,
  fileInputRef,
  onSend,
  onFileSelect,
  onClearFile,
  rateLimitSeconds,
  onTyping,
  onStopTyping,
}: {
  message: string;
  setMessage: (v: string) => void;
  selectedFile: File | null;
  filePreview: string | null;
  uploading: boolean;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  onSend: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  rateLimitSeconds: number;
  onTyping: () => void;
  onStopTyping: () => void;
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const isRateLimited = rateLimitSeconds > 0;

  // ✅ Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(message + emojiData.emoji);
    onTyping();
  };

  return (
    <div className="border-t border-[#2a3942] flex-shrink-0 relative">

      {/* ✅ Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-16 left-2 z-50"
        >
          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={handleEmojiClick}
            width={300}
            height={400}
            searchDisabled={false}
            skinTonesDisabled
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      {/* File preview bar */}
      {selectedFile && (
        <div className="px-4 py-2 bg-[#202c33] flex items-center gap-3 border-b border-[#2a3942]">
          {filePreview ? (
            <img src={filePreview} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-[#2a3942] flex items-center justify-center text-2xl flex-shrink-0">
              📎
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm truncate">{selectedFile.name}</p>
            <p className="text-[#8696a0] text-xs">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={onClearFile}
            className="text-[#8696a0] hover:text-white text-lg flex-shrink-0 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="p-2 md:p-4 flex gap-2 items-center">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onFileSelect}
        />

        {/* File button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2a3942] text-[#8696a0] hover:text-white hover:bg-[#3a4952] transition flex-shrink-0 text-lg"
        >
          <i className="fa-regular fa-file"></i>
        </button>

        {/* ✅ Emoji button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2a3942] text-[#8696a0] hover:text-white hover:bg-[#3a4952] transition flex-shrink-0 text-lg"
        >
          😊
        </button>

        <input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (e.target.value) onTyping();
            else onStopTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isRateLimited) {
              onStopTyping();
              setShowEmojiPicker(false);
              onSend();
            }
          }}
          className="flex-1 p-2 md:p-3 bg-[#2a3942] rounded-lg text-white outline-none placeholder-[#8696a0] text-sm"
          placeholder={
            isRateLimited
              ? `Wait ${rateLimitSeconds}s...`
              : selectedFile
              ? "Add a caption..."
              : "Type a message..."
          }
        />

        <button
          onClick={() => {
            onStopTyping();
            setShowEmojiPicker(false);
            onSend();
          }}
          disabled={uploading || (!message.trim() && !selectedFile) || isRateLimited}
          className="bg-[#00a884] px-3 md:px-4 py-2 rounded-lg text-white font-medium hover:bg-[#009070] transition text-sm disabled:opacity-50 flex-shrink-0 min-w-[60px] text-center"
        >
          {uploading ? "⏳" : isRateLimited ? `${rateLimitSeconds}s` : "Send"}
        </button>
      </div>
    </div>
  );
}