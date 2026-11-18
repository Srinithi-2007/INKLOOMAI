require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectToMongo } = require("./services/mongoConnection");

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
app.get("/api/health", async (req, res) => {
  try {
    await connectToMongo();
    res.json({
      status: "ok",
      database: "connected",
      service: "inkloom-backend",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("MongoDB health check failed:", error.message);
    res.status(503).json({
      status: "degraded",
      database: "disconnected",
      service: "inkloom-backend",
      timestamp: new Date().toISOString(),
    });
  }
});

app.use("/api", (req, res, next) => {
  connectToMongo()
    .then(() => next())
    .catch((error) => {
      console.error("MongoDB request connection failed:", error.message);
      res.status(503).json({
        error: "Database unavailable. Configure MONGODB_URI before using the API.",
      });
    });
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

async function startLocalServer() {
  try {
    await connectToMongo();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
  startServer();
}

if (require.main === module && !process.env.VERCEL) {
  startLocalServer();
}

module.exports = app;