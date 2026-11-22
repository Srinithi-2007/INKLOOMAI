const test = require("node:test");
const assert = require("node:assert/strict");
const { startTestServer, stopTestServer, request } = require("./testHelper");
const storageService = require("../services/storageService");
const notificationService = require("../services/notificationService");
const User = require("../models/User");

const testRunId = Date.now();
const testEmail = `infra_admin_${testRunId}@example.com`;
let testCookie = "";
let testUserId = "";

test.before(async () => {
  await startTestServer();

  const regRes = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Infrastructure Auditor",
      email: testEmail,
      password: "Password123!",
      role: "brand",
      brandName: "Infra Test Corp",
    },
  });
  testCookie = regRes.cookie;
  testUserId = regRes.body.user.id;
});

test.after(async () => {
  await User.deleteMany({ email: testEmail });
  await stopTestServer();
});

// =============================================================================
// STORAGE ADAPTER TESTS
// =============================================================================

test("StorageAdapter: getStorageProvider defaults to local when cloud credentials are unconfigured", () => {
  const provider = storageService.getStorageProvider();
  assert.ok(["local", "cloudinary", "s3"].includes(provider));
  if (!process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_CLOUD_NAME) {
    assert.equal(provider, "local");
  }
});

test("StorageAdapter: getProviderStatus reports accurate cloud readiness and missing keys", () => {
  const status = storageService.getProviderStatus();
  assert.ok(status);
  assert.equal(typeof status.isCloudConfigured, "boolean");
  assert.ok(Array.isArray(status.missingCredentials));
  assert.ok(status.uploadDir);

  if (!status.isCloudConfigured) {
    assert.equal(status.provider, "local");
    assert.match(status.activeProviderName, /Local Disk/);
  }
});

test("StorageAdapter: getFilePath correctly returns null for cloud asset storageKeys", () => {
  const localKey = "1795337863599-7c85c72d3d52-sample.png";
  const cloudKey = "cld:image:inkloom_assets/sample_asset";

  // Cloud key must never be resolved to a local disk path
  assert.equal(storageService.getFilePath(cloudKey), null);
  assert.equal(storageService.getFilePath("s3:bucket:key"), null);
});

test("StorageAdapter: local fallback preserves save, download, and deletion lifecycle", async () => {
  const sampleBuffer = Buffer.from("SAMPLE_ADAPTER_VERIFICATION_PAYLOAD_" + Date.now());
  const saved = await storageService.saveFileBuffer(sampleBuffer, "adapter-test.png", "image/png");

  assert.ok(saved);
  assert.ok(saved.storageKey);
  assert.equal(saved.mimeType, "image/png");
  assert.equal(saved.size, sampleBuffer.length);

  // If local provider is active, filePath must exist
  if (saved.provider === "local") {
    assert.ok(saved.filePath);
    const resolvedPath = storageService.getFilePath(saved.storageKey);
    assert.equal(resolvedPath, saved.filePath);

    // Delete file
    const deleted = await storageService.deleteFile(saved.storageKey);
    assert.equal(deleted, true);
    assert.equal(storageService.getFilePath(saved.storageKey), null);
  }
});

test("GET /api/files/provider-status enforces authentication and returns provider metadata", async () => {
  const unauthRes = await request({
    method: "GET",
    path: "/api/files/provider-status",
  });
  assert.equal(unauthRes.status, 401);

  const authRes = await request({
    method: "GET",
    path: "/api/files/provider-status",
    cookie: testCookie,
  });
  assert.equal(authRes.status, 200);
  assert.ok(authRes.body);
  assert.equal(typeof authRes.body.isCloudConfigured, "boolean");
  assert.ok(authRes.body.provider);
});

// =============================================================================
// NOTIFICATION ADAPTER TESTS
// =============================================================================

test("NotificationAdapter: getNotificationProvider returns local-sse or pusher based on config", () => {
  const provider = notificationService.getNotificationProvider();
  assert.ok(["local-sse", "pusher"].includes(provider));
  if (!process.env.PUSHER_APP_ID) {
    assert.equal(provider, "local-sse");
  }
});

test("NotificationAdapter: getProviderStatus reports serverless external readiness accurately", () => {
  const status = notificationService.getProviderStatus();
  assert.ok(status);
  assert.equal(typeof status.isExternalConfigured, "boolean");
  assert.ok(Array.isArray(status.missingCredentials));
  assert.equal(typeof status.connectedLocalClients, "number");

  if (!status.isExternalConfigured) {
    assert.equal(status.provider, "local-sse");
    assert.match(status.activeProviderName, /Local In-Memory SSE Pool/);
    assert.ok(status.missingCredentials.includes("PUSHER_APP_ID"));
  }
});

test("NotificationAdapter: dispatchToExternal safely handles unconfigured Pusher without throwing", async () => {
  const result = await notificationService.dispatchToExternal("test_user_42", "test_event", { foo: "bar" });
  assert.ok(result);
  if (!notificationService.isPusherConfigured()) {
    assert.equal(result.dispatched, false);
    assert.match(result.reason, /not configured/);
  } else {
    assert.equal(result.dispatched, true);
  }
});

test("NotificationAdapter: sendToUser seamlessly delivers to active SSE clients and returns count", () => {
  let streamMessage = "";
  const mockResponse = {
    writableEnded: false,
    write: (msg) => {
      streamMessage += msg;
      return true;
    },
  };

  notificationService.addClient(testUserId, mockResponse);
  assert.ok(notificationService.getConnectedClientCount(testUserId) >= 1);

  const sent = notificationService.sendToUser(testUserId, "ping_event", { alive: true });
  assert.ok(sent >= 1);
  assert.match(streamMessage, /event: ping_event/);
  assert.match(streamMessage, /"alive":true/);

  notificationService.removeClient(testUserId, mockResponse);
  assert.equal(notificationService.getConnectedClientCount(testUserId), 0);
});

test("GET /api/notifications/provider-status enforces authentication and returns event provider metadata", async () => {
  const unauthRes = await request({
    method: "GET",
    path: "/api/notifications/provider-status",
  });
  assert.equal(unauthRes.status, 401);

  const authRes = await request({
    method: "GET",
    path: "/api/notifications/provider-status",
    cookie: testCookie,
  });
  assert.equal(authRes.status, 200);
  assert.ok(authRes.body);
  assert.equal(typeof authRes.body.isExternalConfigured, "boolean");
  assert.ok(authRes.body.provider);
});
