import { useState } from "react";
import { toast } from "react-toastify";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Avatar from "./ui/Avatar";

export default function CreateGroupModal({
  contacts,
  onClose,
  onCreateGroup,
}: {
  contacts: any[];
  onClose: () => void;
  onCreateGroup: (name: string, members: any[]) => void;
}) {
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = searchQuery.trim()
    ? contacts
        .filter((c) => !c.isGroup)
        .filter((c) =>
          c.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : [];

  const toggleMember = (user: any) => {
    const isSelected = selectedMembers.find((m) => m._id === user._id);
    if (isSelected) {
      setSelectedMembers((prev) => prev.filter((m) => m._id !== user._id));
    } else {
      setSelectedMembers((prev) => [...prev, user]);
    }
  };

  const isSelected = (userId: string) =>
    !!selectedMembers.find((m) => m._id === userId);

  const handleSubmit = () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      toast.info("Group name and at least one member are required");
      return;
    }
    onCreateGroup(groupName, selectedMembers);
  };

  return (
    <Modal title="Create group" onClose={onClose} className="max-h-[85vh] flex flex-col">
      <div className="flex flex-col gap-4 min-h-0">
        <Input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group name"
        />

        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search contacts to add..."
        />

        {selectedMembers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map((m) => (
              <button
                key={m._id}
                type="button"
                onClick={() => toggleMember(m)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs hover:bg-accent/25 transition-colors"
              >
                {m.username}
                <span className="text-accent/60">×</span>
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-muted">
          {selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""} selected
        </p>

        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 min-h-0 max-h-48">
          {!searchQuery.trim() && (
            <p className="text-muted text-xs text-center py-6">
              Search your contacts above to add members
            </p>
          )}

          {searchQuery.trim() && filteredContacts.length === 0 && (
            <p className="text-muted text-xs text-center py-6">
              No contacts match &ldquo;{searchQuery}&rdquo;
            </p>
          )}

          {filteredContacts.map((contact) => (
            <button
              key={contact.conversationId}
              type="button"
              onClick={() => toggleMember(contact.user)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors w-full text-left ${
                isSelected(contact.user._id)
                  ? "bg-accent/15 ring-1 ring-accent/30"
                  : "bg-input hover:bg-elevated"
              }`}
            >
              <Avatar
                src={contact.user?.profilePic}
                name={contact.user?.username || "?"}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{contact.user?.username}</p>
                <p className="text-xs text-muted truncate">{contact.user?.email}</p>
              </div>
              {isSelected(contact.user._id) && (
                <span className="text-accent text-sm">✓</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button onClick={handleSubmit} fullWidth>
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
}
