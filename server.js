const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./server/routes/auth");
const workoutRoutes = require("./server/routes/workouts");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Production serving - serve React app
if (process.env.NODE_ENV === "production") {
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
  console.log(`Server running on port ${PORT}`);
});
