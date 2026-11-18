const test = require("node:test");
const assert = require("node:assert/strict");
const { getJwtSecret } = require("../routes/auth");

test("JWT configuration is validated at runtime without exposing the secret", () => {
  const originalSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;

  try {
    assert.throws(
      () => getJwtSecret(),
      /JWT_SECRET must be configured with at least 32 characters/
    );
    process.env.JWT_SECRET = "x".repeat(32);
    assert.equal(getJwtSecret(), "x".repeat(32));
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});
