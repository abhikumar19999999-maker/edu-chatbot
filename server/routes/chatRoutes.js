import express from "express";

import {
  sendMessage,
  getConversations,
  getConversation
} from "../controllers/chatController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validationMiddleware.js";
import { chatSchema } from "../validators/chatValidators.js";
import { chatLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Every chat operation requires an authenticated user.
router.use(authMiddleware);

// The chat endpoint is defined once so the limiter cannot be bypassed.
router.post(
  "/",
  chatLimiter,
  validateBody(chatSchema),
  sendMessage
);

router.get(
  "/history",
  getConversations
);

router.get(
  "/:id",
  getConversation
);

export default router;
