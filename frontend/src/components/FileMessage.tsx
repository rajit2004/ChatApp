import { FileIcon } from "./ui/Icons";

export default function FileMessage({ msg }: { msg: any }) {
  const { fileUrl, fileName, fileType, fileSize } = msg;

  const formatSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (fileType === "image") {
    return (
      <div>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full max-h-[200px] rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
          />
        </a>
        {msg.text && <p className="mt-1.5 text-sm px-1">{msg.text}</p>}
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
        className="flex items-center gap-3 p-2.5 rounded-md file-attachment transition-colors no-underline"
      >
        <div className="w-9 h-9 rounded-md bg-accent/15 flex items-center justify-center flex-shrink-0 text-accent">
          <FileIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate font-medium">{fileName}</p>
          <p className="text-xs text-muted">
            {fileType?.toUpperCase()} {fileSize ? `· ${formatSize(fileSize)}` : ""}
          </p>
        </div>
      </a>
      {msg.text && <p className="mt-1.5 text-sm">{msg.text}</p>}
    </div>
  );
}
