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

The frontend uses a local Next.js rewrite to proxy `/api/*` requests to `http://localhost:4000` during `next dev`. In production, the Vercel service rewrites route those requests to the backend service.

## Deploy on Vercel

The root `vercel.json` configures one Vercel project with two services:

- `backend` (`backend/`, Express) is public on `/api/*`.
- `frontend` (`frontend/`, Next.js) is public on `/*`.

Import the repository into Vercel from the repository root; do not set the project root to `frontend`, because `vercel.json` declares both service roots. Configure these environment variables for the backend service in Vercel (never commit their values):

- `NODE_ENV=production`
- `MONGODB_URI` — your MongoDB connection string.
- `JWT_SECRET` — a random secret of at least 32 characters.
- `GEMINI_API_KEY` — your Gemini API key.
- `GEMINI_MODEL=gemini-3.8-flash` (optional).
- `FRONTEND_URL` — the Vercel project’s deployed origin.

The browser calls the same-origin `/api/*` routes, which Vercel sends to the backend service. Do not set `NEXT_PUBLIC_API_URL` for this setup. No service binding is needed: there is no server-side frontend-to-backend call; the browser uses the public API route instead.

The Express app is exported for Vercel's request runtime; `app.listen()` is used only by local `npm start`. MongoDB connections are opened lazily and cached per warm backend instance.

After deploying, check `https://<your-vercel-domain>/api/health`; it should report `status: "ok"` and `database: "connected"`. To run the multi-service project locally with Vercel’s routing, link the repository with the Vercel CLI and run `vercel dev` from the repository root. The separate `npm run dev` instructions above remain available for local frontend/backend development.

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
