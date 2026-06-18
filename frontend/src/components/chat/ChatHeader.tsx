import { formatLastSeen } from "../../../utils/formatLastSeen";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import { ArrowLeftIcon, DotsVerticalIcon, XIcon } from "../ui/Icons";

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
  const displayName = isGroup ? receiver.groupName : receiver.username;

  return (
    <>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0 bg-surface">
        <div className="flex items-center gap-3 min-w-0">
          <IconButton
            label="Back"
            onClick={onClose}
            className="md:hidden"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </IconButton>

          <Avatar
            src={isGroup ? null : receiver.profilePic}
            name={displayName}
            size="md"
            online={!isGroup && receiverStatus?.lastSeen === null}
          />

          <div className="min-w-0">
            <p className="font-medium text-sm truncate text-text">{displayName}</p>
            <p className="text-xs text-muted truncate">
              {isGroup
                ? `${receiver.participants?.length} members`
                : receiverStatus?.lastSeen === null
                  ? <span className="text-online">Online</span>
                  : receiverStatus?.lastSeen
                    ? formatLastSeen(receiverStatus.lastSeen)
                    : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearClick}
            className="hidden sm:inline-flex"
          >
            Clear chat
          </Button>
          <IconButton
            label="Close chat"
            onClick={onClose}
            className="hidden md:flex"
          >
            <XIcon className="w-4 h-4" />
          </IconButton>
          <IconButton
            label="Menu"
            onClick={(e) => {
              e.stopPropagation();
              setHeaderMenu(!headerMenu);
            }}
            className="md:hidden"
          >
            <DotsVerticalIcon className="w-5 h-5" />
          </IconButton>
        </div>
      </div>

      {headerMenu && (
        <>
          <div className="absolute inset-0 z-40" onClick={() => setHeaderMenu(false)} />
          <div
            className="absolute top-14 right-4 z-50 bg-menu border border-border rounded-lg shadow-xl overflow-hidden w-40"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-elevated transition-colors"
              onClick={() => {
                onClearClick();
                setHeaderMenu(false);
              }}
            >
              Clear chat
            </button>
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-elevated transition-colors"
              onClick={() => {
                onClose();
                setHeaderMenu(false);
              }}
            >
              Close chat
            </button>
          </div>
        </>
      )}
    </>
  );
}
