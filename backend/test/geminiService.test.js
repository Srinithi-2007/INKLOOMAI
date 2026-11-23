const test = require("node:test");
const assert = require("node:assert/strict");
const {
  runComplianceReview,
  GeminiServiceError,
  resolveGeminiApiKey,
  getGeminiDiagnostic,
} = require("../services/geminiService");

const CANDIDATE_KEYS = [
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GOOGLE_GEMINI_API_KEY",
  "NEXT_PUBLIC_GEMINI_API_KEY",
  "GEMINI_KEY",
];

function snapshotEnv() {
  const saved = {};
  for (const k of CANDIDATE_KEYS) {
    saved[k] = process.env[k];
  }
  return saved;
}

function restoreEnv(saved) {
  for (const k of CANDIDATE_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
}

function clearAllKeys() {
  for (const k of CANDIDATE_KEYS) {
    delete process.env[k];
  }
}

test("Gemini analysis fails explicitly when its API key is missing", async () => {
  const saved = snapshotEnv();
  clearAllKeys();

  try {
    await assert.rejects(
      runComplianceReview({
        content: "Draft",
        brandGuidelines: "Use a clear, factual tone.",
        campaignTitle: "Campaign",
        platform: "Web",
      }),
      (error) =>
        error instanceof GeminiServiceError &&
        error.status === 503 &&
        error.message.includes("GEMINI_API_KEY")
    );
  } finally {
    restoreEnv(saved);
  }
});

test("getGeminiDiagnostic reports non-configured when keys are absent", () => {
  const saved = snapshotEnv();
  clearAllKeys();

  try {
    const diag = getGeminiDiagnostic();
    assert.equal(diag.configured, false);
    assert.equal(diag.hasKey, false);
    assert.equal(diag.keySource, "none");
    assert.equal(typeof diag.model, "string");
  } finally {
    restoreEnv(saved);
  }
});

test("getGeminiDiagnostic reports configured status without exposing secret or length", () => {
  const saved = snapshotEnv();
  clearAllKeys();
  const dummySecret = "AIzaSyTestSecretValue123456789";
  process.env.GEMINI_API_KEY = dummySecret;

  try {
    const diag = getGeminiDiagnostic();
    assert.equal(diag.configured, true);
    assert.equal(diag.hasKey, true);
    assert.equal(diag.keySource, "GEMINI_API_KEY");
    assert.equal(typeof diag.model, "string");

    // Strictly verify no secret exposure or length leakage
    const serialized = JSON.stringify(diag);
    assert.equal(serialized.includes(dummySecret), false);
    assert.equal(Object.prototype.hasOwnProperty.call(diag, "length"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(diag, "keyLength"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(diag, "apiKey"), false);
  } finally {
    restoreEnv(saved);
  }
});

test("resolveGeminiApiKey falls back to GOOGLE_API_KEY when GEMINI_API_KEY is absent", () => {
  const saved = snapshotEnv();
  clearAllKeys();
  process.env.GOOGLE_API_KEY = "dummy-google-api-key";

  try {
    const res = resolveGeminiApiKey();
    assert.equal(res.apiKey, "dummy-google-api-key");
    assert.equal(res.source, "GOOGLE_API_KEY");

    const diag = getGeminiDiagnostic();
    assert.equal(diag.configured, true);
    assert.equal(diag.keySource, "GOOGLE_API_KEY");
  } finally {
    restoreEnv(saved);
  }
});

test("resolveGeminiApiKey cleanly strips quotes, whitespace, and rejects literal 'undefined'", () => {
  const saved = snapshotEnv();
  clearAllKeys();

  try {
    // Literal undefined/null strings should be rejected
    process.env.GEMINI_API_KEY = "undefined";
    assert.equal(resolveGeminiApiKey().apiKey, null);

    process.env.GEMINI_API_KEY = "null";
    assert.equal(resolveGeminiApiKey().apiKey, null);

    process.env.GEMINI_API_KEY = "   ";
    assert.equal(resolveGeminiApiKey().apiKey, null);

    // Strips double quotes and whitespace
    process.env.GEMINI_API_KEY = '  "my-quoted-key"  ';
    assert.equal(resolveGeminiApiKey().apiKey, "my-quoted-key");

    // Strips single quotes
    process.env.GEMINI_API_KEY = " 'my-single-quoted-key' ";
    assert.equal(resolveGeminiApiKey().apiKey, "my-single-quoted-key");
  } finally {
    restoreEnv(saved);
  }
});
