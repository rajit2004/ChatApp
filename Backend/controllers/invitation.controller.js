import { Invitation } from "../models/Invitation.js";
import { Conversation } from "../models/Conversation.js";

// POST /api/invitations/send
export const sendInvitation = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    // check if already contacts 
    const existingConversation = await Conversation.findOne({
      type: "private",
      participants: { $all: [senderId, receiverId] },
    });
    if (existingConversation) {
      return res.status(400).json({ message: "Already contacts" });
    }

    // check 24hr cooldown after rejection
    const rejected = await Invitation.findOne({
      sender: senderId,
      receiver: receiverId,
      status: "rejected",
    });
    if (rejected) {
      const hoursSinceRejection =
        (Date.now() - new Date(rejected.rejectedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceRejection < 24) {
        const allowedAt = new Date(
      new Date(rejected.rejectedAt).getTime() + 24 * 60 * 60 * 1000
    );
        return res.status(400).json({
          message: `You can send another invite before ${Math.ceil(24 - hoursSinceRejection)} hours`,
          time:allowedAt,
        });
      }
    }

    // check if invite already pending
    const existing = await Invitation.findOne({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });
    if (existing) {
      return res.status(400).json({ message: "Invitation already sent" });
    }

    // create invitation
    const invitation = await Invitation.create({
      sender: senderId,
      receiver: receiverId,
    });

    const populated = await invitation.populate("sender", "username email");

    res.json({ invitation: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/invitations/accept
export const acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.body;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // update status
    invitation.status = "accepted";
    await invitation.save();

    // create conversation between both users
    const conversation = await Conversation.create({
      type: "private",
      participants: [invitation.sender, invitation.receiver],
    });

    const populated = await conversation.populate("participants", "username email");

    res.json({ conversation: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/invitations/reject
export const rejectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.body;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // update status + set rejectedAt for 24hr cooldown
    invitation.status = "rejected";
    invitation.rejectedAt = new Date();
    await invitation.save();

    res.json({ message: "Invitation rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/invitations/pending
export const getPendingInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({
      receiver: req.user._id,
      status: "pending",
    }).populate("sender", "username email");

    res.json({ invitations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/invitations/status/:receiverId
export const getInvitationStatus = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.params;

    // check if already contacts
    const conversation = await Conversation.findOne({
      type: "private",
      participants: { $all: [senderId, receiverId] },
    });
    if (conversation) {
      return res.json({ status: "contacts" });
    }

    // check invitation
    const invitation = await Invitation.findOne({
      sender: senderId,
      receiver: receiverId,
    });

    if (!invitation) return res.json({ status: "none" });
    return res.json({ status: invitation.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};