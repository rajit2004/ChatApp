import { useState } from "react";

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

  const toggleMember = (user: any) => {
    const isSelected = selectedMembers.find((m) => m._id === user._id);
    if (isSelected) {
      setSelectedMembers((prev) => prev.filter((m) => m._id !== user._id));
    } else {
      setSelectedMembers((prev) => [...prev, user]);
    }
  };

  const handleSubmit = () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      alert("Group name and at least one member are required");
      return;
    }
    onCreateGroup(groupName, selectedMembers);
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-[#202c33] rounded-lg p-6 w-80 flex flex-col gap-4">
        <p className="font-semibold text-lg text-white">Create Group</p>

        {/* Group Name */}
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group name..."
          className="px-4 py-2 rounded-lg bg-[#2a3942] text-white text-sm outline-none"
        />

        {/* Member Selection */}
        <p className="text-sm text-[#8696a0]">Select members from your contacts:</p>
        <div className="max-h-48 overflow-y-auto flex flex-col gap-2">
          {contacts
            .filter((c) => !c.isGroup)
            .map((contact) => {
              const isSelected = selectedMembers.find(
                (m) => m._id === contact.user._id
              );
              return (
                <div
                  key={contact.conversationId}
                  onClick={() => toggleMember(contact.user)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer ${
                    isSelected ? "bg-[#00a884]" : "bg-[#2a3942] hover:bg-[#3a4952]"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#111b21] flex items-center justify-center font-bold uppercase text-sm text-white">
                    {contact.user?.username[0]}
                  </div>
                  <p className="text-sm text-white">{contact.user?.username}</p>
                </div>
              );
            })}
        </div>

        {/* Selected count */}
        <p className="text-xs text-[#8696a0]">
          {selectedMembers.length} member(s) selected
        </p>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-[#2a3942] text-sm text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 rounded-lg bg-[#00a884] text-sm text-white"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}