import { useState ,useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { socket } from "../socket";
import { api } from "../services/api";

export default function ChatLayout() {
  // this will hold the selected receiver's info
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);


  useEffect(() => {
    const registerUser = async () => {
      try {
        const res = await api.get("/auth/me");
        const currentUser = res.data.user;

        //  connect and register as soon as layout loads
        if (!socket.connected) socket.connect();

        setCurrentUser(res.data.user);

        const register = () => {
          socket.emit("register_user", currentUser._id);
        };

        if (socket.connected) {
          register();
        } else {
          socket.once("connect", register);
        }

        // re-register on reconnect
        socket.on("connect", register);
      } catch (err) {
        console.log("Failed to register user:", err);
      }
    };

    registerUser();

    return () => {
      socket.off("connect");
    };
  }, []);
  return (
    <div className="h-screen flex bg-[#111b21] text-white">
      
      {/* LEFT — Sidebar */}
      <div className="w-87.5 border-r border-[#2a3942]">
        <Sidebar onSelectUser={setSelectedUser}
        selectedUser={selectedUser}
  currentUser={currentUser}  />
      </div>

      {/* RIGHT — Chat Window */}
      <div className="flex-1">
        {selectedUser ? (
          <ChatWindow receiver={selectedUser} />
        ) : (
          // shown when no chat is selected
          <div className="h-full flex items-center justify-center text-[#8696a0]">
            <p>Select a contact to start chatting</p>
          </div>
        )}
      </div>

    </div>
  );
}