import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      unique: true,
      trim: true,
      maxlength: 100
    },

    description: {
      type: String,
      required: [true, "Subject description is required"],
      trim: true,
      maxlength: 500
    },

    icon: {
      type: String,
      default: "📚"
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

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;