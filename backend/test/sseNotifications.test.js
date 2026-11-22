const test = require("node:test");
const assert = require("node:assert/strict");
const { startTestServer, stopTestServer, request } = require("./testHelper");
const User = require("../models/User");
const Campaign = require("../models/Campaign");
const Assignment = require("../models/Assignment");
const Notification = require("../models/Notification");
const notificationService = require("../services/notificationService");

const testRunId = Date.now();
const brandEmail = `brand_notif_${testRunId}@example.com`;
const freelancerEmail = `free_notif_${testRunId}@example.com`;

let brandCookie = "";
let freelancerCookie = "";
let brandUserId = "";
let freelancerUserId = "";
let testCampaignId = "";
let notificationId = "";

test.before(async () => {
  await startTestServer();

  const bRes = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Brand Notif Admin",
      email: brandEmail,
      password: "Password123!",
      role: "brand",
      brandName: "Acme Broadcast",
    },
  });
  brandCookie = bRes.cookie;
  brandUserId = bRes.body.user.id;

  const fRes = await request({
    method: "POST",
    path: "/api/auth/register",
    body: {
      fullName: "Freelancer Notif User",
      email: freelancerEmail,
      password: "Password123!",
      role: "freelancer",
    },
  });
  freelancerCookie = fRes.cookie;
  freelancerUserId = fRes.body.user.id;

  const campRes = await request({
    method: "POST",
    path: "/api/campaigns",
    cookie: brandCookie,
    body: {
      name: "Spring Launch Notification Campaign",
      objective: "Drive product awareness across social channels",
      date: "2026-06-01",
      channels: ["LinkedIn"],
      brief: { contentRequirements: "Brief details", guidelines: "Brand guidelines" },
    },
  });
  testCampaignId = campRes.body.campaign.id;
});

test.after(async () => {
  await Notification.deleteMany({
    $or: [{ recipientId: brandUserId }, { recipientId: freelancerUserId }],
  });
  if (testCampaignId) {
    await Assignment.deleteMany({ campaignId: testCampaignId });
    await Campaign.findByIdAndDelete(testCampaignId);
  }
  await User.deleteMany({ email: { $in: [brandEmail, freelancerEmail] } });
  await stopTestServer();
});

test("GET /api/notifications rejects unauthenticated request with 401", async () => {
  const res = await request({
    method: "GET",
    path: "/api/notifications",
  });
  assert.equal(res.status, 401);
});

test("Assignment workflow triggers real-time notification to Freelancer", async () => {
  const assignRes = await request({
    method: "POST",
    path: "/api/assignments",
    cookie: brandCookie,
    body: {
      campaignId: testCampaignId,
      freelancerId: freelancerUserId,
      deliverables: ["LinkedIn Post"],
      dueDate: "2026-06-15",
    },
  });
  assert.equal(assignRes.status, 201);

  // Verify notification was stored for freelancer
  const notif = await Notification.findOne({
    recipientId: freelancerUserId,
    type: "assignment_created",
  });
  assert.ok(notif, "Notification should be created in MongoDB");
  assert.equal(notif.type, "assignment_created");
  assert.equal(notif.read, false);
  notificationId = notif._id.toString();
});

test("GET /api/notifications returns notification list and unread count for freelancer", async () => {
  const res = await request({
    method: "GET",
    path: "/api/notifications",
    cookie: freelancerCookie,
  });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.notifications));
  assert.ok(res.body.unreadCount >= 1);
  assert.ok(res.body.notifications.some((n) => n.id === notificationId));
});

test("PUT /api/notifications/:id/read marks notification as read", async () => {
  const res = await request({
    method: "PUT",
    path: `/api/notifications/${notificationId}/read`,
    cookie: freelancerCookie,
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.notification.read, true);

  const updated = await Notification.findById(notificationId);
  assert.equal(updated.read, true);
});

test("PUT /api/notifications/:id/read rejects marking another user's notification", async () => {
  const res = await request({
    method: "PUT",
    path: `/api/notifications/${notificationId}/read`,
    cookie: brandCookie, // Brand is not recipient
  });
  assert.equal(res.status, 404);
});

test("PUT /api/notifications/read-all marks all unread notifications as read", async () => {
  // Seed a second unread notification
  await Notification.create({
    recipientId: freelancerUserId,
    type: "system",
    title: "System Update",
    message: "Maintenance scheduled",
    read: false,
  });

  const res = await request({
    method: "PUT",
    path: "/api/notifications/read-all",
    cookie: freelancerCookie,
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  const unreadCount = await Notification.countDocuments({
    recipientId: freelancerUserId,
    read: false,
  });
  assert.equal(unreadCount, 0);
});

test("NotificationService handles simulated SSE stream broadcast safely", () => {
  let writtenData = "";
  const mockRes = {
    writableEnded: false,
    write: (chunk) => {
      writtenData += chunk;
      return true;
    },
  };

  notificationService.addClient("user_test_99", mockRes);
  assert.equal(notificationService.getConnectedClientCount("user_test_99"), 1);

  const sent = notificationService.sendToUser("user_test_99", "custom_event", { hello: "world" });
  assert.equal(sent, 1);
  assert.match(writtenData, /event: custom_event/);
  assert.match(writtenData, /"hello":"world"/);

  notificationService.removeClient("user_test_99", mockRes);
  assert.equal(notificationService.getConnectedClientCount("user_test_99"), 0);
});
