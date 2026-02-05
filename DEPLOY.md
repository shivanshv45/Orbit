# Deployment Guide for Orbit

This guide outlines the best way to deploy your Orbit application (FastAPI Backend + Vite Frontend) with Piper TTS support.

## Architecture Overview

- **Backend**: Python FastAPI service running in a Docker container. This ensures `piper` (the text-to-speech engine) runs correctly with all Linux dependencies.
- **Frontend**: React (Vite) static application hosted on a CDN.
- **Database**: Currently SQLite (`database.db`). 
  - *Note*: In most containerized cloud platforms (like Render/Railway), the filesystem is ephemeral. This means if the server restarts, **SQLite data might be lost** unless you use a persistent Volume. For production, it is recommended to switch to PostgreSQL.

---

## Part 1: Backend Deployment (Docker)

We recommend using **Render** or **Railway** or **Fly.io** as they natively support Docker deployment from GitHub.

### Option A: Deploy on Render.com (Recommended)

1. **Push your code to GitHub**.
2. Log in to [Render.com](https://render.com).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. **Settings**:
   - **Root Directory**: `backend` (Important! Tell Render the app is in the backend folder)
   - **Runtime**: Docker
   - **Instance Type**: Free or Starter (Starter recommended for TTS performance).
6. **Environment Variables**:
   - Add any secrets from your `.env` file here (e.g., if you have API keys).
   - `PYTHONUNBUFFERED` = `1`
7. **Deploy**. Render will detect the `Dockerfile` in the `backend` folder and build it.
   - *Note*: The build might take a few minutes as it downloads Piper.

**Persistent Storage (Critical for SQLite):**
If you want to keep `database.db` safe on Render:
- You must upgrade to a paid plan and add a **Disk** attached to `/app/` or `/data`.
- OR, switch to a managed PostgreSQL database (Render offers this).

### Option B: Deploy on Railway.app

1. Log in to [Railway.app](https://railway.app).
2. **New Project** -> **Deploy from GitHub repo**.
3. Select your repo.
4. Railway usually auto-detects. If not, go to Settings -> **Root Directory** -> `backend`.
5. Configuration:
   - Railway handles Docker files automatically.
   - You can add a **Volume** for the `database.db` file to persist data.

---

## Part 2: Frontend Deployment (Vercel/Netlify)

Once the backend is live, get its URL (e.g., `https://orbit-backend.onrender.com`).

### Deploy on Vercel

1. Log in to [Vercel](https://vercel.com).
2. **Add New Project** -> Import your GitHub repo.
3. **Build & Output Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (Important!)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - Add a new variable: `VITE_API_BASE_URL`
   - Value: `https://your-backend-url.onrender.com` (The URL from Part 1)
   - *Note*: Exclude the trailing slash `/` if your code constructs paths like `${base}/api`.
5. **Deploy**.

---

## Part 3: Local Testing with Docker (Optional)

You can run the backend locally using Docker to simulate the production environment:

1. Navigate to `backend/`.
2. Build: `docker build -t orbit-backend .`
3. Run: `docker run -p 8000:8000 orbit-backend`

This confirms that Piper and all dependencies are working correctly in the Linux environment.
