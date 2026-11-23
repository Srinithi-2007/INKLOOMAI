const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectToMongo } = require("./services/mongoConnection");
const { getGeminiDiagnostic } = require("./services/geminiService");

const authRoutes = require("./routes/auth");
const campaignRoutes = require("./routes/campaigns");
const assignmentRoutes = require("./routes/assignments");
const submissionRoutes = require("./routes/submissions");
const reviewRoutes = require("./routes/reviews");
const brandDnaRoutes = require("./routes/brandDna");
const fileRoutes = require("./routes/files");
const notificationRoutes = require("./routes/notifications");
const analyticsRoutes = require("./routes/analytics");

const app = express();
const PORT = process.env.PORT || 4000;
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.set("X-XSS-Protection", "1; mode=block");
  res.set("Cross-Origin-Opener-Policy", "same-origin");
  res.set("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// In-memory sliding-window rate limiter
function createRateLimiter({ windowMs, max, message }) {
  const store = new Map();
  // Periodically clean up expired entries
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of store.entries()) {
      if (now > entry.resetTime) store.delete(ip);
    }
  }, 60000);
  interval.unref?.();

  return (req, res, next) => {
    if (process.env.NODE_ENV === "test") return next();
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const record = store.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }
    store.set(ip, record);

    res.set("X-RateLimit-Limit", max);
    res.set("X-RateLimit-Remaining", Math.max(0, max - record.count));
    res.set("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return res.status(429).json({ error: message || "Too many requests. Please try again later." });
    }
    next();
  };
}

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

const aiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "AI analysis rate limit reached. Please try again later.",
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
      gemini: getGeminiDiagnostic(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("MongoDB health check failed:", error.message);
    res.status(503).json({
      status: "degraded",
      database: "disconnected",
      service: "inkloom-backend",
      gemini: getGeminiDiagnostic(),
      timestamp: new Date().toISOString(),
    });
  }
});

app.use("/api", (req, res, next) => {
  connectToMongo()
    .then(() => next())
    .catch((error) => {
      console.error("MongoDB request connection failed:", error.message);
      const isConfigMissing = !process.env.MONGODB_URI;
      const errorMsg = isConfigMissing
        ? "Database unavailable. Configure MONGODB_URI before using the API."
        : `Database connection failed (${error.message}). Check MongoDB Atlas Network Access (allow 0.0.0.0/0) and credentials.`;
      res.status(503).json({
        error: errorMsg,
      });
    });
});

// API routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/reviews/ai-review", aiLimiter);
app.use("/api/reviews", reviewRoutes);
app.use("/api/brand/dna", brandDnaRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

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