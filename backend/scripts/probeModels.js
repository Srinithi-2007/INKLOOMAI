require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const key = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim().replace(/^["']|["']$/g, "") : "";
const genAI = new GoogleGenerativeAI(key);

async function testModel(modelName) {
  const start = Date.now();
  console.log(`Testing [${modelName}]...`);
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const res = await model.generateContent("Respond with JSON: {\"status\": \"ok\", \"model\": \"" + modelName + "\"}");
    const time = Date.now() - start;
    console.log(`[PASS] ${modelName} responded in ${time}ms:`, res.response.text().trim());
    return true;
  } catch (err) {
    const time = Date.now() - start;
    console.log(`[FAIL] ${modelName} (${time}ms):`, err.status || "ERR", err.message);
    return false;
  }
}

async function run() {
  await testModel("gemini-3.5-flash-lite");
  await testModel("gemini-3.5-flash");
  await testModel("gemini-flash-latest");
  await testModel("gemini-pro-latest");
}

run();
