import express from "express";

import {
  submitFeedback,
  getMyFeedback
} from "../controllers/feedbackController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validationMiddleware.js";
import { feedbackSchema } from "../validators/feedbackValidators.js";
import { feedbackLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  feedbackLimiter,
  validateBody(feedbackSchema),
  submitFeedback
);

router.get("/mine", getMyFeedback);

export default router;
