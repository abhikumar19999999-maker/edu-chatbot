import Subject from "../models/Subject.js";

// Get all active subjects
export const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({
      isActive: true
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      subjects
    });
  } catch (error) {
    console.error("Get subjects error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subjects"
    });
  }
};

// Get single subject
export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject || !subject.isActive) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    res.status(200).json({
      success: true,
      subject
    });
  } catch (error) {
    console.error("Get subject error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subject"
    });
  }
};