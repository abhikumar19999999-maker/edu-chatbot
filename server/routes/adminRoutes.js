import express from "express";

import {
  getAdminDashboard,
  getUsers,
  updateUserStatus,
  createSubject,
  updateSubject,
  deleteSubject,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  getAllFeedback
} from "../controllers/adminController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();


// All admin routes require authentication
router.use(authMiddleware);

// All admin routes require admin role
router.use(adminMiddleware);


// Dashboard
router.get(
  "/dashboard",
  getAdminDashboard
);


// Users
router.get(
  "/users",
  getUsers
);

router.patch(
  "/users/:userId/status",
  updateUserStatus
);


// Subjects
router.post(
  "/subjects",
  createSubject
);

router.patch(
  "/subjects/:id",
  updateSubject
);

router.delete(
  "/subjects/:id",
  deleteSubject
);


// Knowledge
router.post(
  "/knowledge",
  createKnowledge
);

router.patch(
  "/knowledge/:id",
  updateKnowledge
);

router.delete(
  "/knowledge/:id",
  deleteKnowledge
);


// Feedback
router.get(
  "/feedback",
  getAllFeedback
);


export default router;