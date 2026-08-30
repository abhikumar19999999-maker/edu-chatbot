import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },

    sender: {
      type: String,
      enum: ["user", "bot"],
      required: true
    },

    content: {
      type: String,
      required: true,
      trim: true
    },

    intent: {
      type: String,
      default: "general"
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null
    },

    sourceKnowledge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Knowledge",
      default: null
    },

    retrievalScore: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Message = mongoose.model(
  "Message",
  messageSchema
);

export default Message;