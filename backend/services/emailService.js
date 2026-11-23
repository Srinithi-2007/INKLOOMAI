const nodemailer = require("nodemailer");

let customTransport = null;

function setCustomTransport(transport) {
  customTransport = transport;
}

function resetCustomTransport() {
  customTransport = null;
}

function getEmailConfig() {
  const enabled = process.env.EMAIL_ENABLED === "true";
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.EMAIL_PORT, 10) || 465;
  const secure =
    process.env.EMAIL_SECURE !== undefined
      ? process.env.EMAIL_SECURE === "true"
      : port === 465;

  let user = (process.env.EMAIL_USER || "").trim();
  if (
    (user.startsWith('"') && user.endsWith('"')) ||
    (user.startsWith("'") && user.endsWith("'"))
  ) {
    user = user.slice(1, -1).trim();
  }

  let pass = (
    process.env.EMAIL_APP_PASSWORD ||
    process.env.EMAIL_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    ""
  ).trim();
  if (
    (pass.startsWith('"') && pass.endsWith('"')) ||
    (pass.startsWith("'") && pass.endsWith("'"))
  ) {
    pass = pass.slice(1, -1).trim();
  }
  // Remove accidental spaces inside 16-character Google app passwords (e.g. "abcd efgh ijkl mnop")
  if (host === "smtp.gmail.com" && pass.length === 19 && pass.split(" ").length === 4) {
    pass = pass.replace(/\s+/g, "");
  }

  const fromName = (process.env.EMAIL_FROM_NAME || "INKLOOM AI").trim();
  const appBaseUrl = (
    process.env.APP_BASE_URL ||
    process.env.FRONTEND_URL ||
    "https://inkloomai-mu.vercel.app"
  ).replace(/\/+$/, "");

  return {
    enabled,
    host,
    port,
    secure,
    user,
    pass,
    fromName,
    appBaseUrl,
    from: user ? `"${fromName}" <${user}>` : `"${fromName}"`,
  };
}

function getTransporter() {
  if (customTransport) return customTransport;

  const config = getEmailConfig();
  if (!config.enabled || !config.user || !config.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
  });
}

async function verifyEmailTransport() {
  const config = getEmailConfig();
  if (!config.enabled) {
    return { verified: false, reason: "disabled" };
  }
  if (!config.user || !config.pass) {
    return { verified: false, reason: "unconfigured" };
  }
  try {
    const transporter = getTransporter();
    if (!transporter) return { verified: false, reason: "no_transporter" };
    await transporter.verify();
    return { verified: true };
  } catch (err) {
    console.error("Gmail SMTP transport verification warning:", err.message);
    return { verified: false, error: err.message };
  }
}

function getEmailConfigStatus() {
  const config = getEmailConfig();
  return {
    enabled: config.enabled,
    configured: Boolean(config.user && config.pass),
    host: config.host,
    port: config.port,
    secure: config.secure,
    fromName: config.fromName,
    senderAddress: config.user
      ? config.user.replace(/^(.{2})[^@]*(@.*)$/, "$1***$2")
      : null,
  };
}

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeHeader(val) {
  if (typeof val !== "string") return "";
  return val.replace(/[\r\n]+/g, " ").trim();
}

function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed.length <= 254;
}

function renderEmailShell({ title, preheader, bodyHtml, appBaseUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0b0914; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #334155; -webkit-font-smoothing: antialiased;">
  <span style="display: none; font-size: 1px; color: #0b0914; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${escapeHtml(preheader || title)}
  </span>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0b0914; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 60%, #6d28d9 100%); padding: 36px 32px; text-align: left;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display: inline-block; padding: 4px 12px; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #ede9fe; text-transform: uppercase;">
                      Brand Governance &amp; AI
                    </div>
                    <h1 style="margin: 12px 0 0 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      INKLOOM AI
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; line-height: 1.6; color: #334155; font-size: 15px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #475569;">
                INKLOOM AI — Autonomous Brand Governance &amp; Compliance Review
              </p>
              <p style="margin: 0 0 12px 0;">
                <a href="${escapeHtml(appBaseUrl)}" style="color: #6d28d9; text-decoration: none; font-weight: 600;">Visit INKLOOM AI Dashboard</a>
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                This is an automated system notification. Please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateWelcomeEmailContent(user, appBaseUrl) {
  const roleName = user.role === "brand" ? "Brand Administrator" : "Freelancer Creator";
  const name = user.fullName || "Creator";
  const safeName = escapeHtml(name);
  const safeRole = escapeHtml(roleName);
  const safeUrl = escapeHtml(appBaseUrl);

  const bodyHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #1e1b4b;">
      Welcome to INKLOOM AI, ${safeName}!
    </h2>
    <p style="margin: 0 0 16px 0; color: #334155;">
      Your account has been successfully created. We are excited to welcome you to <strong>INKLOOM AI</strong>, the enterprise platform built to streamline creative workflows, safeguard brand governance, and provide real-time AI-powered content compliance analysis.
    </p>
    <div style="margin: 24px 0; padding: 18px 20px; background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px;">
      <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: #6d28d9;">
        Account Summary
      </p>
      <p style="margin: 0; font-size: 14px; color: #1e1b4b;">
        <strong>Registered Email:</strong> ${escapeHtml(user.email)}<br>
        <strong>Assigned Role:</strong> <span style="display: inline-block; padding: 2px 8px; background-color: #ede9fe; color: #5b21b6; border-radius: 6px; font-weight: 600; font-size: 12px;">${safeRole}</span>
      </p>
    </div>
    <p style="margin: 0 0 24px 0; color: #334155;">
      With INKLOOM AI, your drafts are automatically evaluated against precise brand voice, terminology rules, and regulatory requirements before publication.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${safeUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 10px; box-shadow: 0 4px 14px rgba(109, 40, 217, 0.35);">
        Access Your INKLOOM AI Workspace &rarr;
      </a>
    </div>
    <p style="margin: 24px 0 0 0; color: #475569; font-size: 14px;">
      Warm regards,<br>
      <strong style="color: #1e1b4b;">The INKLOOM AI Team</strong>
    </p>
  `;

  const html = renderEmailShell({
    title: "Welcome to INKLOOM AI — Your Account Is Ready!",
    preheader: `Welcome ${name}! Your INKLOOM AI ${roleName} account is ready.`,
    bodyHtml,
    appBaseUrl,
  });

  const text = `Welcome to INKLOOM AI, ${name}!

Your account has been successfully created. We are excited to welcome you to INKLOOM AI, the enterprise platform built to streamline creative workflows, safeguard brand governance, and provide real-time AI-powered content compliance analysis.

ACCOUNT SUMMARY:
- Registered Email: ${user.email}
- Assigned Role: ${roleName}

With INKLOOM AI, drafts are automatically evaluated against precise brand voice, terminology rules, and regulatory requirements before publication.

Access your workspace: ${appBaseUrl}

Warm regards,
The INKLOOM AI Team
`;

  return { html, text };
}

function generateLoginEmailContent(user, loginMetadata = {}, appBaseUrl) {
  const name = user.fullName || "User";
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(appBaseUrl);

  const loginDate = loginMetadata.timestamp
    ? new Date(loginMetadata.timestamp)
    : new Date();
  const formattedDate = loginDate.toUTCString();

  const bodyHtml = `
    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #1e1b4b;">
      New Login to Your Account
    </h2>
    <p style="margin: 0 0 16px 0; color: #334155;">
      Hello ${safeName}, your <strong>INKLOOM AI</strong> account was successfully accessed.
    </p>
    <div style="margin: 20px 0; padding: 18px 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
      <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: #475569;">
        Login Details
      </p>
      <p style="margin: 0; font-size: 14px; color: #1e1b4b; line-height: 1.6;">
        <strong>Application:</strong> INKLOOM AI<br>
        <strong>Date &amp; Time (UTC):</strong> ${escapeHtml(formattedDate)}<br>
        <strong>Account Email:</strong> ${escapeHtml(user.email)}
      </p>
    </div>
    <div style="margin: 24px 0 0 0; padding: 16px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px; font-size: 13px; color: #92400e; line-height: 1.5;">
      <strong>Security Notice:</strong> If you performed this login, no further action is required. If you did not authorize this access, please secure your account immediately by changing your password and contacting our support team.
    </div>
    <div style="text-align: center; margin: 28px 0 12px 0;">
      <a href="${safeUrl}" style="display: inline-block; padding: 12px 28px; background: #1e1b4b; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 13px; border-radius: 8px;">
        Open INKLOOM AI
      </a>
    </div>
    <p style="margin: 24px 0 0 0; color: #475569; font-size: 14px;">
      Stay secure,<br>
      <strong style="color: #1e1b4b;">The INKLOOM AI Security Team</strong>
    </p>
  `;

  const html = renderEmailShell({
    title: "New Login to Your INKLOOM AI Account",
    preheader: `A new successful login was detected on your INKLOOM AI account on ${formattedDate}.`,
    bodyHtml,
    appBaseUrl,
  });

  const text = `New Login to Your INKLOOM AI Account

Hello ${name},

Your INKLOOM AI account was successfully accessed.

LOGIN DETAILS:
- Application: INKLOOM AI
- Date & Time (UTC): ${formattedDate}
- Account Email: ${user.email}

Security Notice:
If you performed this login, no further action is required. If you did not authorize this access, please secure your account immediately by changing your password and contacting our support team.

Open INKLOOM AI: ${appBaseUrl}

Stay secure,
The INKLOOM AI Security Team
`;

  return { html, text };
}

async function sendWelcomeEmail(user) {
  if (!user || !isValidEmail(user.email)) {
    return { sent: false, reason: "invalid_recipient" };
  }

  const config = getEmailConfig();
  if (!config.enabled && !customTransport) {
    return { sent: false, reason: "disabled" };
  }
  if (!config.user && !customTransport) {
    return { sent: false, reason: "unconfigured" };
  }

  try {
    const transporter = getTransporter();
    if (!transporter) return { sent: false, reason: "unconfigured" };

    const { html, text } = generateWelcomeEmailContent(user, config.appBaseUrl);
    const subject = sanitizeHeader("Welcome to INKLOOM AI — Your Account Is Ready!");
    const to = sanitizeHeader(user.email);

    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html,
    });

    return { sent: true, messageId: info?.messageId || "delivered" };
  } catch (err) {
    console.error("Welcome email delivery failed:", err.message);
    return { sent: false, error: err.message };
  }
}

async function sendLoginNotificationEmail(user, loginMetadata = {}) {
  if (!user || !isValidEmail(user.email)) {
    return { sent: false, reason: "invalid_recipient" };
  }

  const config = getEmailConfig();
  if (!config.enabled && !customTransport) {
    return { sent: false, reason: "disabled" };
  }
  if (!config.user && !customTransport) {
    return { sent: false, reason: "unconfigured" };
  }

  try {
    const transporter = getTransporter();
    if (!transporter) return { sent: false, reason: "unconfigured" };

    const { html, text } = generateLoginEmailContent(user, loginMetadata, config.appBaseUrl);
    const subject = sanitizeHeader("New Login to Your INKLOOM AI Account");
    const to = sanitizeHeader(user.email);

    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html,
    });

    return { sent: true, messageId: info?.messageId || "delivered" };
  } catch (err) {
    console.error("Login notification email delivery failed:", err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = {
  getEmailConfig,
  getTransporter,
  setCustomTransport,
  resetCustomTransport,
  verifyEmailTransport,
  getEmailConfigStatus,
  generateWelcomeEmailContent,
  generateLoginEmailContent,
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  escapeHtml,
  sanitizeHeader,
  isValidEmail,
};
