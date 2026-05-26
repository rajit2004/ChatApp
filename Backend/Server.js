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
import { Conversation } from "./models/Conversation.js";
import authRoutes from "./routes/auth.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import messageRoutes from "./routes/messages.route.js";
import { isRateLimited } from "./middleware/rateLimiter.js";
import redis from "./config/redis.js";

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
app.set('trust proxy', 1);

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

// ✅ Helper functions — replace all onlineUsers.get/set/delete
// Keeps socket code clean and readable

// Store userId → socketId in Redis Hash
async function setUserOnline(userId, socketId) {
  await redis.hset('onlineUsers', userId, socketId);
}

// Get socketId for a userId
async function getUserSocket(userId) {
  return await redis.hget('onlineUsers', userId);
}

// Remove user from online hash
async function setUserOffline(userId) {
  await redis.hdel('onlineUsers', userId);
}

// Find userId by socketId — used in disconnect
// Returns userId or null
async function getUserIdBySocket(socketId) {
  // HGETALL returns { userId: socketId, userId: socketId ... }
  const all = await redis.hgetall('onlineUsers');
  if (!all) return null;
  const entry = Object.entries(all).find(([, sId]) => sId === socketId);
  return entry ? entry[0] : null;
}

io.on("connection", async (socket) => {
  console.log("User connected:", socket.id);

  // REGISTER USER
  socket.on("register_user", async (userId) => {
    // ✅ Redis instead of Map
    await setUserOnline(userId, socket.id);
    console.log("Registered:", userId, "->", socket.id);
    await User.findByIdAndUpdate(userId, { lastSeen: null });
    io.emit("user_status_change", { userId, lastSeen: null });
  });

  // JOIN CONVERSATION
  socket.on("join_conversation", (conversationId) => {
    if (!conversationId) return console.log("No conversationId provided");
    socket.join(conversationId);
    console.log(`User ${socket.id} joined room: ${conversationId}`);
  });

  // GROUP CREATED
  socket.on("group_created", async (data) => {
    const { conversation, memberIds } = data;
    for (const memberId of memberIds) {
      // ✅ Redis instead of Map
      const memberSocketId = await getUserSocket(memberId);
      if (memberSocketId) {
        io.to(memberSocketId).emit("added_to_group", conversation);
      }
    }
  });

  // SEND INVITATION
  socket.on("send_invitation", async (data) => {
    const { receiverId, invitation } = data;
    // ✅ Redis instead of Map
    const receiverSocketId = await getUserSocket(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive_invitation", invitation);
    }
  });

  // ACCEPT INVITATION
  socket.on("accept_invitation", async (data) => {
    const { senderId, conversation } = data;
    // ✅ Redis instead of Map
    const senderSocketId = await getUserSocket(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("invitation_accepted", conversation);
    }
  });

  // REJECT INVITATION
  socket.on("reject_invitation", async (data) => {
    const { senderId } = data;
    // ✅ Redis instead of Map
    const senderSocketId = await getUserSocket(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("invitation_rejected");
    }
  });

  socket.on("typing", async ({ conversationId, senderId }) => {
  // Store in Redis with 3s TTL — auto clears when user stops
  await redis.setex(`typing:${conversationId}:${senderId}`, 3, '1');
  socket.to(conversationId).emit("user_typing", { senderId });
});

socket.on("stop_typing", async ({ conversationId, senderId }) => {
  await redis.del(`typing:${conversationId}:${senderId}`);
  socket.to(conversationId).emit("user_stop_typing", { senderId });
});

  // SEND MESSAGE
  socket.on("send_message", async (data) => {
    try {
      const { conversationId, text, senderId, receiverId, fileUrl, fileName, fileType, fileSize } = data;

      if (!conversationId || !senderId) return;

      // Session kick check
      const cookieHeader = socket.handshake.headers.cookie;
      const cookieToken = cookieHeader
        ?.split(';')
        ?.find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      const activeToken = await redis.get(`activeSession:${senderId}`);


      console.log("Cookie header:", socket.handshake.headers.cookie ? "EXISTS" : "MISSING");
console.log("Active token in Redis:", activeToken ? "EXISTS" : "MISSING");
      if (activeToken && cookieToken && activeToken !== cookieToken) {
        socket.emit("session_kicked");
        socket.disconnect();
        return;
      }

      // Rate limit check
      const { limited, ttl } = await isRateLimited(`msg:${senderId}`, 10, 10);
      if (limited) {
        socket.emit("rate_limited", {
          message: `Too many messages. Please wait ${ttl} seconds.`,
          ttl,
        });
        return;
      }

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

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
      });

      if (receiverId) {
        // ✅ Redis instead of Map
        const senderSocketId = await getUserSocket(senderId);
        const receiverSocketId = await getUserSocket(receiverId);
        if (senderSocketId) io.to(senderSocketId).emit("receive_message", message);
        if (receiverSocketId) io.to(receiverSocketId).emit("receive_message", message);
      } else {
        io.to(conversationId).emit("receive_message", message);
      }

      io.to(conversationId).emit("last_message_update", {
        conversationId,
        lastMessage: {
          text: message.text,
          fileType: message.fileType,
          createdAt: message.createdAt,
        },
      });

    } catch (err) {
      console.error("Message error:", err.message);
    }
  });

  // DISCONNECT
  socket.on("disconnect", async () => {
    const now = new Date();

    // ✅ Redis instead of Map — find userId by socketId
    const userId = await getUserIdBySocket(socket.id);

    if (userId) {
      await setUserOffline(userId);
      await User.findByIdAndUpdate(userId, { lastSeen: now });
      io.emit("user_status_change", { userId, lastSeen: now });
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