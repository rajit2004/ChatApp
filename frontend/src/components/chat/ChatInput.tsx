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
}) {
  return (
    <div className="border-t border-[#2a3942] flex-shrink-0">

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
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2a3942] text-[#8696a0] hover:text-white hover:bg-[#3a4952] transition flex-shrink-0 text-lg"
        >
          <i className="fa-regular fa-file"></i>
        </button>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
          className="flex-1 p-2 md:p-3 bg-[#2a3942] rounded-lg text-white outline-none placeholder-[#8696a0] text-sm"
          placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
        />
        <button
          onClick={onSend}
          disabled={uploading || (!message.trim() && !selectedFile)}
          className="bg-[#00a884] px-3 md:px-4 py-2 rounded-lg text-white font-medium hover:bg-[#009070] transition text-sm disabled:opacity-50 flex-shrink-0"
        >
          {uploading ? "⏳" : "Send"}
        </button>
      </div>
    </div>
  );
}