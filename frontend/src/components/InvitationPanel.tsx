import Avatar from "./ui/Avatar";
import Button from "./ui/Button";

export default function InvitationPanel({
  invitations,
  onAccept,
  onReject,
}: {
  invitations: any[];
  onAccept: (inv: any) => void;
  onReject: (inv: any) => void;
}) {
  return (
    <div className="bg-elevated border-b border-border">
      {invitations.length === 0 ? (
        <p className="text-muted text-sm p-4">No pending invitations</p>
      ) : (
        invitations.map((inv) => (
          <div
            key={inv._id}
            className="flex items-center justify-between px-4 py-3 border-b border-border/50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar src={inv.sender?.profilePic} name={inv.sender?.username || "?"} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{inv.sender?.username}</p>
                <p className="text-xs text-muted">Wants to connect</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" onClick={() => onAccept(inv)}>
                Accept
              </Button>
              <Button size="sm" variant="danger" onClick={() => onReject(inv)}>
                Decline
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
