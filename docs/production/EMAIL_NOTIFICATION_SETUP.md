# INKLOOM AI — Production Gmail SMTP Notification Setup Guide

**Document Purpose:** Operator setup and configuration manual for automated transactional emails in INKLOOM AI.  
**Provider:** Gmail SMTP via Nodemailer  
**Supported Events:**
1. **New User Registration:** Automated Welcome Email
2. **Successful Authentication:** New Login Security Notification

---

## 1. How to Generate a Google App Password

Gmail SMTP requires a **16-character Google App Password**. Standard Gmail account passwords cannot be used and will be rejected with `535-5.7.8 Username and Password not accepted`.

### Step-by-Step Instructions:
1. **Enable 2-Step Verification:**
   - Log into your Google Account: [https://myaccount.google.com/](https://myaccount.google.com/)
   - Go to **Security** &rarr; Under *How you sign in to Google*, ensure **2-Step Verification** is **ON**.
2. **Navigate to App Passwords:**
   - Search for **App passwords** in the top Google Account search bar, or navigate to:
     [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. **Generate App Password:**
   - In the **App name** field, enter: `INKLOOM AI Production` (or any recognizable label).
   - Click **Create**.
4. **Copy the 16-Character Token:**
   - A modal will present a 16-character code (formatted like `abcd efgh ijkl mnop`).
   - Copy this string immediately. (You can paste it with or without spaces; INKLOOM AI automatically trims spaces).

> [!CAUTION]
> Treat your 16-character Google App Password like a private key. Never commit it to Git, never paste it into chat, and never place it into frontend `NEXT_PUBLIC_` variables.

---

## 2. Required Environment Variables

Configure these variables in your backend environment (`backend/.env` for local testing, or the backend Vercel project for production):

| Variable Name | Required | Default / Example Value | Description |
| :--- | :--- | :--- | :--- |
| `EMAIL_ENABLED` | **Yes** | `true` | Enables or disables outbound email delivery. |
| `EMAIL_HOST` | No | `smtp.gmail.com` | SMTP host for Gmail. |
| `EMAIL_PORT` | No | `465` | TLS port (465) or STARTTLS port (587). |
| `EMAIL_SECURE` | No | `true` | `true` for port 465 (TLS), `false` for port 587. |
| `EMAIL_USER` | **Yes** | `your-sender-gmail@gmail.com` | Your Google / Gmail sender account address. |
| `EMAIL_APP_PASSWORD` | **Yes** | `abcdefghijklmnop` | 16-character Google App Password. |
| `EMAIL_FROM_NAME` | No | `INKLOOM AI` | Display name displayed in recipients' inboxes. |
| `APP_BASE_URL` | No | `https://inkloomai-mu.vercel.app` | Base URL used for links and buttons in email bodies. |

---

## 3. Local Development Setup

1. Open `backend/.env` (or copy from `backend/.env.example`).
2. Add your Gmail credentials:
   ```env
   EMAIL_ENABLED=true
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=465
   EMAIL_SECURE=true
   EMAIL_USER=your-account@gmail.com
   EMAIL_APP_PASSWORD=your16charpassword
   EMAIL_FROM_NAME=INKLOOM AI
   APP_BASE_URL=http://localhost:3000
   ```
3. Restart the backend server (`cd backend && node server.js`).
4. At startup, the server automatically verifies the SMTP connection:
   ```
   Gmail SMTP transport verified successfully.
   ```
5. You can also verify diagnostic status at:
   ```
   http://localhost:4000/api/health
   ```
   Response will display:
   ```json
   {
     "status": "ok",
     "email": {
       "enabled": true,
       "configured": true,
       "host": "smtp.gmail.com",
       "port": 465,
       "secure": true,
       "fromName": "INKLOOM AI",
       "senderAddress": "yo***@gmail.com"
     }
   }
   ```

---

## 4. Vercel Backend Production Configuration

When deploying to Vercel:

1. **Open Vercel Dashboard:**
   - Select your project. (If using separate projects for frontend and backend, select the **backend** project).
2. **Navigate to Settings:**
   - Click **Settings** &rarr; **Environment Variables**.
3. **Add the Email Variables:**
   - `EMAIL_ENABLED` &rarr; `true`
   - `EMAIL_HOST` &rarr; `smtp.gmail.com`
   - `EMAIL_PORT` &rarr; `465`
   - `EMAIL_SECURE` &rarr; `true`
   - `EMAIL_USER` &rarr; `your-sender-gmail@gmail.com`
   - `EMAIL_APP_PASSWORD` &rarr; `your-16-char-app-password`
   - `EMAIL_FROM_NAME` &rarr; `INKLOOM AI`
   - `APP_BASE_URL` &rarr; `https://inkloomai-mu.vercel.app`
4. **Ensure Target Environments are Checked:**
   - Make sure **Production**, **Preview**, and **Development** checkboxes are selected.
5. **Redeploy without Build Cache:**
   - Go to **Deployments** &rarr; Click `...` on latest deployment &rarr; **Redeploy**.
   - Uncheck "Use existing Build Cache".
6. **Verify Live Endpoint:**
   - Open `https://<your-vercel-domain>/api/health` and verify `"email": { "configured": true }`.

---

## 5. Email Events Verification

### Event A: New User Registration
- **Trigger:** Sign up as a new Brand Administrator or Freelancer.
- **Expected Outcome:**
  - Account is created and saved in MongoDB Atlas.
  - Recipient receives an email with subject:  
    `Welcome to INKLOOM AI — Your Account Is Ready!`
  - Email displays user's full name, assigned role, enterprise platform overview, and workspace CTA button.

### Event B: Successful Login Alert
- **Trigger:** Sign in with valid credentials.
- **Expected Outcome:**
  - JWT session token cookie is issued.
  - Recipient receives an email with subject:  
    `New Login to Your INKLOOM AI Account`
  - Email displays UTC login timestamp, application name, account email, and security notice.
  - **No secrets, passwords, cookies, or OTPs are included.**

---

## 6. Common Troubleshooting & Error Resolution

| Error / Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| `535-5.7.8 Username and Password not accepted` | Standard Gmail password used, or App Password revoked. | Generate a fresh 16-character App Password at `myaccount.google.com/apppasswords`. |
| `534-5.7.9 Application-specific password required` | 2-Step Verification is disabled or basic auth blocked. | Turn on 2-Step Verification on your Google Account before generating an App Password. |
| `ETIMEDOUT` or `ESOCKETTIMEDOUT` on port 465 | Cloud hosting provider blocks port 465 egress. | Switch to port `587` with `EMAIL_SECURE=false`. Gmail supports TLS negotiation over 587. |
| Registration succeeds but no email received | `EMAIL_ENABLED=false` or spam folder filtering. | Check `/api/health` to confirm `enabled: true`. Check recipient's Gmail Spam/Promotions folder. |
