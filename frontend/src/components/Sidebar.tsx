import { useEffect, useState } from "react";
import { api } from "../services/api";
import { socket } from "../socket";
import InvitationPanel from "./InvitationPanel";
import CreateGroupModal from "./CreateGroupModel";
import ProfileModal from "./ProfileModal";
import { toast } from "react-toastify";
import { formatLastSeen } from "../../utils/formatLastSeen";
import { unregisterPushNotifications } from "../utils/pushNotification";
import "../index.css";

function formatMessageTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatLastMessageText(lastMessage: any): string {
  if (!lastMessage) return "";
  if (lastMessage.text) return lastMessage.text;
  if (lastMessage.fileType === "image") return "📷 Photo";
  if (lastMessage.fileType === "pdf") return "📄 PDF";
  if (lastMessage.fileType === "word") return "📝 Document";
  return "📎 File";
}

export default function Sidebar({
  onSelectUser,
  currentUser,
  userStatuses = {},
}: {
  onSelectUser: (user: any) => void;
  selectedUser: any;
  currentUser: any;
  userStatuses: Record<string, Date | null>;
}) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [showInvitations, setShowInvitations] = useState(false);
  const [inviteStatuses, setInviteStatuses] = useState<Record<string, string>>({});
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    try {
      const res = await api.get("/conversations/contacts");
      const seen = new Set();
      const unique = res.data.contacts.filter((c: any) => {
        if (c.isGroup) return true;
        if (!c.user || seen.has(c.user._id)) return false;
        seen.add(c.user._id);
        return true;
      });
      setContacts(unique);
    } catch (err) {
      console.log("Failed to load contacts:", err);
    }
  };

  useEffect(() => { fetchPendingInvitations(); }, []);

  const fetchPendingInvitations = async () => {
    try {
      const res = await api.get("/invitations/pending");
      setPendingInvitations(res.data.invitations);
    } catch (err) {
      console.log("Failed to load invitations:", err);
    }
  };

  useEffect(() => {
    socket.on("receive_invitation", (invitation) => {
      setPendingInvitations((prev) => [...prev, invitation]);
    });

    socket.on("invitation_accepted", (conversation) => {
      const otherUser = conversation.participants.find(
        (p: any) => p._id.toString() !== currentUser?._id.toString()
      );
      if (otherUser) {
        setContacts((prev) => [
          ...prev,
          { conversationId: conversation._id, user: otherUser },
        ]);
      }
    });

    socket.on("invitation_rejected", () => {
      console.log("Invitation was rejected");
    });

    socket.on("added_to_group", (conversation) => {
      setContacts((prev) => [
        ...prev,
        {
          conversationId: conversation._id,
          isGroup: true,
          groupName: conversation.groupInfo.name,
          participants: conversation.participants,
        },
      ]);
    });

    // Update last message preview in real time
    socket.on("last_message_update", ({ conversationId, lastMessage }) => {
      setContacts((prev) =>
        prev.map((c) =>
          c.conversationId.toString() === conversationId.toString()
            ? { ...c, lastMessage }
            : c
        )
      );
    });

    return () => {
      socket.off("receive_invitation");
      socket.off("invitation_accepted");
      socket.off("invitation_rejected");
      socket.off("added_to_group");
      socket.off("last_message_update");
    };
  }, [currentUser]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setInviteStatuses({});
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`/users/search?query=${query}`);
        const users = res.data.users;
        setSearchResults(users);

        const statuses: Record<string, string> = {};
        await Promise.all(
          users.map(async (user: any) => {
            const statusRes = await api.get(`/invitations/status/${user._id}`);
            statuses[user._id] = statusRes.data.status;
          })
        );
        setInviteStatuses(statuses);
      } catch (err) {
        console.log("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSendInvite = async (user: any) => {
    try {
      const res = await api.post("/invitations/send", { receiverId: user._id });
      const invitation = res.data.invitation;
      socket.emit("send_invitation", { receiverId: user._id, invitation });
      setInviteStatuses((prev) => ({ ...prev, [user._id]: "pending" }));
    } catch (err: any) {
      toast.warning(err.response?.data?.message || "Failed to send invitation");
    }
  };

  const handleAccept = async (invitation: any) => {
    try {
      const res = await api.post("/invitations/accept", { invitationId: invitation._id });
      const conversation = res.data.conversation;
      socket.emit("accept_invitation", { senderId: invitation.sender._id, conversation });
      setPendingInvitations((prev) => prev.filter((inv) => inv._id !== invitation._id));
      setContacts((prev) => [
        ...prev,
        { conversationId: conversation._id, user: invitation.sender },
      ]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to accept invitation");
    }
  };

  const handleReject = async (invitation: any) => {
    try {
      await api.post("/invitations/reject", { invitationId: invitation._id });
      socket.emit("reject_invitation", { senderId: invitation.sender._id });
      setPendingInvitations((prev) => prev.filter((inv) => inv._id !== invitation._id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject invitation");
    }
  };

  const handleLogout = async () => {
  try {
    await unregisterPushNotifications(api);
    await api.post("/auth/logout");
    localStorage.removeItem("token");
    socket.disconnect();
    window.location.href = "/";
  } catch (err) {
    console.log("Logout failed:", err);
  }
};

  const handleCreateGroup = async (name: string, members: any[]) => {
    try {
      const res = await api.post("/conversations/group", {
        name,
        memberIds: members.map((m) => m._id),
      });
      const conversation = res.data.conversation;
      socket.emit("group_created", {
        conversation,
        memberIds: members.map((m) => m._id),
      });
      setContacts((prev) => [
        ...prev,
        {
          conversationId: conversation._id,
          isGroup: true,
          groupName: conversation.groupInfo.name,
          participants: conversation.participants,
        },
      ]);
      setShowCreateGroup(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create group");
    }
  };

  const handleProfileUpdate = (updatedUser: any) => {
    setProfileUser(updatedUser);
  };

  const renderInviteButton = (user: any) => {
    const status = inviteStatuses[user._id];
    if (status === "contacts") {
      return (
        <button
          onClick={() => { onSelectUser(user); setQuery(""); }}
          className="text-xs px-3 py-1 rounded-full bg-[#00a884] text-white"
        >
          Message
        </button>
      );
    }
    if (status === "pending") {
      return (
        <span className="text-xs px-3 py-1 rounded-full bg-[#2a3942] text-[#8696a0]">
          Pending
        </span>
      );
    }
    return (
      <button
        onClick={() => handleSendInvite(user)}
        className="text-xs px-3 py-1 rounded-full bg-[#00a884] text-white"
      >
        Invite
      </button>
    );
  };

  const activeUser = profileUser || currentUser;

  return (
    <div className="h-full flex flex-col bg-[#111b21] text-white">

      {/* ── Top Header ── */}
      <div className="px-4 py-3 bg-[#202c33] flex items-center justify-between flex-shrink-0">
        <p className="font-semibold text-lg">Chats</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInvitations(!showInvitations)}
            className="relative p-1"
          >
            <i className="fa-regular fa-bell text-white text-base"></i>
            {pendingInvitations.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {pendingInvitations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-[#2a3942] text-white hover:bg-[#3a4942] transition"
          >
            <i className="fa-solid fa-user-group text-white text-xs"></i>
            <span>Group</span>
          </button>
        </div>
      </div>

      {/* ── Invitation Panel ── */}
      {showInvitations && (
        <InvitationPanel
          invitations={pendingInvitations}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}

      {/* ── Search Bar ── */}
      <div className="px-3 py-2 flex-shrink-0">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search or start new chat"
          className="w-full px-4 py-2 rounded-lg bg-[#202c33] text-white text-sm outline-none placeholder-[#8696a0]"
        />
      </div>

      {/* ── Search Results / Contacts List ── */}
      {query.trim() ? (
        <div className="flex-1 scroll-container overflow-y-auto">
          {loading && (
            <p className="text-[#8696a0] text-sm px-4 py-3">Searching...</p>
          )}
          {!loading && searchResults.length === 0 && (
            <p className="text-[#8696a0] text-sm px-4 py-3">No users found</p>
          )}
          {searchResults.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between px-4 py-3 hover:bg-[#202c33]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center font-bold uppercase overflow-hidden">
                  {user.profilePic ? (
                    <img src={user.profilePic} className="w-full h-full object-cover" alt={user.username} />
                  ) : (
                    user.username[0]
                  )}
                </div>
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-[#8696a0]">{user.email}</p>
                </div>
              </div>
              {renderInviteButton(user)}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 no-scrollbar overflow-y-auto">
          {contacts.length === 0 && (
            <p className="text-[#8696a0] text-sm px-4 py-6 text-center">
              No contacts yet. Search to find people.
            </p>
          )}
          {contacts.map((contact) => {
            const userId = contact.user?._id;
            const status = userId && userStatuses ? userStatuses[userId] : undefined;
            const isOnline = status === null;

            return (
              <div
                key={contact.conversationId}
                onClick={() => onSelectUser(contact.isGroup ? contact : contact.user)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] cursor-pointer border-b border-[#2a3942] border-opacity-40"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-[#00a884] flex items-center justify-center font-bold uppercase overflow-hidden">
                    {contact.isGroup ? (
                      contact.groupName[0]
                    ) : contact.user?.profilePic ? (
                      <img src={contact.user.profilePic} className="w-full h-full object-cover" alt={contact.user.username} />
                    ) : (
                      contact.user?.username[0]
                    )}
                  </div>
                  {!contact.isGroup && isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#111b21]" />
                  )}
                </div>

                {/* Name + last message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">
                      {contact.isGroup ? contact.groupName : contact.user?.username}
                    </p>
                    {contact.lastMessage?.createdAt && (
                      <span className="text-xs text-[#8696a0] flex-shrink-0 ml-2">
                        {formatMessageTime(contact.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8696a0] truncate">
                    {contact.lastMessage
                      ? formatLastMessageText(contact.lastMessage)
                      : contact.isGroup
                      ? `${contact.participants?.length} members`
                      : isOnline
                      ? "online"
                      : status
                      ? formatLastSeen(status)
                      : "offline"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Bottom Bar ── */}
      <div className="px-4 py-3 bg-[#202c33] border-t border-[#2a3942] flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-3 hover:opacity-80 transition text-left"
        >
          <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center font-bold uppercase text-sm overflow-hidden flex-shrink-0">
            {activeUser?.profilePic ? (
              <img src={activeUser.profilePic} className="w-full h-full object-cover" alt="my profile" />
            ) : (
              activeUser?.username?.[0] || "?"
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-white leading-tight">
              {activeUser?.username || "..."}
            </p>
            <p className="text-xs text-[#8696a0]">My Profile</p>
          </div>
        </button>
        <button
          onClick={handleLogout}
          className="text-xs px-3 py-1.5 rounded-lg bg-[#2a3942] text-white hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* ── Modals ── */}
      {showCreateGroup && (
        <CreateGroupModal
          contacts={contacts}
          onClose={() => setShowCreateGroup(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {showProfile && (
        <ProfileModal
          currentUser={activeUser}
          onClose={() => setShowProfile(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}