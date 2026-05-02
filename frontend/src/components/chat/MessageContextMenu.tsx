export default function MessageContextMenu({
  contextMenu,
  messages,
  onCopy,
  onDelete,
  onClose,
}: {
  contextMenu: { x: number; y: number; msgId: string; isMine: boolean } | null;
  messages: any[];
  onCopy: (text: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  if (!contextMenu) return null;

  return (
    <div
      className="absolute z-50 bg-[#233138] rounded-lg shadow-xl overflow-hidden"
      style={{
        top: contextMenu.y,
        left: contextMenu.x,
        width: "150px",
        border: "1px solid #2a3942",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2a3942] flex items-center gap-2"
        onClick={() => {
          const msg = messages.find((m) => m._id === contextMenu.msgId);
          if (msg?.text) onCopy(msg.text);
          onClose();
        }}
      >
         Copy
      </button>
      {contextMenu.isMine && (
        <button
          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#2a3942] flex items-center gap-2"
          onClick={() => onDelete(contextMenu.msgId)}
        >
           Delete
        </button>
      )}
    </div>
  );
}