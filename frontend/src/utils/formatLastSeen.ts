 export const formatLastSeen = (lastSeen: Date | string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "last seen just now";
    if (diffMins < 60) return `last seen ${diffMins} min ago`;
    if (diffHours < 24) return `last seen today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (diffDays === 1) return `last seen yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (diffDays < 7) return `last seen ${diffDays} days ago`;
    return `last seen on ${date.toLocaleDateString([], { day: "numeric", month: "short" })}`;
  };
