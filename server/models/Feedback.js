import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
      unique: true
    },

    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },

    rating: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5]
    },

    helpful: {
      type: Boolean,
      required: true
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const Feedback = mongoose.model(
  "Feedback",
  feedbackSchema
);

export default Feedback;