import express from "express";

import {
  submitFeedback,
  getMyFeedback
} from "../controllers/feedbackController.js";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  validateBody
} from "../middleware/validationMiddleware.js";

import {
  feedbackSchema
} from "../validators/feedbackValidators.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  validateBody(feedbackSchema),
  submitFeedback
);

router.get(
  "/mine",
  getMyFeedback
);

export default router;