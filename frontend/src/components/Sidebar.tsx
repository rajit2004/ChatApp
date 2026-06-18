import { useEffect, useState } from "react";
import { api, skipGlobalLoader } from "../services/api";
import { socket } from "../socket";
import InvitationPanel from "./InvitationPanel";
import CreateGroupModal from "./CreateGroupModel";
import ProfileModal from "./ProfileModal";
import { toast } from "react-toastify";
import { formatLastSeen } from "../../utils/formatLastSeen";
import { unregisterPushNotifications } from "../utils/pushNotification";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import Input from "./ui/Input";
import IconButton from "./ui/IconButton";
import { BellIcon, UsersIcon, ImageIcon, FileIcon } from "./ui/Icons";
import ThemeToggle from "./ui/ThemeToggle";
import Loader from "./ui/Loader";

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
  if (lastMessage.fileType === "image") return "Photo";
  if (lastMessage.fileType === "pdf") return "PDF";
  if (lastMessage.fileType === "word") return "Document";
  return "File";
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
  const [contactsLoading, setContactsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [showInvitations, setShowInvitations] = useState(false);
  const [inviteStatuses, setInviteStatuses] = useState<Record<string, string>>({});
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setContactsLoading(true);
      const res = await api.get("/conversations/contacts", skipGlobalLoader());
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
    } finally {
      setContactsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingInvitations();
  }, []);

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

    socket.on("invitation_rejected", () => {});

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
        <Button
          size="sm"
          onClick={() => {
            onSelectUser(user);
            setQuery("");
          }}
        >
          Message
        </Button>
      );
    }
    if (status === "pending") {
      return (
        <span className="text-xs px-3 py-1.5 rounded-md bg-elevated text-muted border border-border">
          Pending
        </span>
      );
    }
    return (
      <Button size="sm" onClick={() => handleSendInvite(user)}>
        Invite
      </Button>
    );
  };

  const activeUser = profileUser || currentUser;

  return (
    <div className="h-full flex flex-col bg-surface">
      <div className="px-4 py-3.5 border-b border-border flex items-center justify-between flex-shrink-0">
        <h1 className="font-semibold text-lg tracking-tight text-text">Messages</h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <IconButton
            label="Invitations"
            onClick={() => setShowInvitations(!showInvitations)}
            active={showInvitations}
            className="relative"
          >
            <BellIcon className="w-5 h-5" />
            {pendingInvitations.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger rounded-full text-[10px] font-medium flex items-center justify-center text-white">
                {pendingInvitations.length}
              </span>
            )}
          </IconButton>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-1.5 ml-1"
          >
            <UsersIcon className="w-3.5 h-3.5" />
            Group
          </Button>
        </div>
      </div>

      {showInvitations && (
        <InvitationPanel
          invitations={pendingInvitations}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}

      <div className="px-3 py-2.5 flex-shrink-0">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people..."
        />
      </div>

      {query.trim() ? (
        <div className="flex-1 scroll-container overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-6">
              <Loader size="sm" />
            </div>
          )}
          {!loading && searchResults.length === 0 && (
            <p className="text-muted text-sm px-4 py-3">No users found</p>
          )}
          {searchResults.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between px-4 py-3 hover:bg-elevated transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={user.profilePic} name={user.username} />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{user.username}</p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                </div>
              </div>
              {renderInviteButton(user)}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 no-scrollbar overflow-y-auto">
          {contactsLoading ? (
            <div className="flex justify-center py-12">
              <Loader message="Loading chats..." size="sm" />
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-muted text-sm px-4 py-8 text-center">
              No conversations yet. Search to find people.
            </p>
          ) : (
          contacts.map((contact) => {
            const userId = contact.user?._id;
            const status = userId && userStatuses ? userStatuses[userId] : undefined;
            const isOnline = status === null;
            const displayName = contact.isGroup ? contact.groupName : contact.user?.username;

            return (
              <div
                key={contact.conversationId}
                onClick={() => onSelectUser(contact.isGroup ? contact : contact.user)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-elevated cursor-pointer transition-colors border-b border-border/50"
              >
                <Avatar
                  src={contact.isGroup ? null : contact.user?.profilePic}
                  name={displayName || "?"}
                  size="lg"
                  online={!contact.isGroup && isOnline}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">{displayName}</p>
                    {contact.lastMessage?.createdAt && (
                      <span className="text-xs text-muted flex-shrink-0">
                        {formatMessageTime(contact.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5">
                    {contact.lastMessage ? (
                      <span className="flex items-center gap-1">
                        {contact.lastMessage.fileType === "image" && (
                          <ImageIcon className="w-3 h-3 inline flex-shrink-0" />
                        )}
                        {contact.lastMessage.fileType &&
                          contact.lastMessage.fileType !== "image" && (
                            <FileIcon className="w-3 h-3 inline flex-shrink-0" />
                          )}
                        {formatLastMessageText(contact.lastMessage)}
                      </span>
                    ) : contact.isGroup ? (
                      `${contact.participants?.length} members`
                    ) : isOnline ? (
                      <span className="text-online">Online</span>
                    ) : status ? (
                      formatLastSeen(status)
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>
            );
          })
          )}
        </div>
      )}

      <div className="px-4 py-3 border-t border-border flex items-center justify-between flex-shrink-0 bg-elevated/50">
        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-3 hover:opacity-80 transition text-left min-w-0"
        >
          <Avatar
            src={activeUser?.profilePic}
            name={activeUser?.username || "?"}
            size="md"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {activeUser?.username || "..."}
            </p>
            <p className="text-xs text-muted">View profile</p>
          </div>
        </button>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>

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
