import Knowledge from "../models/Knowledge.js";

import {
  searchKnowledge
} from "../services/retrievalService.js";

// Get knowledge by subject
export const getKnowledgeBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const knowledge = await Knowledge.find({
      subject: subjectId,
      isActive: true
    })
      .populate("subject", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: knowledge.length,
      knowledge
    });
  } catch (error) {
    console.error("Get knowledge error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch knowledge"
    });
  }
};

// Search knowledge
export const searchKnowledgeController = async (req, res) => {
  try {
    const {
      query,
      subjectId,
      limit = 5
    } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const results = await searchKnowledge({
      query,
      subjectId,
      limit: Number(limit)
    });

    res.status(200).json({
      success: true,
      query,
      count: results.length,
      results
    });
  } catch (error) {
    console.error("Knowledge search error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search knowledge base"
    });
  }
};