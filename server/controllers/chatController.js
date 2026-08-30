import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

import {
  processChatMessage
} from "../services/chatbotService.js";

// =====================================
// SEND MESSAGE
// =====================================
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      message,
      conversationId,
      subjectId
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    const result = await processChatMessage({
      userId,
      conversationId,
      message,
      subjectId
    });

    res.status(200).json({
      success: true,
      message: result.answer,
      conversation: {
        id: result.conversation._id,
        title: result.conversation.title,
        subject: result.conversation.subject
      },
      messageData: {
        user: result.userMessage,
        bot: result.botMessage
      },
      analysis: {
        intent: result.intent,
        retrievalScore: result.retrievalScore,
        source: result.source
      }
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process chatbot message"
    });
  }
};

// =====================================
// GET USER CONVERSATIONS
// =====================================
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      user: req.user.userId,
      isActive: true
    })
      .populate("subject", "name icon")
      .sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations"
    });
  }
};

// =====================================
// GET SINGLE CONVERSATION
// =====================================
export const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user.userId,
      isActive: true
    }).populate("subject", "name icon");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found"
      });
    }

    const messages = await Message.find({
      conversation: conversation._id
    })
      .populate("subject", "name")
      .populate("sourceKnowledge", "title topic")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      conversation,
      messages
    });
  } catch (error) {
    console.error("Get conversation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch conversation"
    });
  }
};