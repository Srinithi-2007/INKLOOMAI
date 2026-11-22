const test = require("node:test");
const assert = require("node:assert/strict");
const { startTestServer, stopTestServer, request } = require("./testHelper");
const User = require("../models/User");
const Asset = require("../models/Asset");
const storageService = require("../services/storageService");

const testRunId = Date.now();
const brandEmail = `brand_file_${testRunId}@example.com`;
const freelancerEmail = `free_file_${testRunId}@example.com`;

let brandCookie = "";
let freelancerCookie = "";
let brandUserId = "";
let freelancerUserId = "";
let uploadedAssetId = "";
let uploadedStorageKey = "";

function createMultipartBody({ fieldName = "file", filename = "sample.png", contentType = "image/png", content = "PNG_MOCK_DATA", fields = {} }) {
  const boundary = "----TestBoundary" + Math.random().toString(36).substring(2);
  const chunks = [];
  for (const [k, v] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  chunks.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`
    )
  );
  chunks.push(Buffer.isBuffer(content) ? content : Buffer.from(content));
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  return {
    buffer: Buffer.concat(chunks),
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
  };
}

test.before(async () => {
  await startTestServer();

  const bRes = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Brand File Admin",
      email: brandEmail,
      password: "Password123!",
      role: "brand",
      brandName: "Acme Media",
    },
  });
  brandCookie = bRes.cookie;
  brandUserId = bRes.body.user.id;

  const fRes = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Freelancer Creator",
      email: freelancerEmail,
      password: "Password123!",
      role: "freelancer",
    },
  });
  freelancerCookie = fRes.cookie;
  freelancerUserId = fRes.body.user.id;
});

test.after(async () => {
  await User.deleteMany({ email: { $in: [brandEmail, freelancerEmail] } });
  if (uploadedStorageKey) {
    await storageService.deleteFile(uploadedStorageKey);
  }
  await Asset.deleteMany({ ownerId: { $in: [brandUserId, freelancerUserId] } });
  await stopTestServer();
});

test("POST /api/files/upload rejects unauthenticated request with 401", async () => {
  const multipart = createMultipartBody({});
  const res = await request({
    method: "POST",
    path: "/api/files/upload",
    headers: multipart.headers,
    body: multipart.buffer,
  });
  assert.equal(res.status, 401);
});

test("POST /api/files/upload rejects unsupported MIME types with 400", async () => {
  const multipart = createMultipartBody({
    filename: "script.exe",
    contentType: "application/x-msdownload",
    content: "MZ_EXE_HEADER",
  });
  const res = await request({
    method: "POST",
    path: "/api/files/upload",
    cookie: brandCookie,
    headers: multipart.headers,
    body: multipart.buffer,
  });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /Unsupported file type/);
});

test("POST /api/files/upload successfully uploads image and persists metadata", async () => {
  const fileContent = "MOCK_PNG_DATA_PAYLOAD";
  const multipart = createMultipartBody({
    filename: "brand-logo.png",
    contentType: "image/png",
    content: fileContent,
    fields: {
      category: "brand_asset",
      name: "Acme Master Brand Logo",
    },
  });

  const res = await request({
    method: "POST",
    path: "/api/files/upload",
    cookie: brandCookie,
    headers: multipart.headers,
    body: multipart.buffer,
  });

  assert.equal(res.status, 201);
  assert.ok(res.body.asset);
  assert.equal(res.body.asset.originalName, "brand-logo.png");
  assert.equal(res.body.asset.name, "Acme Master Brand Logo");
  assert.equal(res.body.asset.mimeType, "image/png");
  assert.equal(res.body.asset.category, "brand_asset");
  assert.equal(res.body.asset.ownerId, brandUserId);

  uploadedAssetId = res.body.asset.id;
  uploadedStorageKey = res.body.asset.storageKey;
});

test("GET /api/files lists uploaded assets for brand admin", async () => {
  const res = await request({
    method: "GET",
    path: "/api/files",
    cookie: brandCookie,
  });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.assets));
  assert.ok(res.body.assets.some((a) => a.id === uploadedAssetId));
});

test("GET /api/files/:id returns asset details", async () => {
  const res = await request({
    method: "GET",
    path: `/api/files/${uploadedAssetId}`,
    cookie: brandCookie,
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.asset.id, uploadedAssetId);
  assert.equal(res.body.asset.name, "Acme Master Brand Logo");
});

test("GET /api/files/download/:storageKey serves the uploaded file binary", async () => {
  const res = await request({
    method: "GET",
    path: `/api/files/download/${uploadedStorageKey}`,
    cookie: brandCookie,
  });
  assert.equal(res.status, 200);
  assert.equal(res.headers["content-type"], "image/png");
});

test("DELETE /api/files/:id prevents unauthorized user from deleting asset", async () => {
  const res = await request({
    method: "DELETE",
    path: `/api/files/${uploadedAssetId}`,
    cookie: freelancerCookie,
  });
  assert.equal(res.status, 403);
});

test("DELETE /api/files/:id deletes asset successfully by owner", async () => {
  const res = await request({
    method: "DELETE",
    path: `/api/files/${uploadedAssetId}`,
    cookie: brandCookie,
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  // Verify deletion from DB
  const verifyDb = await Asset.findById(uploadedAssetId);
  assert.equal(verifyDb, null);

  // Verify file removed from storage
  const filePath = storageService.getFilePath(uploadedStorageKey);
  assert.equal(filePath, null);
});
