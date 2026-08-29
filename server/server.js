import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import knowledgeRoutes from "./routes/knowledgeRoutes.js";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ES Module directory handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/knowledge", knowledgeRoutes);
// Serve frontend
app.use(express.static(path.join(__dirname, "../public")));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EduBot API is running",
    database: "MongoDB"
  });
});

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// 404 API handler
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`EduBot server running on port ${PORT}`);
});