const test = require("node:test");
const assert = require("node:assert/strict");
const {
  startTestServer,
  stopTestServer,
  request,
} = require("./testHelper");
const User = require("../models/User");
const {
  getEmailConfig,
  getEmailConfigStatus,
  setCustomTransport,
  resetCustomTransport,
  generateWelcomeEmailContent,
  generateLoginEmailContent,
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  escapeHtml,
  sanitizeHeader,
  isValidEmail,
} = require("../services/emailService");

async function waitForMail(sentMail, targetCount, timeoutMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (sentMail.length >= targetCount) return;
    await new Promise((r) => setTimeout(r, 20));
  }
}

test.before(async () => {
  await startTestServer();
});

test.after(async () => {
  resetCustomTransport();
  await stopTestServer();
});

test("EmailService: reads SMTP configuration from environment and sanitizes values", () => {
  const originalEnv = { ...process.env };
  try {
    process.env.EMAIL_ENABLED = "true";
    process.env.EMAIL_HOST = "smtp.gmail.com";
    process.env.EMAIL_PORT = "465";
    process.env.EMAIL_SECURE = "true";
    process.env.EMAIL_USER = ' "alerts@inkloom.ai" ';
    process.env.EMAIL_APP_PASSWORD = " abcd efgh ijkl mnop ";
    process.env.EMAIL_FROM_NAME = "INKLOOM AI Support";
    process.env.APP_BASE_URL = "https://inkloomai-mu.vercel.app/";

    const config = getEmailConfig();
    assert.equal(config.enabled, true);
    assert.equal(config.host, "smtp.gmail.com");
    assert.equal(config.port, 465);
    assert.equal(config.secure, true);
    assert.equal(config.user, "alerts@inkloom.ai");
    assert.equal(config.pass, "abcdefghijklmnop"); // Spaces removed from 16-char app pass
    assert.equal(config.fromName, "INKLOOM AI Support");
    assert.equal(config.appBaseUrl, "https://inkloomai-mu.vercel.app");
  } finally {
    process.env = originalEnv;
  }
});

test("EmailService: safely handles missing or disabled configuration", async () => {
  const originalEnv = { ...process.env };
  try {
    process.env.EMAIL_ENABLED = "false";
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_APP_PASSWORD;
    resetCustomTransport();

    const welcomeResult = await sendWelcomeEmail({ email: "creator@test.com", fullName: "Creator" });
    assert.equal(welcomeResult.sent, false);
    assert.equal(welcomeResult.reason, "disabled");

    const loginResult = await sendLoginNotificationEmail({ email: "creator@test.com", fullName: "Creator" });
    assert.equal(loginResult.sent, false);
    assert.equal(loginResult.reason, "disabled");
  } finally {
    process.env = originalEnv;
  }
});

test("EmailService: rejects invalid or dangerous recipient addresses", async () => {
  assert.equal(isValidEmail(null), false);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(isValidEmail("attacker@victim.com\r\nBcc: evil@hacker.com"), false);
  assert.equal(isValidEmail("valid.user@inkloom.ai"), true);

  const res = await sendWelcomeEmail({ email: "invalid-email-address" });
  assert.equal(res.sent, false);
  assert.equal(res.reason, "invalid_recipient");
});

test("EmailService: escapeHtml and sanitizeHeader prevent injection", () => {
  const rawHtml = '<script>alert("xss")</script> & "quotes" \'single\'';
  const escaped = escapeHtml(rawHtml);
  assert.equal(escaped.includes("<script>"), false);
  assert.equal(escaped.includes("&lt;script&gt;"), true);
  assert.equal(escaped.includes("&amp;"), true);

  const headerWithNewlines = "Subject line\r\nInjected-Header: evil\nContent";
  const sanitized = sanitizeHeader(headerWithNewlines);
  assert.equal(sanitized.includes("\r"), false);
  assert.equal(sanitized.includes("\n"), false);
  assert.equal(sanitized, "Subject line Injected-Header: evil Content");
});

test("EmailService: generates accessible HTML and plain-text templates for Welcome and Login", () => {
  const dummyUser = {
    fullName: "Elena Rostova",
    email: "elena@brandco.com",
    role: "brand",
  };
  const appBaseUrl = "https://inkloomai-mu.vercel.app";

  // Welcome email
  const welcome = generateWelcomeEmailContent(dummyUser, appBaseUrl);
  assert.equal(welcome.html.includes("Welcome to INKLOOM AI, Elena Rostova!"), true);
  assert.equal(welcome.html.includes("Brand Administrator"), true);
  assert.equal(welcome.html.includes(appBaseUrl), true);
  assert.equal(welcome.text.includes("Welcome to INKLOOM AI, Elena Rostova!"), true);
  assert.equal(welcome.text.includes("Brand Administrator"), true);

  // Login email
  const loginMeta = {
    timestamp: "2026-11-23T08:00:00.000Z",
  };
  const login = generateLoginEmailContent(dummyUser, loginMeta, appBaseUrl);
  assert.equal(login.html.includes("New Login to Your Account"), true);
  assert.equal(login.html.includes("Security Notice:"), true);
  assert.equal(login.html.includes("Mon, 23 Nov 2026 08:00:00 GMT"), true);
  assert.equal(login.text.includes("Security Team"), true);
  // Verify secrets are NEVER in templates
  assert.equal(login.html.includes("UserSecretPassword123"), false);
  assert.equal(login.html.includes("eyJh"), false); // JWT prefix
  assert.equal(login.html.includes("token="), false);
  assert.equal(login.html.includes("cookie="), false);
});

test("EmailService: getEmailConfigStatus never exposes EMAIL_APP_PASSWORD or secret length", () => {
  const originalEnv = { ...process.env };
  try {
    process.env.EMAIL_ENABLED = "true";
    process.env.EMAIL_USER = "sender@gmail.com";
    process.env.EMAIL_APP_PASSWORD = "superSecretPassword123";

    const status = getEmailConfigStatus();
    assert.equal(status.enabled, true);
    assert.equal(status.configured, true);
    assert.equal(status.host, "smtp.gmail.com");
    assert.equal(typeof status.senderAddress, "string");
    assert.equal(status.senderAddress.includes("***"), true); // Masked

    const serialized = JSON.stringify(status);
    assert.equal(serialized.includes("superSecretPassword123"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(status, "pass"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(status, "password"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(status, "length"), false);
  } finally {
    process.env = originalEnv;
  }
});

test("EmailService: catches transport errors gracefully without unhandled rejection", async () => {
  const failingTransport = {
    sendMail: async () => {
      throw new Error("SMTP connection timeout at smtp.gmail.com:465");
    },
  };
  setCustomTransport(failingTransport);

  try {
    const result = await sendWelcomeEmail({ email: "creator@test.com", fullName: "Creator" });
    assert.equal(result.sent, false);
    assert.equal(result.error.includes("SMTP connection timeout"), true);
  } finally {
    resetCustomTransport();
  }
});

test("Registration Integration: successful registration triggers exactly one welcome email", async () => {
  const sentMail = [];
  const mockTransport = {
    sendMail: async (opts) => {
      sentMail.push(opts);
      return { messageId: "mock-msg-" + Date.now() };
    },
  };
  setCustomTransport(mockTransport);

  const testEmail = `new-creator-${Date.now()}@example.com`;
  try {
    const res = await request({
      method: "POST",
      path: "/api/auth/register",
      body: {
        fullName: "Alex Rivera",
        email: testEmail,
        password: "StrongPassword123!",
        role: "freelancer",
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.email, testEmail);

    await waitForMail(sentMail, 1);

    assert.equal(sentMail.length, 1);
    assert.equal(sentMail[0].to, testEmail);
    assert.equal(sentMail[0].subject, "Welcome to INKLOOM AI — Your Account Is Ready!");
    assert.equal(sentMail[0].text.includes("Alex Rivera"), true);
    assert.equal(sentMail[0].text.includes("Freelancer Creator"), true);
    assert.equal(sentMail[0].html.includes("Alex Rivera"), true);
  } finally {
    resetCustomTransport();
    await User.deleteOne({ email: testEmail });
  }
});

test("Registration Integration: duplicate or failed registration sends no email", async () => {
  const sentMail = [];
  const mockTransport = {
    sendMail: async (opts) => {
      sentMail.push(opts);
      return { messageId: "mock-msg-" + Date.now() };
    },
  };
  setCustomTransport(mockTransport);

  const existingEmail = `dup-user-${Date.now()}@example.com`;
  try {
    // 1. Initial valid registration
    const res1 = await request({
      method: "POST",
      path: "/api/auth/register",
      body: {
        fullName: "First User",
        email: existingEmail,
        password: "StrongPassword123!",
        role: "brand",
        brandName: "Acme Corp",
      },
    });
    assert.equal(res1.status, 201);
    await waitForMail(sentMail, 1);
    assert.equal(sentMail.length, 1);

    // 2. Duplicate registration attempt -> 409
    const res2 = await request({
      method: "POST",
      path: "/api/auth/register",
      body: {
        fullName: "Duplicate User",
        email: existingEmail,
        password: "StrongPassword123!",
        role: "brand",
      },
    });
    assert.equal(res2.status, 409);
    await new Promise((r) => setTimeout(r, 200));
    assert.equal(sentMail.length, 1); // No new email sent

    // 3. Malformed registration attempt -> 400
    const res3 = await request({
      method: "POST",
      path: "/api/auth/register",
      body: {
        fullName: "Invalid",
        email: "bad-email",
        password: "short",
        role: "brand",
      },
    });
    assert.equal(res3.status, 400);
    await new Promise((r) => setTimeout(r, 200));
    assert.equal(sentMail.length, 1); // Still 1
  } finally {
    resetCustomTransport();
    await User.deleteOne({ email: existingEmail });
  }
});

test("Registration Integration: Gmail failure does not fail registration", async () => {
  const failingTransport = {
    sendMail: async () => {
      throw new Error("Gmail service unavailable (simulated SMTP network outage)");
    },
  };
  setCustomTransport(failingTransport);

  const testEmail = `resilient-reg-${Date.now()}@example.com`;
  try {
    const res = await request({
      method: "POST",
      path: "/api/auth/register",
      body: {
        fullName: "Resilient User",
        email: testEmail,
        password: "StrongPassword123!",
        role: "freelancer",
      },
    });

    // Registration must succeed with 201 and valid cookie despite email failure
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(Boolean(res.cookie), true);
  } finally {
    resetCustomTransport();
    await User.deleteOne({ email: testEmail });
  }
});

test("Login Integration: successful login triggers login notification email", async () => {
  const sentMail = [];
  const mockTransport = {
    sendMail: async (opts) => {
      sentMail.push(opts);
      return { messageId: "mock-msg-" + Date.now() };
    },
  };
  setCustomTransport(mockTransport);

  const userEmail = `login-notify-${Date.now()}@example.com`;
  try {
    // Register test user
    const regRes = await request({
      method: "POST",
      path: "/api/auth/register",
      body: {
        fullName: "Jordan Lee",
        email: userEmail,
        password: "CorrectPassword123!",
        role: "brand",
        brandName: "Jordan Brands",
      },
    });
    assert.equal(regRes.status, 201);
    await waitForMail(sentMail, 1);
    assert.equal(sentMail.length, 1);
    sentMail.length = 0; // Clear welcome email before testing login

    // Execute login
    const loginRes = await request({
      method: "POST",
      path: "/api/auth/login",
      body: {
        email: userEmail,
        password: "CorrectPassword123!",
        role: "brand",
      },
    });

    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.success, true);

    await waitForMail(sentMail, 1);

    assert.equal(sentMail.length, 1);
    assert.equal(sentMail[0].to, userEmail);
    assert.equal(sentMail[0].subject, "New Login to Your INKLOOM AI Account");
    assert.equal(sentMail[0].text.includes("Jordan Lee"), true);
    assert.equal(sentMail[0].text.includes("Security Notice"), true);
    assert.equal(sentMail[0].html.includes("Security Notice"), true);

    // Verify zero secrets leaked in email
    assert.equal(sentMail[0].text.includes("CorrectPassword123!"), false);
    assert.equal(sentMail[0].html.includes("CorrectPassword123!"), false);
  } finally {
    resetCustomTransport();
    await User.deleteOne({ email: userEmail });
  }
});

test("Login Integration: failed authentication sends no email", async () => {
  const sentMail = [];
  const mockTransport = {
    sendMail: async (opts) => {
      sentMail.push(opts);
      return { messageId: "mock-msg-" + Date.now() };
    },
  };
  setCustomTransport(mockTransport);

  const userEmail = `auth-fail-${Date.now()}@example.com`;
  try {
    await request({
      method: "POST",
      path: "/api/auth/register",
      body: {
        fullName: "Test Defender",
        email: userEmail,
        password: "CorrectPassword123!",
        role: "freelancer",
      },
    });
    await new Promise((r) => setTimeout(r, 100));
    sentMail.length = 0; // Clear welcome email

    // 1. Wrong password attempt -> 401
    const res1 = await request({
      method: "POST",
      path: "/api/auth/login",
      body: {
        email: userEmail,
        password: "WrongPassword999!",
      },
    });
    assert.equal(res1.status, 401);
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(sentMail.length, 0);

    // 2. Unknown user email -> 401
    const res2 = await request({
      method: "POST",
      path: "/api/auth/login",
      body: {
        email: "non-existent-user@example.com",
        password: "AnyPassword123!",
      },
    });
    assert.equal(res2.status, 401);
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(sentMail.length, 0);

    // 3. Role mismatch attempt -> 401
    const res3 = await request({
      method: "POST",
      path: "/api/auth/login",
      body: {
        email: userEmail,
        password: "CorrectPassword123!",
        role: "brand", // Registered as freelancer
      },
    });
    assert.equal(res3.status, 401);
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(sentMail.length, 0);
  } finally {
    resetCustomTransport();
    await User.deleteOne({ email: userEmail });
  }
});

test("Login Integration: Gmail failure does not fail login", async () => {
  const failingTransport = {
    sendMail: async () => {
      throw new Error("Gmail SMTP connection timeout");
    },
  };
  setCustomTransport(failingTransport);

  const userEmail = `resilient-login-${Date.now()}@example.com`;
  try {
    await request({
      method: "POST",
      path: "/api/auth/register",
      body: {
        fullName: "Resilient Login User",
        email: userEmail,
        password: "CorrectPassword123!",
        role: "freelancer",
      },
    });

    const loginRes = await request({
      method: "POST",
      path: "/api/auth/login",
      body: {
        email: userEmail,
        password: "CorrectPassword123!",
      },
    });

    // Login must succeed with 200 and valid cookie despite email failure
    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.success, true);
    assert.equal(Boolean(loginRes.cookie), true);
  } finally {
    resetCustomTransport();
    await User.deleteOne({ email: userEmail });
  }
});
