import mongoose from "mongoose";

const knowledgeSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"]
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200
    },

    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      maxlength: 500
    },

    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true
    },

    keywords: {
      type: [String],
      default: []
    },

    topic: {
      type: String,
      trim: true,
      default: ""
    },

    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    },

    source: {
      type: String,
      default: "EduBot Knowledge Base"
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Knowledge = mongoose.model("Knowledge", knowledgeSchema);

export default Knowledge;