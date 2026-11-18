# INKLOOM AI

INKLOOM AI is a unified Next.js frontend and Express/MongoDB backend for brand teams and freelance creators.

## Project layout

- `frontend/` — Next.js App Router application.
- `backend/` — Express API, MongoDB models, authentication, and Gemini review integration.
- `docs/` — takeover audit, implementation status, bug report, and test report.

The original Authentication, Brand, and Freelancer project folders are maintained separately and are not part of this unified application repository.

## Run locally

Requirements: Node.js 20+ and MongoDB Atlas (or a local MongoDB instance).

1. Configure the backend:

   ```powershell
   Set-Location backend
   npm ci
   Copy-Item .env.example .env
   ```

   Edit `backend/.env` and set `MONGODB_URI`, a random `JWT_SECRET` of at least 32 characters, and `GEMINI_API_KEY`. Keep `.env` local; it is ignored by Git.

2. Start the backend in one terminal:

   ```powershell
   Set-Location backend
   npm start
   ```

3. Start the frontend in another terminal:

   ```powershell
   Set-Location frontend
   npm ci
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000). Backend health is available at `http://localhost:4000/api/health`.

The frontend uses a local Next.js rewrite to proxy API requests to `http://localhost:4000` unless `NEXT_PUBLIC_API_URL` is set.

## Deploy

One supported split-host setup is Vercel for the frontend and Render for the backend:

### Backend on Render

1. Create a **Web Service** from this repository and set its **Root Directory** to `backend`.
2. Use `npm ci` as the build command and `npm start` as the start command.
3. Add these environment variables in Render (never commit their values):
   - `NODE_ENV=production`
   - `MONGODB_URI` — your MongoDB connection string.
   - `JWT_SECRET` — a random secret of at least 32 characters.
   - `GEMINI_API_KEY` — your Gemini API key.
   - `GEMINI_MODEL=gemini-3.8-flash` (optional).
   - `FRONTEND_URL=https://<your-vercel-domain>` — the exact deployed frontend origin.
4. Allow the backend host to connect to your MongoDB Atlas cluster using Atlas network access settings.

### Frontend on Vercel

1. Import the repository and set the Vercel **Root Directory** to `frontend`.
2. Set `NEXT_PUBLIC_API_URL` to the backend's public origin, for example `https://<your-render-service>.onrender.com` (no trailing slash).
3. Deploy or redeploy after setting the environment variable.

Production auth cookies use `SameSite=None; Secure` for the split-origin frontend/backend setup. Confirm the deployed backend at `https://<your-render-service>.onrender.com/api/health`; it should report `status: "ok"` and `database: "connected"`.

## Checks

```powershell
Set-Location frontend
npm ci
npx tsc --noEmit
npm run lint
npm run build
npm test

Set-Location ..\backend
npm ci
npm test
```

Gemini analysis requires a valid key and available provider capacity. A provider-side 503 means analysis was not completed; the application does not fabricate an AI result.
