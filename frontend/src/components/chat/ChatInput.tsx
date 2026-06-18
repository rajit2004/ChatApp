import { useState, useRef, useEffect } from "react";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import Spinner from "../ui/Spinner";
import { PaperclipIcon, SmileIcon, XIcon } from "../ui/Icons";
import { useTheme } from "../../context/ThemeContext";

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
  const { theme } = useTheme();

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

  const handleSend = () => {
    onStopTyping();
    setShowEmojiPicker(false);
    onSend();
  };

  return (
    <div className="border-t border-border flex-shrink-0 relative bg-surface">
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full left-2 mb-2 z-50 rounded-xl overflow-hidden border border-border shadow-2xl"
        >
          <EmojiPicker
            theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
            onEmojiClick={handleEmojiClick}
            width={320}
            height={360}
            searchDisabled={false}
            skinTonesDisabled
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      {selectedFile && (
        <div className="px-4 py-2.5 bg-elevated flex items-center gap-3 border-b border-border">
          {filePreview ? (
            <img
              src={filePreview}
              className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
              alt="Preview"
            />
          ) : (
            <div className="w-11 h-11 rounded-lg bg-input flex items-center justify-center flex-shrink-0">
              <PaperclipIcon className="w-5 h-5 text-muted" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{selectedFile.name}</p>
            <p className="text-muted text-xs">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <IconButton label="Remove file" onClick={onClearFile}>
            <XIcon className="w-4 h-4" />
          </IconButton>
        </div>
      )}

      <div className="p-3 flex gap-2 items-end">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onFileSelect}
        />

        <IconButton
          label="Attach file"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0"
        >
          <PaperclipIcon className="w-5 h-5" />
        </IconButton>

        <div className="flex-1 flex items-end bg-input rounded-lg px-3 gap-2 border border-border focus-within:border-accent/50 transition-colors">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (e.target.value) onTyping();
              else onStopTyping();

              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isRateLimited) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            className="flex-1 py-2.5 bg-transparent text-sm outline-none placeholder:text-muted resize-none overflow-hidden"
            placeholder={
              isRateLimited
                ? `Wait ${rateLimitSeconds}s...`
                : selectedFile
                  ? "Add a caption..."
                  : "Type a message..."
            }
            style={{ maxHeight: "120px" }}
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEmojiPicker(!showEmojiPicker);
            }}
            className="text-muted hover:text-text transition-colors flex-shrink-0 pb-2.5"
            aria-label="Emoji picker"
          >
            <SmileIcon className="w-5 h-5" />
          </button>
        </div>

        <Button
          onClick={handleSend}
          disabled={uploading || (!message.trim() && !selectedFile) || isRateLimited}
          className="flex-shrink-0 min-w-[72px] flex items-center justify-center"
        >
          {uploading ? (
            <Spinner className="w-4 h-4" />
          ) : isRateLimited ? (
            `${rateLimitSeconds}s`
          ) : (
            "Send"
          )}
        </Button>
      </div>
    </div>
  );
}
