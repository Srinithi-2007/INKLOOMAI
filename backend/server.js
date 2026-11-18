require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}

const authRoutes = require("./routes/auth");
const campaignRoutes = require("./routes/campaigns");
const assignmentRoutes = require("./routes/assignments");
const submissionRoutes = require("./routes/submissions");
const reviewRoutes = require("./routes/reviews");

const app = express();
const PORT = process.env.PORT || 4000;
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "degraded",
    database: databaseConnected ? "connected" : "disconnected",
    service: "inkloom-backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: "Database unavailable. Configure MONGODB_URI before using the API.",
    });
  }
  next();
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/reviews", reviewRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = Number.isInteger(err.status) ? err.status : 500;
  console.error("Request failed:", err.message);
  res.status(status).json({
    error:
      status === 400
        ? "Invalid JSON request"
        : status === 413
          ? "Request body is too large"
          : "Internal server error",
  });
});

function startServer() {
  app.listen(PORT, () => {
    console.log(`Inkloom backend running on http://localhost:${PORT}`);
  });
}

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not configured; database routes are unavailable.");
  startServer();
} else {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Connected to MongoDB");
      startServer();
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
      startServer();
    });
}

module.exports = app;