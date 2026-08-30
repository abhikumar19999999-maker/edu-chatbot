import Feedback from "../models/Feedback.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

// ==========================================
// CREATE / UPDATE FEEDBACK
// ==========================================

export const submitFeedback = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      messageId,
      rating,
      helpful,
      comment = ""
    } = req.body;

    // Validate message
    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: "Message ID is required"
      });
    }

    // Validate rating
    if (!rating || ![1, 2, 3, 4, 5].includes(Number(rating))) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Validate helpful
    if (typeof helpful !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Helpful must be true or false"
      });
    }

    // Find bot message
    const message = await Message.findOne({
      _id: messageId,
      sender: "bot"
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Bot message not found"
      });
    }

    // Verify conversation belongs to current user
    const conversation = await Conversation.findOne({
      _id: message.conversation,
      user: userId
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You cannot rate this message"
      });
    }

    // Create or update
    const feedback = await Feedback.findOneAndUpdate(
      {
        user: userId,
        message: messageId
      },
      {
        user: userId,
        message: messageId,
        conversation: message.conversation,
        rating: Number(rating),
        helpful,
        comment: comment.trim()
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback
    });
  } catch (error) {
    console.error("Submit feedback error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit feedback"
    });
  }
};

// ==========================================
// GET CURRENT USER FEEDBACK
// ==========================================

export const getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({
      user: req.user.userId
    })
      .populate("message", "content createdAt")
      .populate("conversation", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedback.length,
      feedback
    });
  } catch (error) {
    console.error("Get feedback error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch feedback"
    });
  }
};