export default function FileMessage({ msg }: { msg: any }) {
  const { fileUrl, fileName, fileType, fileSize } = msg;

  const formatSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = () => {
    if (fileType === "pdf") return "📄";
    if (fileType === "word") return "📝";
    return "📎";
  };

 
  if (fileType === "image") {
    return (
      <div>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
            style={{ maxHeight: "200px", objectFit: "cover" }}
          />
        </a>
        {msg.text && (
          <p className="mt-1 text-sm">{msg.text}</p>
        )}
      </div>
    );
  }


  return (
    <div>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={fileName}
        className="flex items-center gap-3 p-2 rounded-lg bg-black bg-opacity-20 hover:bg-opacity-30 transition no-underline"
      >
        <span className="text-2xl flex-shrink-0">{getFileIcon()}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate font-medium">{fileName}</p>
          <p className="text-xs text-[#8696a0]">
            {fileType?.toUpperCase()} {fileSize ? `· ${formatSize(fileSize)}` : ""}
          </p>
        </div>
        <span className="text-[#8696a0] text-lg flex-shrink-0">⬇</span>
      </a>
      {msg.text && <p className="mt-1 text-sm">{msg.text}</p>}
    </div>
  );
}