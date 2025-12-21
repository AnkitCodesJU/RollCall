# Deploying RollCall to Vercel

This guide explains how to deploy both the Frontend and Backend of the RollCall application to Vercel.

Since this is a monorepo (one repository with multiple projects), you will create **two separate projects** in Vercel: one for the backend and one for the frontend.

## Prerequisites

-   A [GitHub](https://github.com/) account.
-   A [Vercel](https://vercel.com/) account.
-   Your code pushed to a GitHub repository.
-   A MongoDB Atlas connection string (URI).

---

## Part 1: Deploy the Backend

1.  **Log in to Vercel** and click **"Add New Project"**.
2.  **Import your Repository**: Select the `RollCall` repository.
3.  **Configure Project**:
    -   **Project Name**: e.g., `rollcall-backend`
    -   **Framework Preset**: Select `Other` (or leave default).
    -   **Root Directory**: Click "Edit" and select `backend`.
4.  **Environment Variables**:
    -   Add `MONGO_URI`: Your MongoDB connection string.
    -   Add `JWT_SECRET`: A secret key for authentication.
5.  **Deploy**: Click **Deploy**.

Once deployed, copy the **URL** (domain) assigned to your backend project (e.g., `https://rollcall-backend.vercel.app`). You will need this for the frontend Config.

---

## Part 2: Deploy the Frontend

1.  **Add New Project** in Vercel again.
2.  **Import the SAME Repository**: Select `RollCall` again.
3.  **Configure Project**:
    -   **Project Name**: e.g., `rollcall-frontend`
    -   **Framework Preset**: `Next.js` (should be auto-detected).
    -   **Root Directory**: Click "Edit" and select `frontend`.
4.  **Environment Variables**:
    -   Add `NEXT_PUBLIC_API_URL`: Paste your backend URL from Part 1, followed by `/api`.
        -   Example: `https://rollcall-backend.vercel.app/api`
5.  **Deploy**: Click **Deploy**.

---

## Verification

-   Visit your Frontend URL.
-   Try to Register or Login.
-   If successful, your full-stack app is live!
