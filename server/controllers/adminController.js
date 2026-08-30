// ==========================================
// adminController.js
// ==========================================

import User from "../models/User.js";
import Subject from "../models/Subject.js";
import Knowledge from "../models/Knowledge.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Feedback from "../models/Feedback.js";

import {
  createEmbedding
} from "../services/embeddingService.js";

import {
  buildKnowledgeText
} from "../services/knowledgeTextService.js";


// ==========================================
// DASHBOARD STATISTICS
// ==========================================

export const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      totalSubjects,
      totalKnowledge,
      totalConversations,
      totalMessages,
      totalFeedback
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        role: "student"
      }),

      User.countDocuments({
        role: "admin"
      }),

      Subject.countDocuments({
        isActive: true
      }),

      Knowledge.countDocuments({
        isActive: true
      }),

      Conversation.countDocuments({
        isActive: true
      }),

      Message.countDocuments(),

      Feedback.countDocuments()
    ]);


    const ratingResult =
      await Feedback.aggregate([
        {
          $group: {
            _id: null,

            averageRating: {
              $avg: "$rating"
            }
          }
        }
      ]);


    const averageRating =
      ratingResult.length &&
      ratingResult[0].averageRating !== null
        ? Number(
            ratingResult[0].averageRating.toFixed(2)
          )
        : 0;


    res.status(200).json({
      success: true,

      stats: {
        totalUsers,
        totalStudents,
        totalAdmins,
        totalSubjects,
        totalKnowledge,
        totalConversations,
        totalMessages,
        totalFeedback,
        averageRating
      }
    });

  } catch (error) {

    console.error(
      "Admin dashboard error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load admin dashboard"
    });
  }
};


// ==========================================
// GET USERS
// ==========================================

export const getUsers = async (req, res) => {
  try {

    const users =
      await User.find()
        .select("-password")
        .sort({
          createdAt: -1
        })
        .lean();


    res.status(200).json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {

    console.error(
      "Get users error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch users"
    });
  }
};


// ==========================================
// UPDATE USER STATUS
// ==========================================

export const updateUserStatus = async (
  req,
  res
) => {
  try {

    const { userId } =
      req.params;

    const { isActive } =
      req.body;


    if (
      typeof isActive !==
      "boolean"
    ) {

      return res.status(400).json({
        success: false,
        message:
          "isActive must be true or false"
      });
    }


    const user =
      await User.findByIdAndUpdate(
        userId,
        {
          isActive
        },
        {
          new: true,
          runValidators: true
        }
      ).select("-password");


    if (!user) {

      return res.status(404).json({
        success: false,
        message:
          "User not found"
      });
    }


    res.status(200).json({
      success: true,
      message:
        "User status updated",
      user
    });

  } catch (error) {

    console.error(
      "Update user status error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update user status"
    });
  }
};


// ==========================================
// CREATE SUBJECT
// ==========================================

export const createSubject = async (
  req,
  res
) => {
  try {

    const {
      name,
      description,
      icon
    } = req.body;


    if (
      !name ||
      !description
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Name and description are required"
      });
    }


    const cleanName =
      name.trim();


    const existingSubject =
      await Subject.findOne({
        name: cleanName
      });


    if (existingSubject) {

      return res.status(409).json({
        success: false,
        message:
          "Subject already exists"
      });
    }


    const subject =
      await Subject.create({
        name: cleanName,

        description:
          description.trim(),

        icon:
          icon?.trim() ||
          "📚"
      });


    res.status(201).json({
      success: true,
      message:
        "Subject created successfully",
      subject
    });

  } catch (error) {

    console.error(
      "Create subject error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create subject"
    });
  }
};


// ==========================================
// UPDATE SUBJECT
// ==========================================

export const updateSubject = async (
  req,
  res
) => {
  try {

    const { id } =
      req.params;


    const {
      name,
      description,
      icon,
      isActive
    } = req.body;


    if (name !== undefined) {

      const duplicate =
        await Subject.findOne({
          name: name.trim(),
          _id: {
            $ne: id
          }
        });


      if (duplicate) {

        return res.status(409).json({
          success: false,
          message:
            "Another subject with this name already exists"
        });
      }
    }


    const updateData = {};


    if (name !== undefined) {
      updateData.name =
        name.trim();
    }


    if (
      description !==
      undefined
    ) {

      updateData.description =
        description.trim();
    }


    if (icon !== undefined) {
      updateData.icon =
        icon.trim();
    }


    if (
      isActive !==
      undefined
    ) {

      updateData.isActive =
        isActive;
    }


    const subject =
      await Subject.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true
        }
      );


    if (!subject) {

      return res.status(404).json({
        success: false,
        message:
          "Subject not found"
      });
    }


    res.status(200).json({
      success: true,
      message:
        "Subject updated successfully",
      subject
    });

  } catch (error) {

    console.error(
      "Update subject error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update subject"
    });
  }
};


// ==========================================
// DELETE SUBJECT
// ==========================================

export const deleteSubject = async (
  req,
  res
) => {
  try {

    const { id } =
      req.params;


    const subject =
      await Subject.findByIdAndUpdate(
        id,
        {
          isActive: false
        },
        {
          new: true
        }
      );


    if (!subject) {

      return res.status(404).json({
        success: false,
        message:
          "Subject not found"
      });
    }


    res.status(200).json({
      success: true,
      message:
        "Subject deactivated successfully"
    });

  } catch (error) {

    console.error(
      "Delete subject error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to delete subject"
    });
  }
};


// ==========================================
// CREATE KNOWLEDGE
// ==========================================

export const createKnowledge = async (
  req,
  res
) => {
  try {

    const {
      subject,
      title,
      question,
      answer,
      keywords,
      topic,
      difficulty,
      source
    } = req.body;


    // --------------------------------------
    // Validate required fields
    // --------------------------------------

    if (
      !subject ||
      !title ||
      !question ||
      !answer
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Subject, title, question and answer are required"
      });
    }


    // --------------------------------------
    // Validate subject
    // --------------------------------------

    const subjectExists =
      await Subject.findOne({
        _id: subject,
        isActive: true
      });


    if (!subjectExists) {

      return res.status(400).json({
        success: false,
        message:
          "Selected subject does not exist or is inactive"
      });
    }


    // --------------------------------------
    // Prepare knowledge data
    // --------------------------------------

    const knowledgeData = {
      subject,

      title:
        title.trim(),

      question:
        question.trim(),

      answer:
        answer.trim(),

      keywords:
        Array.isArray(keywords)
          ? keywords
              .map(
                (keyword) =>
                  String(keyword).trim()
              )
              .filter(Boolean)
          : [],

      topic:
        topic?.trim() || "",

      difficulty:
        difficulty || "beginner",

      source:
        source?.trim() ||
        "EduBot Knowledge Base",

      isActive: true
    };


    // --------------------------------------
    // Generate embedding
    // --------------------------------------

    console.log(
      "Generating embedding for new knowledge..."
    );


    const embedding =
      await createEmbedding(
        buildKnowledgeText(
          knowledgeData
        )
      );


    // --------------------------------------
    // Create MongoDB record
    // --------------------------------------

    const knowledge =
      await Knowledge.create({
        ...knowledgeData,
        embedding
      });


    // --------------------------------------
    // Populate subject
    // --------------------------------------

    const populated =
      await knowledge.populate(
        "subject",
        "name icon"
      );


    console.log(
      "Knowledge created with embedding:",
      knowledge._id
    );


    res.status(201).json({
      success: true,
      message:
        "Knowledge created successfully",
      knowledge: populated
    });

  } catch (error) {

    console.error(
      "Create knowledge error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create knowledge record"
    });
  }
};


// ==========================================
// UPDATE KNOWLEDGE
// ==========================================

export const updateKnowledge = async (
  req,
  res
) => {
  try {

    const { id } =
      req.params;


    // --------------------------------------
    // Find existing record
    // --------------------------------------

    const existingKnowledge =
      await Knowledge.findById(id);


    if (!existingKnowledge) {

      return res.status(404).json({
        success: false,
        message:
          "Knowledge not found"
      });
    }


    // --------------------------------------
    // Validate subject if changing
    // --------------------------------------

    if (
      req.body.subject !==
      undefined
    ) {

      const subjectExists =
        await Subject.findOne({
          _id:
            req.body.subject,

          isActive: true
        });


      if (!subjectExists) {

        return res.status(400).json({
          success: false,
          message:
            "Selected subject does not exist or is inactive"
        });
      }
    }


    // --------------------------------------
    // Build update data
    // --------------------------------------

    const updateData = {};


    if (
      req.body.subject !==
      undefined
    ) {

      updateData.subject =
        req.body.subject;
    }


    if (
      req.body.title !==
      undefined
    ) {

      updateData.title =
        req.body.title.trim();
    }


    if (
      req.body.question !==
      undefined
    ) {

      updateData.question =
        req.body.question.trim();
    }


    if (
      req.body.answer !==
      undefined
    ) {

      updateData.answer =
        req.body.answer.trim();
    }


    if (
      req.body.keywords !==
      undefined
    ) {

      updateData.keywords =
        Array.isArray(
          req.body.keywords
        )
          ? req.body.keywords
              .map(
                (keyword) =>
                  String(keyword).trim()
              )
              .filter(Boolean)
          : [];
    }


    if (
      req.body.topic !==
      undefined
    ) {

      updateData.topic =
        req.body.topic.trim();
    }


    if (
      req.body.difficulty !==
      undefined
    ) {

      updateData.difficulty =
        req.body.difficulty;
    }


    if (
      req.body.source !==
      undefined
    ) {

      updateData.source =
        req.body.source.trim();
    }


    if (
      req.body.isActive !==
      undefined
    ) {

      updateData.isActive =
        req.body.isActive;
    }


    // --------------------------------------
    // Determine if embedding is needed
    // --------------------------------------

    const searchableContentChanged =
      req.body.title !==
        undefined ||
      req.body.question !==
        undefined ||
      req.body.answer !==
        undefined ||
      req.body.keywords !==
        undefined ||
      req.body.topic !==
        undefined;


    if (
      searchableContentChanged
    ) {

      // Merge old + new values
      // for generating the new vector

      const mergedKnowledge = {
        ...existingKnowledge.toObject(),
        ...updateData
      };


      console.log(
        "Regenerating knowledge embedding..."
      );


      const embedding =
        await createEmbedding(
          buildKnowledgeText(
            mergedKnowledge
          )
        );


      updateData.embedding =
        embedding;
    }


    // --------------------------------------
    // Update record
    // --------------------------------------

    const knowledge =
      await Knowledge.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true
        }
      ).populate(
        "subject",
        "name icon"
      );


    if (!knowledge) {

      return res.status(404).json({
        success: false,
        message:
          "Knowledge not found"
      });
    }


    res.status(200).json({
      success: true,
      message:
        searchableContentChanged
          ? "Knowledge and embedding updated successfully"
          : "Knowledge updated successfully",

      knowledge
    });

  } catch (error) {

    console.error(
      "Update knowledge error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update knowledge"
    });
  }
};


// ==========================================
// DELETE KNOWLEDGE
// ==========================================

export const deleteKnowledge = async (
  req,
  res
) => {
  try {

    const { id } =
      req.params;


    const knowledge =
      await Knowledge.findByIdAndUpdate(
        id,
        {
          isActive: false
        },
        {
          new: true
        }
      );


    if (!knowledge) {

      return res.status(404).json({
        success: false,
        message:
          "Knowledge not found"
      });
    }


    res.status(200).json({
      success: true,
      message:
        "Knowledge deactivated successfully"
    });

  } catch (error) {

    console.error(
      "Delete knowledge error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to delete knowledge"
    });
  }
};


// ==========================================
// GET ALL FEEDBACK
// ==========================================

export const getAllFeedback = async (
  req,
  res
) => {
  try {

    const feedback =
      await Feedback.find()
        .populate(
          "user",
          "name email"
        )
        .populate(
          "message",
          "content createdAt"
        )
        .populate(
          "conversation",
          "title"
        )
        .sort({
          createdAt: -1
        })
        .lean();


    res.status(200).json({
      success: true,
      count: feedback.length,
      feedback
    });

  } catch (error) {

    console.error(
      "Get all feedback error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch feedback"
    });
  }
};