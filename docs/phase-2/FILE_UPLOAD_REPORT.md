# INKLOOM AI — PERSISTENT FILE UPLOAD REPORT

**Feature:** Persistent File Uploads & Asset Management (Phase 2 Feature 2)  
**Author:** Senior Backend Architect & Storage Security Auditor  
**Status:** COMPLETE & VERIFIED (Zero Regressions)

---

## 1. Overview & Architecture

Persistent File Uploads provide secure, scalable multipart asset handling across brand campaigns and freelancer content workflows. Assets can be uploaded, indexed, associated with campaigns/assignments, retrieved, and deleted with granular role-based authorization.

The system utilizes an abstraction layer (`storageService.js`) with a local filesystem fallback (`backend/uploads/`) and direct compatibility with cloud object storage providers (e.g. S3, Cloudinary, Vercel Blob).

---

## 2. Data Model: `Asset.js`

```javascript
const assetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    storageKey: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true },
    url: { type: String, required: true, trim: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", index: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", index: true },
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Submission", index: true },
    category: {
      type: String,
      enum: ["brand_asset", "submission_attachment", "general"],
      default: "general",
      index: true,
    },
  },
  { timestamps: true }
);
```

---

## 3. Storage Service Security & Validation

`backend/services/storageService.js` enforces strict safety policies:
1. **Allowed MIME Types:** Strictly limited to safe web media and documents:
   - `image/jpeg`
   - `image/png`
   - `image/webp`
   - `image/gif`
   - `application/pdf`
   - `text/plain`
   Executable formats (`.exe`, `.sh`, `.bat`, `.js`, etc.) and unknown MIME types are rejected immediately with `400 Bad Request`.
2. **Size Limitation:** Capped at 10MB (`10 * 1024 * 1024` bytes). Payloads exceeding this threshold are rejected with `413 Payload Too Large` or `400 Bad Request`.
3. **Collision & Traversal Defense:** Filenames are sanitized and prepended with timestamps and cryptographic random hex tokens: `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safeName}`. Direct paths are never accepted from user input; `path.basename` is enforced to prevent directory traversal.

---

## 4. REST Endpoints (`backend/routes/files.js`)

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| `POST` | `/api/files/upload` | Authenticated | Ingests multipart file, validates type/size, creates MongoDB Asset |
| `GET` | `/api/files` | Authenticated | Lists accessible assets (role-filtered for Brands and Freelancers) |
| `GET` | `/api/files/:id` | Authenticated | Retrieves asset metadata after authorization check |
| `GET` | `/api/files/download/:storageKey` | Authenticated | Streams file binary with Content-Type and Disposition headers |
| `DELETE` | `/api/files/:id` | Owner / Brand Admin | Removes file from disk and deletes MongoDB Asset record |

---

## 5. Frontend Integration

In `frontend/app/freelancer/page.tsx`:
- Each assignment draft card includes an interactive **Attached Assets & Media** container.
- Creators can upload supporting files (images, PDF briefs, copy docs) via a styled "+ Attach File" picker.
- Uploaded assets display with filename, file size in KB, direct download preview, and instant delete button.
- State is synchronized automatically across draft saves and submissions.

---

## 6. Automated Integration Tests (`backend/test/fileUploads.test.js`)

All 8 automated integration tests pass:
- `POST /api/files/upload` rejects unauthenticated request with 401.
- `POST /api/files/upload` rejects unsupported MIME types with 400.
- `POST /api/files/upload` uploads image and persists metadata with 201.
- `GET /api/files` lists uploaded assets for Brand Admin.
- `GET /api/files/:id` returns asset details.
- `GET /api/files/download/:storageKey` serves the uploaded file binary with correct Content-Type.
- `DELETE /api/files/:id` prevents unauthorized user from deleting asset (403).
- `DELETE /api/files/:id` deletes asset successfully by owner and cleans storage disk.
