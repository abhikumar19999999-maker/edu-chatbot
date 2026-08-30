import rateLimit from "express-rate-limit";


// ==========================================
// GENERAL API LIMIT
// ==========================================

export const apiLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 300,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: {
      success: false,
      message:
        "Too many requests. Please try again later."
    }
  });


// ==========================================
// AUTH LIMIT
// ==========================================

export const authLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 20,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: {
      success: false,
      message:
        "Too many authentication attempts. Please try again later."
    }
  });


// ==========================================
// CHAT LIMIT
// ==========================================

export const chatLimiter =
  rateLimit({
    windowMs:
      60 * 1000,

    limit: 30,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: {
      success: false,
      message:
        "Chat rate limit exceeded. Please wait a moment."
    }
  });