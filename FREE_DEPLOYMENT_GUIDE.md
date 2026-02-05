# Deploying with the Railway GUI (Browser) + Neon DB

Since you don't want to connect GitHub, you will use the **Railway Dashboard (Browser)** for all configuration, but you **must** use the terminal exactly **once** to upload your code (because Railway has no "Upload Zip" button in the browser).

Here is the "GUI-First" workflow.

---

## Part 1: The Database (Neon Website)
1.  Go to [Neon.tech](https://neon.tech) and Sign Up.
2.  Create a **New Project**.
3.  On the **Dashboard**, look for the **Connection String** box.
4.  Click the "Copy" button. It looks like: `postgres://alex:ab123@ep-cool.aws.neon.tech/neondb?sslmode=require`.
5.  **Save this for later.**

---

## Part 2: Upload Code (The ONLY Terminal Step)
Railway needs to get your files. Since we aren't using GitHub, we beam them up directly.

1.  Open your terminal in the `Orbit` folder.
2.  **Install/Update CLI**: `npm install -g @railway/cli` (The old `railway` package is broken).
3.  Run: `railway login` (Press Enter, it opens your **Browser** to approve).
3.  **Navigate to Backend** (CRITICAL STEP):
    ```bash
    cd backend
    ```
4.  Run: `railway up`
    *   It will ask: "Create a new project?" -> Select **Empty Project**.
    *   Name it: `orbit-backend`
    *   **Wait**: It will verify the upload and start building.
    *   **STOP**. You can close the terminal now. The build might fail initially because we haven't set the database key yet. **This is normal.**

---

## Part 3: Configure Backend (Railway Browser GUI)
Now, switch to the **[Railway Dashboard](https://railway.app/dashboard)** in your browser.

1.  Click on your new **orbit-backend** project.
2.  You will see a hexagonal box represents your service. Click it.
3.  **Add The Database**:
    *   Click the **"Variables"** tab.
    *   Click **"New Variable"**.
    *   **VARIABLE_NAME**: `DATABASE_URL`
    *   **VALUE**: (Paste the Neon Connection String from Part 1).
    *   Click **Add**.
4.  **Add Setup Variable**:
    *   Click **"New Variable"** again.
    *   **VARIABLE_NAME**: `PYTHONUNBUFFERED`
    *   **VALUE**: `1`
    *   Click **Add**.
5.  **Generate Public URL**:
    *   Click the **"Settings"** tab.
    *   Scroll down to **"Networking"**.
    *   Under "Public Networking", click **"Generate Domain"**.
    *   It will create a link (e.g., `orbit-backend-production.up.railway.app`). **Copy this**.
6.  **Restart**:
    *   Go to the **"Deployments"** tab. 
    *   If the build failed earlier, click **"Redeploy"** now that the variables are set.
    *   Wait for it to turn **Green (Active)**.

---

## Part 4: The Frontend (Vercel Browser GUI)
We will upload the frontend using the Vercel CLI (simplest way without GitHub) but configure in browser.

1.  **Terminal**: Go to your frontend folder: `cd frontend`.
2.  Run: `vercel`
    *   Hit `Enter` through all the default options ("Yes", "Orbit", "./").
    *   It will upload and give you a **Production** link.
3.  **Go to the [Vercel Dashboard](https://vercel.com/dashboard)**.
4.  Click your **orbit-frontend** project.
5.  Go to **Settings** -> **Environment Variables**.
6.  **Add New Variable**:
    *   **Key**: `VITE_API_BASE_URL`
    *   **Value**: (Paste the Railway URL from Part 3). **IMPORTANT**: Remove any trailing slash `/` at the end.
    *   Click **Save**.
7.  **Final Deployment**:
    *   Go to the **Deployments** tab.
    *   Click the **three dots** on the latest deployment -> **Redeploy**.
    *   This ensures the new `VITE_API_BASE_URL` is baked into the app.

---

## 🏁 Done!
*   Visit your **Vercel URL**.
*   It will load the site.
*   When you talk/interact, it sends requests to your **Railway Backend**.
*   Your backend connects to **Neon DB** to save data.
