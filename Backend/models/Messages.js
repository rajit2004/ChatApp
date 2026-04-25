import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
 conversationId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Conversation",
  required: true,
},

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  text: String,

  fileUrl: String,

  status: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      delivered: { type: Boolean, default: false },
      seen: { type: Boolean, default: false },
    },
  ],

}, { timestamps: true });

export const Message = mongoose.model("Message", messageSchema);