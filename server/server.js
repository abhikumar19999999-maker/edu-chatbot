// ==========================================
// EduBot Server
// ==========================================

import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/database.js";

import authRoutes from "./routes/authRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import knowledgeRoutes from "./routes/knowledgeRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import { apiLimiter } from "./middleware/rateLimitMiddleware.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

const PORT = Number(process.env.PORT) || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security headers.
app.use(helmet());

// Only the configured frontend origin may call the API from a browser.
const clientUrl = process.env.CLIENT_URL?.trim();

app.use(cors({
  origin: clientUrl || false,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false
}));

// Keep request bodies bounded to reduce memory/DoS abuse.
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: false, limit: "256kb" }));

// Minimal public health response. Do not disclose DB state or environment.
app.get("/api/health", (req, res) => {
  const healthy = mongoose.connection.readyState === 1;

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    service: "EduBot API"
  });
});

app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);

app.use(express.static(path.join(__dirname, "../public"), {
  index: false,
  dotfiles: "deny"
}));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  });
});

app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api") || path.extname(req.path)) {
    return next();
  }

  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Invalid JSON and all unexpected errors get safe client responses.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body"
    });
  }

  console.error("Unhandled server error:", err);

  if (res.headersSent) return next(err);

  const statusCode = Number(err.statusCode) || 500;

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? "Internal server error" : err.message
  });
});

let server;

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down...`);

  const closeDatabase = async () => {
    try {
      await mongoose.connection.close();
    } catch (error) {
      console.error("MongoDB shutdown error:", error.message);
    }
  };

  if (!server) {
    await closeDatabase();
    process.exit(0);
  }

  server.close(async (error) => {
    if (error) {
      console.error("Server shutdown error:", error.message);
      process.exit(1);
    }

    await closeDatabase();
    process.exit(0);
  });
};

const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be configured with at least 32 characters");
    }

    if (!clientUrl && process.env.NODE_ENV === "production") {
      throw new Error("CLIENT_URL is required in production");
    }

    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`EduBot server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("EduBot startup failed:", error.message);

    try {
      await mongoose.connection.close();
    } catch {}

    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  shutdown("UNCAUGHT_EXCEPTION");
});

startServer();
