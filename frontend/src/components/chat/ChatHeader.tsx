import { formatLastSeen } from "../../../utils/formatLastSeen";

export default function ChatHeader({
  receiver,
  receiverStatus,
  onClose,
  onClearClick,
  headerMenu,
  setHeaderMenu,
}: {
  receiver: any;
  receiverStatus: any;
  onClose: () => void;
  onClearClick: () => void;
  headerMenu: boolean;
  setHeaderMenu: (v: boolean) => void;
}) {
  const isGroup = receiver?.isGroup === true;

  return (
    <>
      <div
        className="p-3 md:p-4 border-b border-[#2a3942] flex items-center justify-between flex-shrink-0"
        onContextMenu={(e) => { e.preventDefault(); setHeaderMenu(true); }}
      >
        {/* Left */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a3942] transition text-white flex-shrink-0"
          >
            ←
          </button>
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#00a884] flex items-center justify-center font-bold uppercase overflow-hidden">
              {isGroup ? (
                receiver.groupName[0]
              ) : receiver.profilePic ? (
                <img src={receiver.profilePic} className="w-full h-full object-cover" />
              ) : (
                receiver.username[0]
              )}
            </div>
            {!isGroup && receiverStatus?.lastSeen === null && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-400 rounded-full border-2 border-[#111b21]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm md:text-base truncate">
              {isGroup ? receiver.groupName : receiver.username}
            </p>
            <p className="text-xs text-[#8696a0] truncate">
              {isGroup
                ? `${receiver.participants?.length} members`
                : receiverStatus?.lastSeen === null
                ? "online"
                : receiverStatus?.lastSeen
                ? formatLastSeen(receiverStatus.lastSeen)
                : "offline"}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <button
            onClick={onClearClick}
            className="hidden sm:block text-xs px-2 md:px-3 py-1 rounded-md bg-[#2a3942] text-[#8696a0] hover:bg-red-600 hover:text-white transition-colors"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="hidden md:flex w-7 h-7 items-center justify-center rounded-md bg-[#2a3942] text-[#8696a0] hover:bg-[#3a4952] hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setHeaderMenu(!headerMenu); }}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a3942] transition text-[#8696a0]"
          >
            ⋮
          </button>
        </div>
      </div>

      {/* Header dropdown menu */}
      {headerMenu && (
        <>
          <div className="absolute inset-0 z-40" onClick={() => setHeaderMenu(false)} />
          <div
            className="absolute top-14 right-4 z-50 bg-[#233138] rounded-lg shadow-xl overflow-hidden"
            style={{ width: "160px", border: "1px solid #2a3942" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#2a3942] flex items-center gap-2"
              onClick={() => { onClearClick(); setHeaderMenu(false); }}
            >
               Clear Chat
            </button>
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-[#2a3942] flex items-center gap-2"
              onClick={() => { onClose(); setHeaderMenu(false); }}
            >
               Close Chat
            </button>
          </div>
        </>
      )}
    </>
  );
}