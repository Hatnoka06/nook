# Deploy (Vercel)

Live app: **https://uniflow-mu.vercel.app** (Vercel project `uni-flow3/uniflow`).

Ship a new version after changing code:
```bash
npx vercel deploy --prod
```
First time on another computer: `npx vercel login`, then `npx vercel link --project uniflow`.

The Supabase URL and anon key are stored as Vercel environment variables (Production), so nothing else is needed.
Supabase → Authentication → URL Configuration: Site URL `https://uniflow-mu.vercel.app`; redirect URLs `https://uniflow-mu.vercel.app/**` and `http://localhost:5173/**`.

Install on a phone: iPhone Safari → Share → Add to Home Screen. Android Chrome → menu → Install app.
