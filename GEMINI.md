# Isla-site

## Project Overview
Isla-site is a Next.js web application built with React 19 and Next.js 16. It serves as a platform with user authentication, user profiles (parents and children), and a "wall" for posts. It features a special "Isla" role with capabilities to broadcast posts to all families.

**Key Technologies:**
- **Framework:** Next.js (App Router)
- **UI/Styling:** Tailwind CSS, Lucide React
- **Database & Auth:** Supabase (with Row-Level Security)
- **Testing:** Playwright (E2E)
- **Language:** TypeScript

## Architecture & Structure
- `app/`: Next.js App Router structure. Contains routes like `(protected)` for authenticated views, `auth/` for login/signup, and `api/` for backend endpoints.
- `src/components/`: Reusable React components.
- `src/lib/`: Utility functions and core logic (e.g., Supabase client, Isla role detection).
- `supabase/migrations/`: Database schema definitions and migrations.
- `scripts/`: Utility scripts for database setup, seeding, and deployment verification.
- `tests/e2e/`: Playwright end-to-end tests.
- `docs/archive/`: Historical feature implementation notes, test summaries, and reference materials.

## Development Commands
The project uses `npm` as the package manager.

- **Start Development Server:** `npm run dev`
- **Build for Production:** `npm run build`
- **Lint:** `npm run lint`

### Database Scripts
- **Initialize Schema:** `npm run db:setup`
- **Seed Demo Data:** `npm run db:seed`
- **Test Security Policies (RLS):** `npm run db:verify-rls`
- **Create Backup:** `npm run db:backup`

### Testing
- **Run E2E Tests:** `npm run test:e2e`
- **Run E2E Tests (UI Mode):** `npm run test:e2e:ui`
- **Run Auth Tests:** `npm run test:auth`

## Development Conventions
- **Routing:** Uses Next.js App Router (`app/`).
- **Database:** Supabase with strict Row-Level Security (RLS) policies.
- **Documentation:** High-level setup docs are kept at the root (`SETUP.md`, `QUICK_DATABASE_SETUP.md`, `DEPLOYMENT_CHECKLIST.md`), while feature-specific and historical documentation is moved to `docs/archive/`.
- **AI/Agent Notes:** The project maintains `AGENTS.md` and `CLAUDE.md` in the root for specific agent instructions. Specifically, note that this project uses a version of Next.js that may have breaking changes from standard training data; consult local documentation when writing code.