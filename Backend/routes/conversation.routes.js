import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getContacts,
  getOrCreateConversation,
  getMessages,
  createGroup,
} from "../controllers/conversation.controller.js";





const router = express.Router();

router.get("/contacts", protect, getContacts);
router.post("/", protect, getOrCreateConversation);
router.get("/:conversationId/messages", protect, getMessages);
router.post("/group", protect, createGroup);

export default router;