import express from "express";

import {
  registerUser,
  loginUser
} from "../controllers/authController.js";

import {
  validateBody
} from "../middleware/validationMiddleware.js";

import {
  registerSchema,
  loginSchema
} from "../validators/authValidators.js";

import {
  authLimiter
} from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  registerUser
);

router.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  loginUser
);

router.post(
  "/register",
  validateBody(registerSchema),
  registerUser
);

router.post(
  "/login",
  validateBody(loginSchema),
  loginUser
);

export default router;