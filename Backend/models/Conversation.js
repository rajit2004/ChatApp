import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["private", "group"],
      default: "private",
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    groupInfo: {
      name: String,
      admin: mongoose.Schema.Types.ObjectId,
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

conversationSchema.index(
  {type:1,participants:1},
  {unique:false}
)

export const Conversation = mongoose.model(
  "Conversation",
  conversationSchema
);