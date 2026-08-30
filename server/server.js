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

import {
  apiLimiter
} from "./middleware/rateLimitMiddleware.js";


// ==========================================
// APP
// ==========================================

const app = express();


// Don't expose Express
app.disable("x-powered-by");


// Required when running behind Render/reverse proxy
app.set("trust proxy", 1);


// ==========================================
// PORT
// ==========================================

const PORT =
  Number(process.env.PORT) || 5000;


// ==========================================
// ES MODULE PATHS
// ==========================================

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);


// ==========================================
// SECURITY HEADERS
// ==========================================

app.use(helmet());


// ==========================================
// CORS
// ==========================================

const clientUrl =
  process.env.CLIENT_URL?.trim();


app.use(
  cors({
    origin: clientUrl
      ? clientUrl
      : false,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]
  })
);


// ==========================================
// BODY PARSING
// ==========================================

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb"
  })
);


// ==========================================
// HEALTH CHECK
// ==========================================
// Keep health check outside the general
// API rate limiter so Render can always
// check application health.

app.get(
  "/api/health",
  (req, res) => {

    const dbState =
      mongoose.connection.readyState;

    const database =
      dbState === 1
        ? "connected"
        : "disconnected";

    const healthy =
      database === "connected";

    res.status(
      healthy ? 200 : 503
    ).json({
      success: healthy,

      service:
        "EduBot API",

      database,

      environment:
        process.env.NODE_ENV ||
        "development",

      uptime:
        Number(
          process.uptime().toFixed(2)
        ),

      timestamp:
        new Date().toISOString()
    });
  }
);


// ==========================================
// GLOBAL API RATE LIMIT
// ==========================================

app.use(
  "/api",
  apiLimiter
);


// ==========================================
// API ROUTES
// ==========================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/subjects",
  subjectRoutes
);

app.use(
  "/api/knowledge",
  knowledgeRoutes
);

app.use(
  "/api/chat",
  chatRoutes
);

app.use(
  "/api/feedback",
  feedbackRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);


// ==========================================
// STATIC FRONTEND
// ==========================================

app.use(
  express.static(
    path.join(
      __dirname,
      "../public"
    )
  )
);


// ==========================================
// ROOT ROUTE
// ==========================================

app.get(
  "/",
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        "../public/index.html"
      )
    );
  }
);


// ==========================================
// API 404
// ==========================================

app.use(
  "/api",
  (req, res) => {

    res.status(404).json({
      success: false,

      message:
        "API route not found",

      path:
        req.originalUrl
    });
  }
);


// ==========================================
// FRONTEND FALLBACK
// ==========================================

app.use(
  (req, res, next) => {

    if (
      req.method !== "GET" ||
      req.path.startsWith("/api") ||
      path.extname(req.path)
    ) {
      return next();
    }


    res.sendFile(
      path.join(
        __dirname,
        "../public/index.html"
      )
    );
  }
);


// ==========================================
// INVALID JSON ERROR
// ==========================================

app.use(
  (err, req, res, next) => {

    if (
      err instanceof SyntaxError &&
      err.status === 400 &&
      "body" in err
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Invalid JSON request body"
      });
    }

    next(err);
  }
);


// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(
  (err, req, res, next) => {

    console.error(
      "Unhandled server error:",
      err
    );


    if (res.headersSent) {
      return next(err);
    }


    const statusCode =
      Number(err.statusCode) || 500;


    res.status(
      statusCode
    ).json({

      success: false,

      message:
        statusCode >= 500
          ? "Internal server error"
          : err.message

    });
  }
);


// ==========================================
// SERVER REFERENCE
// ==========================================

let server;


// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

const shutdown = async (signal) => {

  console.log(
    `${signal} received. Shutting down...`
  );


  if (!server) {

    try {

      await mongoose.connection.close();

    } catch (error) {

      console.error(
        "MongoDB shutdown error:",
        error.message
      );
    }

    process.exit(0);
  }


  server.close(
    async (error) => {

      if (error) {

        console.error(
          "Server shutdown error:",
          error.message
        );

        process.exit(1);
      }


      try {

        await mongoose.connection.close();

        console.log(
          "MongoDB connection closed."
        );

        console.log(
          "EduBot server stopped."
        );

        process.exit(0);

      } catch (dbError) {

        console.error(
          "MongoDB shutdown error:",
          dbError.message
        );

        process.exit(1);
      }
    }
  );
};


// ==========================================
// START SERVER
// ==========================================

const startServer = async () => {

  try {

    console.log(
      "Starting EduBot server..."
    );


    // --------------------------------------
    // Validate important environment values
    // --------------------------------------

    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is not configured"
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET is not configured"
      );
    }


    // --------------------------------------
    // MongoDB
    // --------------------------------------

    await connectDB();


    // --------------------------------------
    // HTTP Server
    // --------------------------------------

    server =
      app.listen(
        PORT,
        () => {

          console.log(
            "===================================="
          );

          console.log(
            "        EduBot Server Started"
          );

          console.log(
            "===================================="
          );

          console.log(
            `Environment: ${
              process.env.NODE_ENV ||
              "development"
            }`
          );

          console.log(
            `Port: ${PORT}`
          );

          console.log(
            `Health: http://localhost:${PORT}/api/health`
          );

          console.log(
            "===================================="
          );
        }
      );


  } catch (error) {

    console.error(
      "===================================="
    );

    console.error(
      "EduBot startup failed:"
    );

    console.error(
      error.message
    );

    console.error(
      "===================================="
    );


    try {

      await mongoose.connection.close();

    } catch {
      // Ignore shutdown error
    }


    process.exit(1);
  }
};


// ==========================================
// PROCESS EVENTS
// ==========================================

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);


// ==========================================
// UNHANDLED ERRORS
// ==========================================

process.on(
  "unhandledRejection",
  (reason) => {

    console.error(
      "Unhandled Promise Rejection:",
      reason
    );
  }
);


process.on(
  "uncaughtException",
  (error) => {

    console.error(
      "Uncaught Exception:",
      error
    );

    shutdown(
      "UNCAUGHT_EXCEPTION"
    );
  }
);


// ==========================================
// START
// ==========================================

startServer();