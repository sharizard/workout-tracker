# Deployment Instructions

## 1. GitHub Repository
Ensure your code is pushed to a GitHub repository.

## 2. Vercel Setup
1. Log in to [Vercel](https://vercel.com).
2. Click "Add New..." -> "Project".
3. Import your GitHub repository.
4. In the "Configure Project" screen:
    - **Framework Preset**: Next.js (should be auto-detected).
    - **Environment Variables**: Add the following variables (same as your `.env.local`):
        - `NEXT_PUBLIC_SUPABASE_URL`
        - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Deploy
Click "Deploy". Vercel will build your application and provide you with a live URL.

## 4. Supabase Auth Configuration
Once deployed, go to your Supabase Dashboard -> Authentication -> URL Configuration.
- Add your Vercel deployment URL (e.g., `https://fitness-tracker.vercel.app`) to "Site URL".
- Add `https://fitness-tracker.vercel.app/auth/callback` to "Redirect URLs".

## 5. CI/CD
A GitHub Action has been set up in `.github/workflows/ci.yml`. It will run `npm run lint` and `npm run build` on every push to `main` or pull request.
- To make the build pass in CI if it requires real credentials (it shouldn't for this dynamic app), you can add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your GitHub Repository Secrets.
