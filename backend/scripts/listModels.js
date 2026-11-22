require("dotenv").config();
const key = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim().replace(/^["']|["']$/g, "") : "";

async function main() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    if (data.models) {
      console.log("Supported Models Count:", data.models.length);
      const supported = data.models
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m) => m.name.replace("models/", ""));
      console.log("Supported generateContent models:", supported);
    } else {
      console.log("API Response:", data);
    }
  } catch (err) {
    console.error("ListModels failed:", err);
  }
}

main();
