
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

dotenv.config();

const app = express();


app.use(cors({
  origin: "http://localhost:5174",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/invitations", invitationRoutes);



const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: "http://localhost:5174",
    credentials: true,
  },
});


const onlineUsers = new Map();

io.on("connection", async(socket) => {
  console.log("User connected:", socket.id);


   socket.on("register_user", async(userId) => {
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


  //  GROUP CREATED — notify all members
socket.on("group_created", (data) => {
  const { conversation, memberIds } = data;

  // emit to each member if they are online
  memberIds.forEach((memberId) => {
    const memberSocketId = onlineUsers.get(memberId);
    if (memberSocketId) {
      io.to(memberSocketId).emit("added_to_group", conversation);
    }
  });
});


  //  SEND INVITATION
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

//  ACCEPT INVITATION
socket.on("accept_invitation", (data) => {
  const { senderId, conversation } = data;

  // notify original sender that invite was accepted
  const senderSocketId = onlineUsers.get(senderId);
  if (senderSocketId) {
    io.to(senderSocketId).emit("invitation_accepted", conversation);
  }
});

//  REJECT INVITATION
socket.on("reject_invitation", (data) => {
  const { senderId } = data;

  // notify original sender that invite was rejected
  const senderSocketId = onlineUsers.get(senderId);
  if (senderSocketId) {
    io.to(senderSocketId).emit("invitation_rejected");
  }
});


  socket.on("send_message", async (data) => {
  try {
    const { conversationId, text, senderId, receiverId } = data;

    if (!conversationId || !senderId) {
      return console.log("Missing required fields");
    }

    const message = await Message.create({
      conversationId,
      sender: senderId,
      text,
    });

    if (receiverId) {
      //  private chat — emit to sender and receiver only
      const senderSocketId = onlineUsers.get(senderId);
      const receiverSocketId = onlineUsers.get(receiverId);
      if (senderSocketId) io.to(senderSocketId).emit("receive_message", message);
      if (receiverSocketId) io.to(receiverSocketId).emit("receive_message", message);
    } else {
      //  group chat — emit to everyone in the room
      io.to(conversationId).emit("receive_message", message);
    }

  } catch (err) {
    console.error("Message error:", err.message);
  }
});

  
  socket.on("disconnect", async() => {
    const now = new Date();
      for (const [userId, socketId] of onlineUsers.entries()) {

      if (socketId === socket.id) {
        onlineUsers.delete(userId);
           //mark as offline with timestamp
      await User.findByIdAndUpdate(userId, { lastSeen: now });

      // tell everyone this user went offline
      io.emit("user_status_change", { userId, lastSeen: now });
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DB connected");

    server.listen(5000, () => {
      console.log("Server running with socket.io on port 5000");
    });
  })
  .catch(err => console.log(err));

