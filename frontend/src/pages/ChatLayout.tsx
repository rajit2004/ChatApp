import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { socket } from "../socket";
import { api } from "../services/api";
import { registerPushNotifications } from "../utils/pushNotification";
import { MessageIcon } from "../components/ui/Icons";

export default function ChatLayout() {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userStatuses, setUserStatuses] = useState<Record<string, Date | null>>({});

  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");

  useEffect(() => {
const registerUser = async () => {
  try {
    const res = await api.get("/auth/me");
    const currentUser = res.data.user;

    if (!socket.connected) socket.connect();
    setCurrentUser(res.data.user);

    const register = async () => {
      socket.emit("register_user", currentUser._id);
      await new Promise(resolve => setTimeout(resolve, 500));
      const onlineRes = await api.get("/users/online");
      const onlineUserIds: string[] = onlineRes.data.onlineUserIds;
      const initialStatuses: Record<string, Date | null> = {};
      onlineUserIds.forEach(id => { initialStatuses[id] = null; });
      setUserStatuses(initialStatuses);
    };

    if (socket.connected) register();
    else socket.once("connect", register);
    socket.on("connect", register);

    console.log("Registering push notifications..."); // ✅ add this
    await registerPushNotifications(api);
    console.log("Push registration done"); // ✅ add this

  }  catch (err: any) {
    if (err.response?.status === 401) {
      //  Token expired or invalid — clear and redirect
      localStorage.removeItem("token");
      window.location.href = "/";
      return;
    }
    console.log("Failed to register user:", err);
  }
};

    registerUser();

    socket.on("user_status_change", (data) => {
      setUserStatuses((prev) => ({ ...prev, [data.userId]: data.lastSeen }));
    });

    return () => {
      socket.off("connect");
      socket.off("user_status_change");
    };
  }, []);

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setMobileView("chat");
  };

  const handleCloseChat = () => {
    setSelectedUser(null);
    setMobileView("sidebar");
  };

  return (
    <div className="h-screen flex bg-app text-text overflow-hidden">

      <div
        className={`
          flex-shrink-0 border-r border-border
          w-full md:w-80 lg:w-96
          ${mobileView === "chat" ? "hidden" : "flex flex-col"}
          md:flex md:flex-col
        `}
      >
        <Sidebar
          onSelectUser={handleSelectUser}
          selectedUser={selectedUser}
          currentUser={currentUser}
          userStatuses={userStatuses}
        />
      </div>

      <div
        className={`
          flex-1 flex flex-col min-w-0 bg-app
          ${mobileView === "sidebar" ? "hidden" : "flex"}
          md:flex
        `}
      >
        {selectedUser ? (
          <ChatWindow
            receiver={selectedUser}
            onClose={handleCloseChat}
          />
        ) : (
          <div className="h-full hidden md:flex items-center justify-center flex-col gap-4">
            <div className="w-16 h-16 rounded-2xl bg-elevated border border-border flex items-center justify-center text-accent">
              <MessageIcon className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-text">Select a conversation</p>
              <p className="text-sm text-muted mt-1">
                Choose a contact from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}