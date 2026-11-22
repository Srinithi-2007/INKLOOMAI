const http = require("http");
const mongoose = require("mongoose");
const app = require("../server");
const { connectToMongo } = require("../services/mongoConnection");

let serverInstance = null;
let serverPort = null;

async function startTestServer() {
  await connectToMongo();
  if (serverInstance) return { server: serverInstance, port: serverPort };

  return new Promise((resolve) => {
    serverInstance = app.listen(0, "127.0.0.1", () => {
      serverPort = serverInstance.address().port;
      resolve({ server: serverInstance, port: serverPort });
    });
  });
}

async function stopTestServer() {
  if (serverInstance) {
    await new Promise((resolve) => {
      serverInstance.close(() => {
        serverInstance = null;
        serverPort = null;
        resolve();
      });
    });
  }
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (_) {}
}

function request({ method = "GET", path, body = null, headers = {}, cookie = "" }) {
  return new Promise((resolve, reject) => {
    const postData = body
      ? Buffer.isBuffer(body)
        ? body
        : typeof body === "string"
          ? body
          : JSON.stringify(body)
      : null;
    const reqHeaders = { ...headers };

    if (cookie) {
      reqHeaders["Cookie"] = cookie;
    }
    if (postData && !reqHeaders["Content-Type"]) {
      reqHeaders["Content-Type"] = "application/json";
    }
    if (postData) {
      reqHeaders["Content-Length"] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: "127.0.0.1",
      port: serverPort,
      path,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (_) {}

        // Extract cookies
        let setCookie = res.headers["set-cookie"];
        let cookieString = "";
        if (setCookie) {
          if (Array.isArray(setCookie)) {
            cookieString = setCookie.map((c) => c.split(";")[0]).join("; ");
          } else {
            cookieString = setCookie.split(";")[0];
          }
        }

        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
          rawBody: data,
          cookie: cookieString,
          rawSetCookie: setCookie,
        });
      });
    });

    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

module.exports = {
  startTestServer,
  stopTestServer,
  request,
};
