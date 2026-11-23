# Set up Supabase (about 15 minutes, once)

1. Create an account at supabase.com → **New project**. Region: **Southeast Asia / Sydney (ap-southeast-2)**. Save the database password somewhere safe.
2. **Turn off public sign-up:** Authentication → Sign In / Providers → Email → switch **"Allow new users to sign up" OFF** (also called "Enable sign ups").
3. **Create your one account:** Authentication → Users → **Add user** → *Create new user*. Enter your email and a strong password. Tick *Auto Confirm User*.
4. **Create the tables:** SQL Editor → New query → paste the whole of `supabase/migrations/0001_init.sql` → Run. It should say "Success".
5. **Get the keys:** Project Settings → API. Copy the **Project URL** and the **anon public** key.
6. Create a file `.env` in the project folder (never commit it):
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```
7. `npm run dev`, open the address shown, sign in, and finish onboarding.
8. **Check security:** `SUPABASE_URL=… SUPABASE_ANON_KEY=… npx tsx scripts/rls-test.ts` — every line must say PASS.

Never put the `service_role` key in `.env` for the app or in git. It is only for `scripts/restore.ts` on your own computer.
For password-reset emails: Authentication → URL Configuration → add your site URL (and `http://localhost:5173`) to Redirect URLs.
