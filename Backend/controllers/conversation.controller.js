import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Messages.js";
import redis from "../config/redis.js";
// GET /api/conversations/contacts
export const getContacts = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "username email profilePic")
      .populate("lastMessage", "text fileType createdAt");

    const contacts = conversations.map((conv) => {
      if (conv.type === "group") {
        return {
          conversationId: conv._id,
          isGroup: true,
          groupName: conv.groupInfo.name,
          groupAdmin: conv.groupInfo.admin,
          participants: conv.participants,
          lastMessage: conv.lastMessage || null,
        };
      }

      const other = conv.participants.find(
        (p) => p._id.toString() !== req.user._id.toString(),
      );
      return {
        conversationId: conv._id,
        isGroup: false,
        user: other,
        lastMessage: conv.lastMessage || null,
      };
    });

    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/conversations
export const getOrCreateConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      type: "private",
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: "private",
        participants: [senderId, receiverId],
      });
    }

    res.json({ conversation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/conversations/:conversationId/messages
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = 0;

    if (page === 1) {
      const cacheKey = `messages:${conversationId}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        const messages = JSON.parse(cached);
        return res.json({ messages, hasMore: true });
      }
    }

    const total = await Message.countDocuments({ conversationId });
    const messages = await Message.find({ conversationId })
      .populate("sender", "username profilePic")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "username" },
      })
      .sort({ createdAt: 1 }) //  newest first
      .skip((page - 1) * limit)
      .limit(limit)
      .then((msgs) => msgs.reverse()); //  reverse to show oldest first

    const hasMore = page * limit < total;

    //  Cache first page only
    if (page === 1) {
      try {
        const cacheKey = `messages:${conversationId}`;
        await redis.setex(cacheKey, 120, JSON.stringify(messages));
      } catch (redisErr) {
        console.error("❌ Cache failed:", redisErr.message);
      }
    }

    res.json({ messages, hasMore });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/conversations/group
export const createGroup = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    const adminId = req.user._id;

    if (!name || !memberIds || memberIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Group name and members are required" });
    }

    const participants = [adminId, ...memberIds];

    const conversation = await Conversation.create({
      type: "group",
      participants,
      groupInfo: {
        name,
        admin: adminId,
      },
    });

    const populated = await conversation.populate(
      "participants",
      "username email",
    );

    res.json({ conversation: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
