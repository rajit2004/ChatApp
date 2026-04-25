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
    <div className="bg-[#202c33] border-b border-[#2a3942]">
      {invitations.length === 0 ? (
        <p className="text-[#8696a0] text-sm p-4">No pending invitations</p>
      ) : (
        invitations.map((inv) => (
          <div
            key={inv._id}
            className="flex items-center justify-between px-4 py-3 border-b border-[#2a3942]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center font-bold uppercase">
                {inv.sender?.username[0]}
              </div>
              <div>
                <p className="text-sm font-medium">{inv.sender?.username}</p>
                <p className="text-xs text-[#8696a0]">wants to connect</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onAccept(inv)}
                className="text-xs px-3 py-1 rounded-full bg-[#00a884] text-white"
              >
                Accept
              </button>
              <button
                onClick={() => onReject(inv)}
                className="text-xs px-3 py-1 rounded-full bg-red-500 text-white"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}