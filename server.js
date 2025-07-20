// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./server/routes/auth");
const workoutRoutes = require("./server/routes/workouts");

const app = express();

// Environment configuration with fallbacks
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET environment variable is required");
  process.exit(1);
}

// CORS configuration based on environment
const corsOptions = {
  origin:
    NODE_ENV === "production"
      ? ALLOWED_ORIGINS // Restrict origins in production
      : true, // Allow all origins in development
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Log environment info (only in development)
if (NODE_ENV === "development") {
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(
    `🔒 JWT Secret: ${process.env.JWT_SECRET ? "Set ✓" : "Missing ✗"}`
  );
  console.log(`🌐 CORS Origins:`, ALLOWED_ORIGINS);
  console.log(
    `💾 Database Path: ${process.env.DB_PATH || "./workout_tracker.db"}`
  );
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: "1.0.0",
  });
});

// Production serving - serve React app
if (NODE_ENV === "production") {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, "frontend/dist")));

  // Handle all non-API routes by serving React app
  // This is more specific than app.get("*") and avoids the path-to-regexp issue
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
  });

  app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
  });

  app.get("/workout", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
  });

  app.get("/history", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
  });

  // Catch remaining routes (but not API routes)
  app.use((req, res, next) => {
    // If it's an API route, let it 404 normally
    if (req.path.startsWith("/api/")) {
      return next();
    }
    // Otherwise, serve React app
    res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
