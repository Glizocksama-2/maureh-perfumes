# 🚀 Maureh Perfumes — Supabase & Vercel Connection Guide

---

## ⚡ Part 1: Connecting Supabase (Cloud Database & Storage)

### Step 1: Create a Free Supabase Project
1. Go to **[https://supabase.com/](https://supabase.com/)** and sign in.
2. Click **`New Project`** and name it `maureh-perfumes`.
3. Choose a database region (e.g. Frankfurt or London).

### Step 2: Run Database Schema Script
1. In your Supabase project dashboard, open the **SQL Editor** (left navigation).
2. Click **`New query`**.
3. Open and copy the entire contents of [`supabase_schema.sql`](./supabase_schema.sql).
4. Paste it into the SQL Editor and click **`Run`**.
   * *This creates the `perfumes`, `orders`, and `vendors` tables with Realtime replication enabled!*

### Step 3: Connect in Maureh Admin Portal
1. Open your running Maureh Perfumes app at **[http://localhost:5173/](http://localhost:5173/)** (or on your live Vercel URL).
2. In the top bar, click **`Admin Portal`** (Passkey: `admin123`).
3. Click the **`Cloud DB`** button.
4. Copy your **Project URL** and **anon public API Key** from Supabase (*Project Settings → API*) and paste them into the wizard.
5. Click **`Connect to Supabase`**.
6. Click **`Seed 14 Default Perfumes to Supabase`** — your Supabase database is now live with all 14 luxury flacons!

---

## 🌐 Part 2: Deploying to Vercel (Live URL)

### Option A: 1-Click Terminal Deployment via Vercel CLI
Run the following command in your terminal from `C:\Users\trapc\.gemini\antigravity\scratch\maureh-perfumes`:

```bash
npx vercel
```

1. **Set up and deploy?** → Press `Y`
2. **Which scope?** → Select your personal account or team
3. **Link to existing project?** → `N`
4. **Project name?** → `maureh-perfumes`
5. **Directory?** → `./`
6. To deploy to **Production** with your custom domain or standard `.vercel.app`:
   ```bash
   npx vercel --prod
   ```

### Option B: Deploy via GitHub (Automatic CI/CD)
1. Initialize a git repository and push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial Maureh Perfumes marketplace"
   git remote add origin https://github.com/<your-username>/maureh-perfumes.git
   git push -u origin main
   ```
2. Go to **[https://vercel.com/new](https://vercel.com/new)** and import your `maureh-perfumes` repository.
3. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: *(Your Supabase Project URL)*
   - `VITE_SUPABASE_ANON_KEY`: *(Your Supabase Anon Key)*
4. Click **`Deploy`**. Vercel will automatically build and publish your site with SSL!

---

## 🔒 Default Credentials & Passkeys

| Portal | Role | Access / Credentials |
|---|---|---|
| **Admin Portal** | General Manager | Passcode: `admin123` (or `maureh2026`) |
| **Vendor Login** | Maison Niche Kenya | `maison@niche.co.ke` / `niche123` |
| **Vendor Login** | Arabian Oud Oasis | `sales@arabianoud.co.ke` / `oud123` |
| **Vendor Login** | The Decant Atelier | `contact@decants.co.ke` / `decant123` |
