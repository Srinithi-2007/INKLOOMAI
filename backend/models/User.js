const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["brand", "freelancer"], required: true },
    isVerified: { type: Boolean, default: false },

    // Brand-specific fields
    orgName: { type: String, trim: true },
    brandName: { type: String, trim: true },
    industry: { type: String, trim: true },
    website: { type: String, trim: true },
    size: { type: String, trim: true },
    about: { type: String, trim: true },

    // Brand DNA fields
    brandVoice: { type: String, trim: true, default: "" },
    corePillars: { type: [String], default: [] },
    preferredTerms: { type: [String], default: [] },
    bannedTerms: { type: [String], default: [] },
    approvedClaims: { type: [String], default: [] },
    visualGuidelines: { type: String, trim: true, default: "" },
    platformRules: { type: Object, default: {} },
    additionalRules: { type: [String], default: [] },

    // Freelancer-specific fields
    specialization: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    bio: { type: String, trim: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  const {
    _id,
    fullName,
    email,
    role,
    isVerified,
    orgName,
    brandName,
    industry,
    website,
    size,
    about,
    specialization,
    portfolio,
    bio,
    brandVoice,
    corePillars,
    preferredTerms,
    bannedTerms,
    approvedClaims,
    visualGuidelines,
    platformRules,
    additionalRules,
    createdAt,
  } = this;
  return {
    id: _id.toString(),
    fullName,
    email,
    role,
    isVerified,
    orgName,
    brandName,
    industry,
    website,
    size,
    about,
    brandVoice: brandVoice || "",
    corePillars: Array.isArray(corePillars) ? corePillars : [],
    preferredTerms: Array.isArray(preferredTerms) ? preferredTerms : [],
    bannedTerms: Array.isArray(bannedTerms) ? bannedTerms : [],
    approvedClaims: Array.isArray(approvedClaims) ? approvedClaims : [],
    visualGuidelines: visualGuidelines || "",
    platformRules: platformRules || {},
    additionalRules: Array.isArray(additionalRules) ? additionalRules : [],
    specialization,
    portfolio,
    bio,
    createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);