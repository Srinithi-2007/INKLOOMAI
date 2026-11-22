require("dotenv").config();
const { runComplianceReview, GeminiServiceError } = require("../services/geminiService");

async function main() {
  console.log("=== GEMINI REAL-WORLD VERIFICATION SUITE ===");
  const testResults = {
    validRequest: null,
    missingContent: null,
    missingGuidelines: null,
    missingApiKey: null,
  };

  // Test 1: Missing content validation
  try {
    await runComplianceReview({
      content: "   ",
      brandGuidelines: "Professional tone",
    });
    testResults.missingContent = { pass: false, error: "Did not reject empty content" };
  } catch (err) {
    testResults.missingContent = {
      pass: err instanceof GeminiServiceError && err.status === 400,
      message: err.message,
    };
  }

  // Test 2: Missing guidelines validation
  try {
    await runComplianceReview({
      content: "Sample marketing draft",
      brandGuidelines: "",
    });
    testResults.missingGuidelines = { pass: false, error: "Did not reject empty guidelines" };
  } catch (err) {
    testResults.missingGuidelines = {
      pass: err instanceof GeminiServiceError && err.status === 422,
      message: err.message,
    };
  }

  // Test 3: Missing API Key validation
  const origKey = process.env.GEMINI_API_KEY;
  try {
    process.env.GEMINI_API_KEY = "";
    await runComplianceReview({
      content: "Sample marketing draft",
      brandGuidelines: "Professional tone",
    });
    testResults.missingApiKey = { pass: false, error: "Did not reject empty API key" };
  } catch (err) {
    testResults.missingApiKey = {
      pass: err instanceof GeminiServiceError && err.status === 503,
      message: err.message,
    };
  } finally {
    process.env.GEMINI_API_KEY = origKey;
  }

  // Test 4: Genuine Live Request to Google Gemini
  console.log("Executing genuine Gemini API compliance review request...");
  const startTime = Date.now();
  try {
    const analysis = await runComplianceReview({
      campaignTitle: "Q4 Enterprise Security Launch",
      platform: "LinkedIn Post",
      brandGuidelines: `
Voice: Authoritative, enterprise-ready, objective.
Core Pillars: Zero Trust Security, Verifiable Compliance, SOC2 certified.
Banned Terms: "unhackable", "100% guarantee", "magic", "foolproof".
Approved Claims: "Inkloom AI automates brand compliance across multi-channel campaigns."
      `,
      content: `
Inkloom AI delivers a magic solution that guarantees your marketing is 100% foolproof and unhackable!
Our platform automates brand compliance across multi-channel campaigns with Zero Trust security.
      `,
    });
    const duration = Date.now() - startTime;
    testResults.validRequest = {
      status: "PASS",
      durationMs: duration,
      auditScore: analysis.auditScore,
      integrityScore: analysis.integrityScore,
      criticalRisk: analysis.criticalRisk,
      toneFit: analysis.toneFit,
      findingsCount: analysis.findings.length,
      sampleFinding: analysis.findings[0] || null,
      sanitizedPreview: analysis.sanitizedContent.slice(0, 100),
    };
    console.log("Live Gemini Request SUCCEEDED in " + duration + "ms");
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error("Live Gemini Request result:", err.name, err.status, err.message);
    testResults.validRequest = {
      status: err.status === 503 ? "BLOCKED_BY_UPSTREAM_CAPACITY" : "FAIL",
      durationMs: duration,
      errorStatus: err.status || 500,
      errorMessage: err.message,
    };
  }

  console.log("RESULTS:\n" + JSON.stringify(testResults, null, 2));
}

main().catch(console.error);
