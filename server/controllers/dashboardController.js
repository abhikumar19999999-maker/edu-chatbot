import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Feedback from "../models/Feedback.js";


// ==========================================
// GET STUDENT DASHBOARD
// ==========================================

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    // ----------------------------------------
    // Get user's active conversations
    // ----------------------------------------

    const conversations = await Conversation.find({
      user: userId,
      isActive: true
    })
      .populate("subject", "name icon")
      .sort({ lastMessageAt: -1 })
      .lean();

    const conversationIds =
      conversations.map(
        (conversation) => conversation._id
      );


    // ----------------------------------------
    // Count user questions
    // ----------------------------------------

    const questionsAsked =
      await Message.countDocuments({
        conversation: {
          $in: conversationIds
        },
        sender: "user"
      });


    // ----------------------------------------
    // Count bot responses
    // ----------------------------------------

    const botResponses =
      await Message.countDocuments({
        conversation: {
          $in: conversationIds
        },
        sender: "bot"
      });


    // ----------------------------------------
    // Get feedback
    // ----------------------------------------

    const feedback =
      await Feedback.find({
        user: userId
      })
        .select("rating helpful")
        .lean();


    // ----------------------------------------
    // Feedback statistics
    // ----------------------------------------

    const helpfulAnswers =
      feedback.filter(
        (item) => item.helpful === true
      ).length;

    let averageRating = 0;

    if (feedback.length > 0) {
      const totalRating =
        feedback.reduce(
          (sum, item) =>
            sum + Number(item.rating || 0),
          0
        );

      averageRating =
        totalRating / feedback.length;
    }


    // ----------------------------------------
    // Subjects studied
    // ----------------------------------------

    const subjectMap = new Map();

    conversations.forEach(
      (conversation) => {

        if (
          conversation.subject &&
          conversation.subject._id
        ) {
          subjectMap.set(
            conversation.subject._id.toString(),
            {
              id: conversation.subject._id,
              name: conversation.subject.name,
              icon: conversation.subject.icon
            }
          );
        }

      }
    );

    const subjectsStudied =
      Array.from(subjectMap.values());


    // ----------------------------------------
    // Recent conversations
    // ----------------------------------------

    const recentConversations =
      conversations
        .slice(0, 5)
        .map((conversation) => ({
          id: conversation._id,
          title:
            conversation.title ||
            "New Conversation",
          subject:
            conversation.subject
              ? {
                  id: conversation.subject._id,
                  name: conversation.subject.name,
                  icon: conversation.subject.icon
                }
              : null,
          lastMessageAt:
            conversation.lastMessageAt
        }));


    // ----------------------------------------
    // Response
    // ----------------------------------------

    res.status(200).json({
      success: true,

      stats: {
        totalConversations:
          conversations.length,

        questionsAsked,

        botResponses,

        helpfulAnswers,

        averageRating:
          Number(averageRating.toFixed(2)),

        totalFeedback:
          feedback.length,

        subjectsStudied:
          subjectsStudied.length
      },

      subjects: subjectsStudied,

      recentConversations
    });

  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load dashboard"
    });
  }
};