import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import userRoutes from "./routes/user.routes.js";

import { Message } from "./models/Messages.js";
import { User } from "./models/User.js";

import authRoutes from "./routes/auth.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import messageRoutes from "./routes/messages.route.js";

dotenv.config();
const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5174",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/messages", messageRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5174",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map();

io.on("connection", async (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register_user", async (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log("Registered:", userId, "->", socket.id);
    await User.findByIdAndUpdate(userId, { lastSeen: null });
    io.emit("user_status_change", { userId, lastSeen: null });
  });

  socket.on("join_conversation", (conversationId) => {
    if (!conversationId) {
      return console.log("No conversationId provided");
    }
    socket.join(conversationId);
    console.log(`User ${socket.id} joined room: ${conversationId}`);
  });

  // GROUP CREATED — notify all members
  socket.on("group_created", (data) => {
    const { conversation, memberIds } = data;
    memberIds.forEach((memberId) => {
      const memberSocketId = onlineUsers.get(memberId);
      if (memberSocketId) {
        io.to(memberSocketId).emit("added_to_group", conversation);
      }
    });
  });

  // SEND INVITATION
  socket.on("send_invitation", (data) => {
    const { receiverId, invitation } = data;
    console.log("send_invitation received, receiverId:", receiverId);
    console.log("Online users:", [...onlineUsers.entries()]);
    const receiverSocketId = onlineUsers.get(receiverId);
    console.log("Receiver socket:", receiverSocketId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive_invitation", invitation);
    }
  });

  // ACCEPT INVITATION
  socket.on("accept_invitation", (data) => {
    const { senderId, conversation } = data;
    const senderSocketId = onlineUsers.get(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("invitation_accepted", conversation);
    }
  });

  // REJECT INVITATION
  socket.on("reject_invitation", (data) => {
    const { senderId } = data;
    const senderSocketId = onlineUsers.get(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("invitation_rejected");
    }
  });

  // SEND MESSAGE
  socket.on("send_message", async (data) => {
    try {
      const { conversationId, text, senderId, receiverId, fileUrl, fileName, fileType, fileSize } = data;

      if (!conversationId || !senderId) return;

      const message = await Message.create({
        conversationId,
        sender: senderId,
        text: text || "",
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        fileSize: fileSize || null,
      });

      await message.populate("sender", "username profilePic");

      if (receiverId) {
        // private chat — emit to sender and receiver only
        const senderSocketId = onlineUsers.get(senderId);
        const receiverSocketId = onlineUsers.get(receiverId);
        if (senderSocketId) io.to(senderSocketId).emit("receive_message", message);
        if (receiverSocketId) io.to(receiverSocketId).emit("receive_message", message);
      } else {
        // group chat — emit to everyone in the room
        io.to(conversationId).emit("receive_message", message);
      }
    } catch (err) {
      console.error("Message error:", err.message);
    }
  });

  // DISCONNECT
  socket.on("disconnect", async () => {
    const now = new Date();
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        await User.findByIdAndUpdate(userId, { lastSeen: now });
        io.emit("user_status_change", { userId, lastSeen: now });
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });

  socket.on("delete_message", ({ messageId, conversationId }) => {
    io.to(conversationId).emit("message_deleted", { messageId });
  });

  socket.on("clear_chat", ({ conversationId }) => {
    io.to(conversationId).emit("chat_cleared", { conversationId });
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DB connected");
    server.listen(PORT, () => {
      console.log(`Server running with socket.io on port ${PORT}`);
    });
  })
  .catch(err => console.log(err));