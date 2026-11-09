# IntelliDesk Backend Deployment Guide

This guide details how to deploy the IntelliDesk AI FastAPI backend on container-friendly hosting providers (Render, Railway, or Fly.io) to support uninterrupted, persistent Server-Sent Events (SSE) connections.

---

## 1. Deploying on Render (Recommended)

Render's Web Service natively supports WebSockets and long-lived HTTP streams (SSE) without the strict 30-60 second execution cutoffs of serverless functions.

### Steps:
1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Blueprint** (or connect your GitHub repository directly using `render.yaml`).
3. If connecting manually as a Web Service:
   - **Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Branch**: `main`
   - **Instance Type**: Starter / Standard (non-free tier recommended to avoid sleep timeouts on SSE streams).
4. Add the following **Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL connection string (e.g. `postgresql+psycopg2://user:pass@host:5432/intellidesk`)
   - `JWT_SECRET`: A secure random 64-character string.
   - `CORS_ORIGINS`: `https://intellidesk-ai-customer-support-gules.vercel.app,http://localhost:5173`
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `PORT`: `8000`
5. Click **Create Web Service**.
6. Note the deployed URL (e.g., `https://intellidesk-backend.onrender.com`).
7. In Vercel, set your frontend environment variable:
   `VITE_API_URL=https://intellidesk-backend.onrender.com/api`

---

## 2. Deploying on Railway

Railway provisions persistent Docker containers with automatic HTTPS certificates and zero-configuration SSE streaming.

### Steps:
1. Go to [Railway.app](https://railway.app).
2. Click **New Project** > **Deploy from GitHub repo** and select `amogh895/intellidesk-ai-customer-support`.
3. Add a PostgreSQL database to the project (click **+ New** > **Database** > **PostgreSQL**).
4. In the backend service settings:
   - Set **Dockerfile Path** to `Dockerfile`.
   - Add environment variables:
     - `DATABASE_URL`: Reference `${{Postgres.DATABASE_URL}}`
     - `JWT_SECRET`: Random secure string
     - `CORS_ORIGINS`: `https://intellidesk-ai-customer-support-gules.vercel.app`
     - `GEMINI_API_KEY`: Your Google Gemini API Key
5. Railway will automatically detect `railway.json` and deploy with `/api/health` healthcheck.
6. Generate a domain under **Networking** (e.g., `https://intellidesk-production.up.railway.app`).
7. Update Vercel environment:
   `VITE_API_URL=https://intellidesk-production.up.railway.app/api`

---

## 3. Deploying on Fly.io

1. Install the Fly CLI: `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"`
2. Run `fly launch` in the repository root.
3. Set secrets:
   ```bash
   fly secrets set GEMINI_API_KEY="your-gemini-key" JWT_SECRET="your-jwt-secret" DATABASE_URL="your-db-url" CORS_ORIGINS="https://intellidesk-ai-customer-support-gules.vercel.app"
   ```
4. Deploy:
   ```bash
   fly deploy
   ```

---

## 4. Configuring Vercel Frontend

To connect the deployed frontend:
1. Go to the [Vercel Dashboard](https://vercel.com).
2. Select the `intellidesk-ai-customer-support` project.
3. Navigate to **Settings** > **Environment Variables**.
4. Add / Update:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://<YOUR-BACKEND-DOMAIN>/api` (No trailing slash)
5. Trigger a **Redeploy** of the latest commit.
