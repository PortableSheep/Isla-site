# Isla.site — Setup & Deploy

Short index for standing up and deploying the app. All other internal docs
(test reports, implementation notes, AI/agent references) have been moved to
[`docs/archive/`](docs/archive/).

## Getting the app running locally

1. **Install deps** — `npm install`
2. **Database** — follow [`QUICK_DATABASE_SETUP.md`](QUICK_DATABASE_SETUP.md)
   to create the Supabase project, apply migrations from `supabase/migrations/`,
   and seed reference data.
3. **Auth** — follow [`AUTH_SETUP.md`](AUTH_SETUP.md) to configure Supabase Auth
   (providers, redirect URLs, email templates) and wire up env vars.
4. **Env vars** — copy `.env.example` to `.env.local` and fill in the Supabase
   URL, anon key, and service role key produced by the two guides above.
5. **Run dev server** — `npm run dev` → http://localhost:3000

## Deploying to production

1. Work through [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) top-to-bottom
   (env vars, DB migrations applied, auth redirect URLs for prod domain, etc.).
2. Follow [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) for the actual platform
   steps (Vercel build settings, Supabase prod project, custom domain, CDN).
3. Verify `npm run build` succeeds locally before pushing.

## AI / agent guidance (kept at root by convention)

- [`AGENTS.md`](AGENTS.md) — primary agent instructions; read by Copilot CLI, Codex, etc.
- [`CLAUDE.md`](CLAUDE.md) — Claude Code-specific guidance.

These stay at the root because the tools that consume them expect them there.

## Everything else

Feature implementation notes, test summaries, redesign reports, audit trails,
and other historical / AI-generated documents live in
[`docs/archive/`](docs/archive/). They are reference material, not required for
setup or deploy.
