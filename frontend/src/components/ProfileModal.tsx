import { useRef, useState } from "react";
import { api } from "../services/api";
import { toast } from "react-toastify";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Avatar from "./ui/Avatar";
import IconButton from "./ui/IconButton";
import { CameraIcon, PhoneIcon } from "./ui/Icons";

export default function ProfileModal({
  currentUser,
  onClose,
  onUpdate,
}: {
  currentUser: any;
  onClose: () => void;
  onUpdate: (user: any) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("profilePic", file);

      const res = await api.post("/users/upload-profile-pic", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onUpdate(res.data.user);
      toast.success("Profile picture updated");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);
      const res = await api.delete("/users/remove-profile-pic");
      onUpdate(res.data.user);
      toast.success("Profile picture removed");
    } catch {
      toast.error("Failed to remove picture");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title="Profile" onClose={onClose}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <Avatar
            src={currentUser?.profilePic}
            name={currentUser?.username || "?"}
            size="xl"
          />
          <IconButton
            label="Upload photo"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-9 h-9 bg-accent text-white hover:bg-accent-hover hover:text-white rounded-full shadow-lg"
          >
            <CameraIcon className="w-4 h-4" />
          </IconButton>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />

        <div className="text-center w-full">
          <p className="text-text font-semibold text-xl truncate">
            {currentUser?.username}
          </p>
          <p className="text-muted text-sm mt-1 truncate">{currentUser?.email}</p>
          {currentUser?.phone && (
            <p className="text-muted text-sm mt-1 flex items-center justify-center gap-1.5">
              <PhoneIcon className="w-3.5 h-3.5" />
              {currentUser.phone}
            </p>
          )}
        </div>

        <div className="w-full h-px bg-border" />

        <div className="flex gap-3 w-full">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            fullWidth
          >
            {uploading ? "Uploading..." : "Change photo"}
          </Button>
          {currentUser?.profilePic && (
            <Button
              variant="secondary"
              onClick={handleRemove}
              disabled={uploading}
              fullWidth
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
