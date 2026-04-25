import { useEffect, useState } from "react";
import { api } from "../services/api";
import { socket } from "../socket";
import InvitationPanel from "./InvitationPanel";
import CreateGroupModal from "./CreateGroupModel";
import { toast } from "react-toastify";

export default function Sidebar({
  onSelectUser,
  currentUser,
}: {
  onSelectUser: (user: any) => void;
  selectedUser: any;
  currentUser: any;
}) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [showInvitations, setShowInvitations] = useState(false);
  const [inviteStatuses, setInviteStatuses] = useState<Record<string, string>>({});
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // load contacts
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await api.get("/conversations/contacts");
      const seen = new Set();
      const unique = res.data.contacts.filter((c: any) => {
        if (c.isGroup) return true; // always include groups
        if (!c.user || seen.has(c.user._id)) return false;
        seen.add(c.user._id);
        return true;
      });
      setContacts(unique);
    } catch (err) {
      console.log("Failed to load contacts:", err);
    }
  };

  // load pending invitations
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

  // socket listeners
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

    return () => {
      socket.off("receive_invitation");
      socket.off("invitation_accepted");
      socket.off("invitation_rejected");
      socket.off("added_to_group");
    };
  }, [currentUser]);

  // search users
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
      const res = await api.post("/invitations/accept", {
        invitationId: invitation._id,
      });
      const conversation = res.data.conversation;
      socket.emit("accept_invitation", {
        senderId: invitation.sender._id,
        conversation,
      });
      setPendingInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitation._id)
      );
      setContacts((prev) => [
        ...prev,
        { conversationId: conversation._id, user: invitation.sender },
      ]);
    } catch (err: any) {
      toast.error(err.response?.data?.message|| "Failed to accept invitation");
    }
  };

  const handleReject = async (invitation: any) => {
    try {
      await api.post("/invitations/reject", { invitationId: invitation._id });
      socket.emit("reject_invitation", { senderId: invitation.sender._id });
      setPendingInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitation._id)
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject invitation");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      socket.disconnect();
      window.location.href = "/";
       toast.error( "Logout Successfull");
      
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

  return (
    <div className="h-full flex flex-col bg-[#111b21] text-white relative">

      {/* Header */}
      <div className="px-4 py-3 bg-[#202c33] flex items-center justify-between">
        <p className="font-semibold text-lg">Chats</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInvitations(!showInvitations)}
            className="relative"
          >
            🔔
            {pendingInvitations.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {pendingInvitations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="text-xs px-3 py-1 rounded-full bg-[#2a3942] text-white hover:bg-[#3a4942]"
          >
            + Group
          </button>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1 rounded-md bg-gray-400 text-white hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Invitation Panel */}
      {showInvitations && (
        <InvitationPanel
          invitations={pendingInvitations}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}

      {/* Search Bar */}
      <div className="px-3 py-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search or start new chat"
          className="w-full px-4 py-2 rounded-lg bg-[#202c33] text-white text-sm outline-none placeholder-[#8696a0]"
        />
      </div>

      {/* Search Results */}
      {query.trim() ? (
        <div className="flex-1 overflow-y-auto">
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
                <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center font-bold uppercase">
                  {user.username[0]}
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
        /* Contacts List */
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 && (
            <p className="text-[#8696a0] text-sm px-4 py-3">
              No contacts yet. Search to find people.
            </p>
          )}
          {contacts.map((contact) => (
            <div
              key={contact.conversationId}
              onClick={() => onSelectUser(contact.isGroup ? contact : contact.user)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center font-bold uppercase">
                {contact.isGroup
                  ? contact.groupName[0]
                  : contact.user?.username[0]}
              </div>
              <div>
                <p className="font-medium">
                  {contact.isGroup ? contact.groupName : contact.user?.username}
                </p>
                <p className="text-sm text-[#8696a0]">
                  {contact.isGroup
                    ? `${contact.participants?.length} members`
                    : contact.user?.email}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          contacts={contacts}
          onClose={() => setShowCreateGroup(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}

    </div>
  );
}