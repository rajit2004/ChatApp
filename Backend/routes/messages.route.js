import express from "express";
const router = express.Router();
import { Message } from "../models/Messages.js";
import { protect } from "../middleware/auth.middleware.js";
import { uploadChatFile } from "../cloudinary.js";
import { uploadFile } from "../controllers/message.controller.js";
import { Conversation } from "../models/Conversation.js";

// ── Upload file ──
router.post("/upload", protect, uploadChatFile.single("file"), uploadFile);

// ── DELETE a single message ──
router.delete("/:id", protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (!message.sender.equals(req.user._id)) {
      return res.status(403).json({ error: "Not authorized" });
    }
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── CLEAR entire chat ──
router.delete("/clear/:conversationId", protect, async (req, res) => {
  try {
    await Message.deleteMany({ conversationId: req.params.conversationId });
    await Conversation.findByIdAndUpdate(req.params.conversationId, { lastMessage: null });
    res.json({ success: true, message: "Chat cleared" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;