const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendWelcomeEmail, sendLoginNotificationEmail } = require("../services/emailService");

function getJwtSecret() {
  let secret = process.env.JWT_SECRET;
  if (secret) {
    secret = secret.trim();
    if (
      (secret.startsWith('"') && secret.endsWith('"')) ||
      (secret.startsWith("'") && secret.endsWith("'"))
    ) {
      secret = secret.slice(1, -1).trim();
    }
  }
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

function getCookieOptions(isProduction = process.env.NODE_ENV === "production") {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  };
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

// Auth middleware - extracts user from JWT
function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Role-based middleware
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Role ${role} required` });
    }
    next();
  };
}

router.use((req, res, next) => {
  try {
    getJwtSecret();
    next();
  } catch (err) {
    console.error("Authentication configuration check failed:", err.message);
    res.status(503).json({ error: "Authentication is not configured." });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, role, orgName, brandName, industry, website, size, about, specialization, portfolio, bio } = req.body;

    if (
      typeof fullName !== "string" ||
      fullName.trim().length < 2 ||
      fullName.trim().length > 120 ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      email.length > 254 ||
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72 ||
      !role
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["brand", "freelancer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const user = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      role,
      isVerified: true,
      orgName, brandName, industry, website, size, about,
      specialization, portfolio, bio,
    });

    await user.save();

    const token = generateToken(user);
    res.cookie("token", token, {
      ...getCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Trigger welcome email asynchronously without blocking registration response
    sendWelcomeEmail(user).catch((err) => {
      console.error("Welcome email delivery notice:", err.message);
    });

    res.status(201).json({
      success: true,
      user: user.toPublicJSON(),
      message: "Account created successfully",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already registered" });
    }
    console.error("Registration failed:", err.message);
    res.status(500).json({ error: "Could not create account" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (typeof email !== "string" || typeof password !== "string" || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (role && !["brand", "freelancer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    if (role && user.role !== role) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);
    res.cookie("token", token, {
      ...getCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Trigger login notification email asynchronously without blocking login response
    const loginMetadata = {
      timestamp: new Date().toISOString(),
      userAgent: req.headers["user-agent"] || "unknown",
      ip: req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown",
    };
    sendLoginNotificationEmail(user, loginMetadata).catch((err) => {
      console.error("Login notification email delivery notice:", err.message);
    });

    res.json({
      success: true,
      user: user.toPublicJSON(),
      message: "Login successful",
    });
  } catch (err) {
    console.error("Login failed:", err.message);
    res.status(500).json({ error: "Could not sign in" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", getCookieOptions());
  res.json({ success: true, message: "Logged out" });
});

// GET /api/auth/me - get current user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/me - update user profile / Brand DNA (authenticated)
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const {
      fullName,
      orgName,
      brandName,
      industry,
      website,
      size,
      about,
      specialization,
      portfolio,
      bio,
    } = req.body || {};

    if (fullName !== undefined) {
      if (typeof fullName !== "string" || fullName.trim().length < 2 || fullName.trim().length > 120) {
        return res.status(400).json({ error: "Full name must be between 2 and 120 characters" });
      }
      user.fullName = fullName.trim();
    }

    if (user.role === "brand") {
      if (orgName !== undefined) user.orgName = typeof orgName === "string" ? orgName.trim() : "";
      if (brandName !== undefined) user.brandName = typeof brandName === "string" ? brandName.trim() : "";
      if (industry !== undefined) user.industry = typeof industry === "string" ? industry.trim() : "";
      if (website !== undefined) user.website = typeof website === "string" ? website.trim() : "";
      if (size !== undefined) user.size = typeof size === "string" ? size.trim() : "";
      if (about !== undefined) user.about = typeof about === "string" ? about.trim() : "";
    } else if (user.role === "freelancer") {
      if (specialization !== undefined) user.specialization = typeof specialization === "string" ? specialization.trim() : "";
      if (portfolio !== undefined) user.portfolio = typeof portfolio === "string" ? portfolio.trim() : "";
      if (bio !== undefined) user.bio = typeof bio === "string" ? bio.trim() : "";
    }

    await user.save();
    res.json({
      success: true,
      user: user.toPublicJSON(),
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("Profile update failed:", err.message);
    res.status(500).json({ error: "Could not update profile" });
  }
});

// GET /api/auth/users - list users (for brand to see freelancers)
router.get("/users", authMiddleware, requireRole("brand"), async (req, res) => {
  try {
    const users = await User.find({ role: "freelancer" }).select("-password").sort({ createdAt: -1 });
    res.json({ users: users.map((user) => user.toPublicJSON()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
module.exports.requireRole = requireRole;
module.exports.generateToken = generateToken;
module.exports.getCookieOptions = getCookieOptions;
module.exports.getJwtSecret = getJwtSecret;