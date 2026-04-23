# Quick Database Setup Guide

## One-Time Initial Setup

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your Supabase URL and API keys

# 3. Initialize database schema
npm run db:setup

# 4. (Optional) Create demo data for testing
npm run db:seed

# 5. Verify security policies are active
npm run db:verify-rls
```

## Regular Commands

### Create a backup before making changes
```bash
npm run db:backup
```

### List all existing backups
```bash
npm run db:backup -- --list
```

### Test that RLS (Row-Level Security) is working
```bash
npm run db:verify-rls
```

### Create fresh demo data (clears existing)
```bash
npm run db:seed
```

## Environment Setup

Create `.env.local` with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## What Each Script Does

| Command | Purpose | Safe to Re-run? |
|---------|---------|-----------------|
| `npm run db:setup` | Initialize database schema | Yes ✓ |
| `npm run db:seed` | Create demo data | Yes (creates new records) |
| `npm run db:verify-rls` | Test security policies | Yes ✓ |
| `npm run db:backup` | Create compressed backup | Yes ✓ |

## Demo Credentials (after `npm run db:seed`)

- **Parent Email**: parent@isla.local
- **Child Email**: child@isla.local
- **Family**: Johnson Family

## Troubleshooting

**Script not found?**
```bash
npm install
```

**Environment variables not working?**
- Make sure `.env.local` exists in project root
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

**Migrations failed?**
- Check `.env.local` is configured correctly
- Verify Supabase project is accessible
- Check migration files exist in `supabase/migrations/`

**Need more help?**
See `scripts/README.md` for detailed documentation.

