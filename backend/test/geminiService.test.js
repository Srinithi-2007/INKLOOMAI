const test = require("node:test");
const assert = require("node:assert/strict");
const { runComplianceReview, GeminiServiceError } = require("../services/geminiService");

test("Gemini analysis fails explicitly when its API key is missing", async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

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
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});
