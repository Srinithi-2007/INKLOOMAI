const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const UPLOAD_DIR = path.resolve(__dirname, "..", "uploads");

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  return UPLOAD_DIR;
}

function sanitizeFilename(originalName) {
  if (typeof originalName !== "string") return "file.bin";
  const base = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.substring(0, 100) || "file.bin";
}

function generateStorageKey(originalName) {
  const safeName = sanitizeFilename(originalName);
  const randomSuffix = crypto.randomBytes(6).toString("hex");
  const timestamp = Date.now();
  return `${timestamp}-${randomSuffix}-${safeName}`;
}

function validateFile(file) {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.mimetype}. Allowed types: JPEG, PNG, WebP, GIF, PDF, TXT.`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the 10MB maximum limit. Received: ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
    };
  }
  return { valid: true };
}

function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET)
  );
}

function isS3Configured() {
  return !!(
    process.env.AWS_S3_BUCKET &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
}

function getStorageProvider() {
  const explicit = (process.env.STORAGE_PROVIDER || "").toLowerCase().trim();
  if (explicit === "cloudinary") return "cloudinary";
  if (explicit === "s3") return "s3";
  if (explicit === "local") return "local";

  if (isCloudinaryConfigured()) return "cloudinary";
  if (isS3Configured()) return "s3";
  return "local";
}

let cloudinaryConfigured = false;
function initCloudinary() {
  if (cloudinaryConfigured) return;
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
    cloudinaryConfigured = true;
  } else if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    cloudinaryConfigured = true;
  }
}

async function saveFileBuffer(buffer, originalName, mimeType) {
  const provider = getStorageProvider();

  // Cloudinary Cloud Provider Adapter
  if (provider === "cloudinary" && isCloudinaryConfigured()) {
    initCloudinary();
    const safeBase = sanitizeFilename(originalName).replace(/\.[^/.]+$/, "");
    const publicId = `inkloom_${Date.now()}_${crypto.randomBytes(4).toString("hex")}_${safeBase}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "inkloom_assets",
          public_id: publicId,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload failed:", error);
            return reject(new Error("Cloud storage upload failed: " + error.message));
          }
          const storageKey = `cld:${result.resource_type || "image"}:${result.public_id}`;
          resolve({
            storageKey,
            filePath: null,
            url: result.secure_url,
            provider: "cloudinary",
            size: result.bytes || buffer.length,
            mimeType,
            originalName,
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  // Fallback: Local disk storage
  ensureUploadDir();
  const storageKey = generateStorageKey(originalName);
  const filePath = path.join(UPLOAD_DIR, storageKey);
  await fs.promises.writeFile(filePath, buffer);
  return {
    storageKey,
    filePath,
    url: `/api/files/download/${storageKey}`,
    provider: "local",
    size: buffer.length,
    mimeType,
    originalName,
  };
}

function getFilePath(storageKey) {
  if (!storageKey || typeof storageKey !== "string") return null;
  if (storageKey.startsWith("cld:") || storageKey.startsWith("s3:")) return null;
  // Prevent directory traversal
  const safeKey = path.basename(storageKey);
  const targetPath = path.join(UPLOAD_DIR, safeKey);
  if (!fs.existsSync(targetPath)) return null;
  return targetPath;
}

async function deleteFile(storageKey) {
  if (!storageKey || typeof storageKey !== "string") return false;

  // Cloudinary deletion
  if (storageKey.startsWith("cld:")) {
    try {
      initCloudinary();
      const parts = storageKey.split(":");
      const resourceType = parts[1] || "image";
      const publicId = parts.slice(2).join(":");
      const res = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return res.result === "ok" || res.result === "not found";
    } catch (error) {
      console.error("Cloudinary delete failed:", error.message);
      return false;
    }
  }

  // Local file deletion
  const safeKey = path.basename(storageKey);
  const targetPath = path.join(UPLOAD_DIR, safeKey);
  try {
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
      return true;
    }
  } catch (error) {
    console.error("Failed to delete local file:", error.message);
  }
  return false;
}

function getProviderStatus() {
  const provider = getStorageProvider();
  const hasCloudinary = isCloudinaryConfigured();
  const hasS3 = isS3Configured();
  const isCloudConfigured =
    (provider === "cloudinary" && hasCloudinary) || (provider === "s3" && hasS3);

  const missingCloudinary = [];
  if (!process.env.CLOUDINARY_URL) {
    if (!process.env.CLOUDINARY_CLOUD_NAME) missingCloudinary.push("CLOUDINARY_CLOUD_NAME");
    if (!process.env.CLOUDINARY_API_KEY) missingCloudinary.push("CLOUDINARY_API_KEY");
    if (!process.env.CLOUDINARY_API_SECRET) missingCloudinary.push("CLOUDINARY_API_SECRET");
  }

  const missingS3 = [];
  if (!process.env.AWS_S3_BUCKET) missingS3.push("AWS_S3_BUCKET");
  if (!process.env.AWS_ACCESS_KEY_ID) missingS3.push("AWS_ACCESS_KEY_ID");
  if (!process.env.AWS_SECRET_ACCESS_KEY) missingS3.push("AWS_SECRET_ACCESS_KEY");

  return {
    provider,
    isCloudConfigured,
    activeProviderName: isCloudConfigured
      ? provider === "cloudinary"
        ? "Cloudinary Media Cloud Storage"
        : "AWS S3 Object Storage"
      : "Local Disk Storage (backend/uploads/)",
    missingCredentials: isCloudConfigured
      ? []
      : missingCloudinary.length > 0
        ? missingCloudinary
        : missingS3,
    uploadDir: UPLOAD_DIR,
  };
}

module.exports = {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  UPLOAD_DIR,
  ensureUploadDir,
  sanitizeFilename,
  generateStorageKey,
  validateFile,
  saveFileBuffer,
  getFilePath,
  deleteFile,
  getStorageProvider,
  isCloudinaryConfigured,
  isS3Configured,
  getProviderStatus,
};
