const test = require("node:test");
const assert = require("node:assert/strict");
const { getCookieOptions } = require("../routes/auth");

test("auth cookies use same-site defaults during local development", () => {
  assert.deepEqual(getCookieOptions(false), {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });
});

test("auth cookies support cross-origin HTTPS deployments", () => {
  assert.deepEqual(getCookieOptions(true), {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
});
