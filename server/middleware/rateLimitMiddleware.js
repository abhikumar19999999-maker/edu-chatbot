import rateLimit from "express-rate-limit";

const commonOptions = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: false
};

// General API protection.
export const apiLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 200,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

// Authentication is deliberately stricter to slow credential stuffing
// and automated account creation.
export const authLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later."
  }
});

// AI requests can create external provider cost, so keep this limit tight.
export const chatLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 1000,
  limit: 10,
  message: {
    success: false,
    message: "Chat rate limit exceeded. Please wait a moment."
  }
});

// Feedback should not be usable as a spam endpoint.
export const feedbackLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: {
    success: false,
    message: "Too many feedback requests. Please try again later."
  }
});
