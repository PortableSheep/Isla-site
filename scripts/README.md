# Database Scripts

This directory contains TypeScript scripts for managing the Isla database, including setup, seeding, verification, and backup operations.

## Prerequisites

- Node.js 18+
- TypeScript 5+
- Supabase CLI (optional, for advanced operations)
- Environment variables configured:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Installation

Install the required dependencies:

```bash
npm install
```

This installs `ts-node` which is needed to run TypeScript scripts directly.

## Scripts

### 1. Database Setup (`db:setup`)

Initializes the database by running all migrations and verifying the schema.

**Usage:**
```bash
npm run db:setup
```

**What it does:**
- Reads all migration files from `supabase/migrations/` in order
- Executes each migration sequentially
- Verifies migrations completed successfully
- Checks that RLS policies are enabled
- Creates performance indexes
- Validates schema matches expectations

**Output:**
- Migration execution logs
- RLS policy verification status
- Index creation confirmation
- Schema validation results

**Idempotent:** Yes - safe to run multiple times

### 2. Demo Data Seeding (`db:seed`)

Creates sample data for demonstration and testing purposes.

**Usage:**
```bash
npm run db:seed              # Demo mode (default)
npm run db:seed -- --demo-only    # Explicit demo mode
npm run db:seed -- --production   # Production warning mode
```

**What it creates:**
- Demo parent user (Sarah Johnson)
- Demo child user (Emma Johnson)
- Demo family (Johnson Family)
- Approved child profile
- 5 sample posts (family updates)
- 10-15 sample replies/comments
- Sample notifications
- Sample audit log entries

**Demo Credentials:**
- Parent Email: `parent@isla.local`
- Parent Name: Sarah Johnson
- Child Email: `child@isla.local`
- Child Name: Emma Johnson

**Flags:**
- `--demo-only`: Run in demo mode (default, safe for development)
- `--production`: Run in production with warnings

**Idempotent:** Partial - creates new records each time, but uses UUIDs so won't fail on re-run

### 3. RLS Verification (`db:verify-rls`)

Tests Row-Level Security (RLS) policies to ensure data isolation is working correctly.

**Usage:**
```bash
npm run db:verify-rls
```

**What it tests:**
- Family data isolation between users
- User profile access restrictions
- Post visibility controls
- Invite token access permissions
- Auth token enforcement
- Post flag visibility
- Notification recipient restrictions
- Audit log access controls

**Output:**
- Individual test results (✓ pass or ✗ fail)
- Summary with pass rate
- Detailed messages for each test

**Exit Codes:**
- `0`: All tests passed
- `1`: One or more tests failed

**Idempotent:** Yes - read-only operations

### 4. Database Backup (`db:backup`)

Creates compressed SQL backups of the database for disaster recovery.

**Usage:**
```bash
npm run db:backup              # Create backup (default)
npm run db:backup -- --create  # Create backup (explicit)
npm run db:backup -- --list    # List all backups
npm run db:backup -- --help    # Show help
```

**What it does:**
- Creates a SQL backup file
- Compresses it with gzip
- Stores it in `backups/` directory
- Prints backup location and size

**Output:**
- Backup file path
- Compressed size
- Production backup instructions

**Backup Directory Structure:**
```
project/
├── backups/
│   ├── isla_backup_2024-01-15T10-30-45.sql.gz
│   ├── isla_backup_2024-01-14T09-15-20.sql.gz
│   └── ...
```

**Idempotent:** Yes - each backup is timestamped uniquely

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

For production backups with full pg_dump access, you may also need:

```env
SUPABASE_DB_HOST=db.your-project.supabase.co
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-password
```

## Workflow Examples

### Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up database schema
npm run db:setup

# 3. Seed demo data (optional)
npm run db:seed

# 4. Verify RLS policies
npm run db:verify-rls

# 5. Create first backup
npm run db:backup
```

### Development

```bash
# Verify RLS is working
npm run db:verify-rls

# Create a checkpoint backup before major changes
npm run db:backup
```

### Production

```bash
# Before deployment, verify everything is set up
npm run db:setup

# Verify security policies are active
npm run db:verify-rls

# Regular backups (schedule with cron or CI/CD)
npm run db:backup
```

## Troubleshooting

### Script won't run
- Ensure `ts-node` is installed: `npm install`
- Check Node.js version: `node --version` (should be 18+)

### Environment variables not found
- Create `.env.local` in project root
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### Migrations fail
- Check that migrations are in `supabase/migrations/` directory
- Verify file naming: `001_*.sql`, `002_*.sql`, etc.
- Ensure Supabase project exists and is accessible

### RLS tests show failures
- This might indicate RLS policies aren't fully applied yet
- Run `npm run db:setup` again to ensure all policies are created
- Check Supabase dashboard for policy details

### Backup fails
- Ensure `backups/` directory is writable
- Check disk space for compressed backup
- For full pg_dump: verify database credentials

## Advanced Operations

### Listing Backups

```bash
npm run db:backup -- --list
```

Shows all available backups with size and creation date.

### Restoring from Backup

```bash
# Decompress backup
gunzip backups/isla_backup_TIMESTAMP.sql.gz

# Restore to database (requires admin access)
psql -h db.your-project.supabase.co -U postgres -d postgres -f isla_backup_TIMESTAMP.sql
```

### Running Migrations Manually

If `db:setup` encounters issues, you can run migrations manually:

```bash
# Connect to database and run manually
psql -h db.your-project.supabase.co -U postgres -d postgres
\i supabase/migrations/001_create_invite_tokens.sql
\i supabase/migrations/002_create_child_approvals.sql
-- ... etc
```

## Best Practices

1. **Always backup before major changes:**
   ```bash
   npm run db:backup
   ```

2. **Verify RLS after schema changes:**
   ```bash
   npm run db:verify-rls
   ```

3. **Test in development first:**
   - Use demo data for testing
   - Run `db:verify-rls` to catch issues early

4. **Keep backups organized:**
   - Backups are timestamped automatically
   - Review and archive old backups periodically

5. **Document manual changes:**
   - If making schema changes directly in Supabase dashboard, create a new migration file
   - Keep migrations in version control

## Database Schema

The scripts work with the following tables:

- `families` - Family groupings
- `user_profiles` - User role and family membership
- `invite_tokens` - Invite links for family members
- `child_approvals` - Child account approval history
- `posts` - Family wall posts and replies
- `post_flags` - Moderation flags on posts
- `notifications` - User notifications
- `notification_preferences` - User notification settings
- `audit_logs` - Admin audit trail

## Support

For issues or questions:

1. Check `.env.local` configuration
2. Review Supabase project settings
3. Check script error messages and logs
4. Verify database connectivity

## License

Part of Isla - Family First Platform
