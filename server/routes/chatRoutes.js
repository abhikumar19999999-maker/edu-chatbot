import express from "express";

import {
  sendMessage,
  getConversations,
  getConversation
} from "../controllers/chatController.js";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  validateBody
} from "../middleware/validationMiddleware.js";

import {
  chatSchema
} from "../validators/chatValidators.js";

import {
  chatLimiter
} from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
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

router.post(
  "/",
  chatLimiter,
  validateBody(chatSchema),
  sendMessage
);

export default router;