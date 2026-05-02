import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";

export function useFileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File must be under 20MB");
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFile = async (): Promise<object> => {
    if (!selectedFile) return {};
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await api.post("/messages/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return {
        fileUrl: res.data.fileUrl,
        fileName: res.data.fileName,
        fileType: res.data.fileType,
        fileSize: res.data.fileSize,
      };
    } finally {
      setUploading(false);
    }
  };

  return {
    selectedFile,
    filePreview,
    uploading,
    fileInputRef,
    handleFileSelect,
    clearSelectedFile,
    uploadFile,
  };
}