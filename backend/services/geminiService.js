const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiServiceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "GeminiServiceError";
    this.status = status;
  }
}

function isScore(value) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

async function runComplianceReview({
  content,
  brandGuidelines,
  campaignTitle,
  platform,
}) {
  let apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    apiKey = apiKey.trim();
    if (
      (apiKey.startsWith('"') && apiKey.endsWith('"')) ||
      (apiKey.startsWith("'") && apiKey.endsWith("'"))
    ) {
      apiKey = apiKey.slice(1, -1).trim();
    }
  }
  if (!apiKey) {
    throw new GeminiServiceError(
      "Gemini is not configured. Set GEMINI_API_KEY on the backend and retry.",
      503
    );
  }
  if (typeof content !== "string" || !content.trim()) {
    throw new GeminiServiceError("Content is required for AI analysis.", 400);
  }
  if (typeof brandGuidelines !== "string" || !brandGuidelines.trim()) {
    throw new GeminiServiceError(
      "This campaign has no brand guidelines to analyze against.",
      422
    );
  }

  const prompt = `
You are an AI compliance analyst. Analyze the supplied draft only against the supplied campaign's actual brand guidelines. Do not approve, reject, or decide whether publication is allowed; a human brand administrator makes that decision.

CAMPAIGN: ${campaignTitle || "Untitled campaign"}
PLATFORM: ${platform || "Unspecified"}

CAMPAIGN BRAND GUIDELINES:
${brandGuidelines}

DRAFT:
${content}

Return only JSON with these fields:
{
  "integrityScore": 0,
  "auditScore": 0,
  "criticalRisk": 0,
  "toneDrift": 0,
  "factMatch": 0,
  "whisperConfidence": 0,
  "tamperAlerts": 0,
  "hasDisclaimer": false,
  "sanitizedContent": "The original draft, or a proposed revision clearly preserving the author's intent",
  "toneFit": { "label": "Tone fit", "detail": "Explanation grounded in the guidelines", "fit": 0 },
  "transcript": { "before": "Original relevant text", "flagged": null, "after": "Proposed text or original text" },
  "findings": [
    { "id": "finding-1", "title": "Finding title", "rule": "Guideline name", "claim": "Quoted draft text", "suggestion": "Specific correction", "confidence": 0, "resolved": false }
  ]
}
Scores and confidence must be numbers from 0 to 100. criticalRisk and tamperAlerts must be non-negative integers. Use an empty findings array when no findings apply. Do not invent a guideline that is not present.
`;

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" },
    });

    const timeoutMs = 35000;
    const generatePromise = model.generateContent(prompt);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new GeminiServiceError("Gemini analysis timed out after 25s.", 504)),
        timeoutMs
      );
    });

    const result = await Promise.race([generatePromise, timeoutPromise]);
    const parsed = JSON.parse(result.response.text());

    const scoreFields = [
      "integrityScore",
      "auditScore",
      "toneDrift",
      "factMatch",
      "whisperConfidence",
      "toneFit.fit",
    ];
    for (const field of scoreFields) {
      const value =
        field === "toneFit.fit"
          ? parsed.toneFit?.fit
          : parsed[field];
      if (!isScore(value)) {
        throw new Error(`Gemini response has an invalid ${field}.`);
      }
    }
    if (
      !Number.isInteger(parsed.criticalRisk) ||
      parsed.criticalRisk < 0 ||
      !Number.isInteger(parsed.tamperAlerts) ||
      parsed.tamperAlerts < 0 ||
      typeof parsed.hasDisclaimer !== "boolean" ||
      typeof parsed.sanitizedContent !== "string" ||
      typeof parsed.toneFit?.label !== "string" ||
      typeof parsed.toneFit?.detail !== "string" ||
      typeof parsed.transcript?.before !== "string" ||
      typeof parsed.transcript?.after !== "string" ||
      !Array.isArray(parsed.findings)
    ) {
      throw new Error("Gemini response is missing required analysis fields.");
    }
    for (const finding of parsed.findings) {
      if (
        typeof finding.id !== "string" ||
        typeof finding.title !== "string" ||
        typeof finding.rule !== "string" ||
        typeof finding.claim !== "string" ||
        typeof finding.suggestion !== "string" ||
        !isScore(finding.confidence)
      ) {
        throw new Error("Gemini response contains a malformed finding.");
      }
      finding.resolved = false;
    }

    return {
      ...parsed,
      gateThreshold: 85,
      decision: "pending",
      originalContent: content,
    };
  } catch (error) {
    if (error instanceof GeminiServiceError) throw error;
    console.error("Gemini compliance analysis failed:", error.message);
    const msg = error.message || "";
    if (msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE")) {
      throw new GeminiServiceError(
        "Gemini service is currently experiencing high demand. Please try again shortly.",
        503
      );
    }
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota") || msg.includes("Quota")) {
      throw new GeminiServiceError(
        "Gemini API rate limit or quota exceeded. Please try again shortly.",
        429
      );
    }
    if (msg.includes("404") || msg.includes("not found")) {
      throw new GeminiServiceError(
        "Gemini model not found. Check GEMINI_MODEL configuration.",
        502
      );
    }
    if (msg.includes("API key not valid") || msg.includes("403") || msg.includes("PERMISSION_DENIED")) {
      throw new GeminiServiceError(
        "Gemini API key is invalid or not authorized.",
        502
      );
    }
    throw new GeminiServiceError(
      "Gemini analysis failed. Check the backend configuration and retry.",
      502
    );
  }
}

module.exports = { runComplianceReview, GeminiServiceError };
