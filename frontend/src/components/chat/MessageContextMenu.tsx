import { ReplyIcon, CopyIcon, TrashIcon } from "../ui/Icons";

export default function MessageContextMenu({
  contextMenu,
  messages,
  onCopy,
  onDelete,
  onReply,
  onClose,
}: {
  contextMenu: { x: number; y: number; msgId: string; isMine: boolean } | null;
  messages: any[];
  onCopy: (text: string) => void;
  onDelete: (id: string) => void;
  onReply: (msg: any) => void;
  onClose: () => void;
}) {
  if (!contextMenu) return null;

  const msg = messages.find((m) => m._id === contextMenu.msgId);

  const menuItemClass =
    "w-full text-left px-3.5 py-2 text-sm hover:bg-elevated transition-colors flex items-center gap-2.5";

  return (
    <div
      className="absolute z-50 bg-menu border border-border rounded-lg shadow-xl overflow-hidden w-36"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className={menuItemClass}
        onClick={() => {
          if (msg) onReply(msg);
          onClose();
        }}
      >
        <ReplyIcon />
        Reply
      </button>

      <button
        className={menuItemClass}
        onClick={() => {
          if (msg?.text) onCopy(msg.text);
          onClose();
        }}
      >
        <CopyIcon />
        Copy
      </button>

      {contextMenu.isMine && (
        <button
          className={`${menuItemClass} text-danger`}
          onClick={() => onDelete(contextMenu.msgId)}
        >
          <TrashIcon />
          Delete
        </button>
      )}
    </div>
  );
}
