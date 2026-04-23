# Deployment Verification Script

## Overview

The `verify-deployment.ts` script provides comprehensive automated health checks for Isla.site deployments, covering environment configuration, database connectivity, API functionality, database schema, security headers, and performance metrics.

## Usage

### Basic Verification (Development)

```bash
npm run verify:deployment
```

### Production Verification

```bash
npm run verify:deployment -- --production
```

### With Email Tests

```bash
npm run verify:deployment -- --test-email
```

### Help

```bash
npm run verify:deployment -- --help
```

## What Gets Verified

### 1. Environment Configuration ✅
- `NEXT_PUBLIC_SUPABASE_URL` presence and format validation
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` presence and length validation
- Ensures all required environment variables are set with correct formats

### 2. Database Connectivity ✅
- Supabase connection test via `auth.getSession()`
- Auth service accessibility verification
- Real-time subscriptions availability check

### 3. Database Schema ✅
Verifies presence of 7 key tables:
- `user_profiles` - User profile data
- `families` - Family records
- `posts` - Social posts
- `notifications` - Notification data
- `notification_preferences` - User notification preferences
- `invite_tokens` - Invitation tokens
- `child_approvals` - Child approval records

Each table is tested with a 5-second timeout to prevent hanging.

### 4. RLS (Row Level Security) Policies ✅
- Notes that RLS verification should be done manually in Supabase console
- Lists critical tables with RLS: user_profiles, families, posts, notifications, invite_tokens

### 5. API Endpoints ✅
Tests the following endpoints:
- `GET /api/health` - Health check endpoint
- `GET /api/notifications` - Retrieve notifications
- `GET /api/notifications/unread-count` - Get unread count
- `POST /api/posts/create` - Create a post
- `GET /api/families/my-families` - Get user's families

Each endpoint includes:
- HTTP status code validation
- Response time measurement
- 5-second timeout protection

### 6. Security Headers ✅
Verifies presence of security headers:
- `x-content-type-options` - Prevent MIME sniffing
- `x-frame-options` - Prevent clickjacking
- `x-xss-protection` - XSS protection

Production deployments also verify:
- HTTPS enforcement

### 7. Performance Metrics ✅
- Measures API response times across 3 sample requests
- Calculates average, minimum, and maximum response times
- Status based on thresholds:
  - **Pass**: < 500ms average
  - **Warn**: 500-1000ms average
  - **Fail**: > 1000ms average

## Output

### Console Output

Results are printed with color-coded status indicators:

```
╔════════════════════════════════════════════════════════════════╗
║         ISLA.SITE DEPLOYMENT VERIFICATION SCRIPT                ║
╚════════════════════════════════════════════════════════════════╝

▶ Checking Environment Variables
  ✓ NEXT_PUBLIC_SUPABASE_URL is set
  ✓ NEXT_PUBLIC_SUPABASE_URL has valid format
  ...

╔════════════════════════════════════════════════════════════════╗
║         VERIFICATION RESULTS                                    ║
╚════════════════════════════════════════════════════════════════╝

Total Tests: 22 | Passed: 20 | Failed: 2

✅ All checks passed!
```

Status indicators:
- ✓ (Green) - Test passed
- ✗ (Red) - Test failed
- ⊘ (Yellow) - Test skipped
- ⚠ (Yellow) - Test warned

### JSON Report

A detailed JSON report is generated at `verification-report.json`:

```json
{
  "timestamp": "2026-04-23T17:45:54.606Z",
  "environment": "production",
  "summary": {
    "total": 22,
    "passed": 20,
    "failed": 2,
    "skipped": 0
  },
  "results": [
    {
      "name": "NEXT_PUBLIC_SUPABASE_URL exists",
      "category": "Environment",
      "status": "pass",
      "message": "✓ NEXT_PUBLIC_SUPABASE_URL is set"
    },
    ...
  ],
  "performanceMetrics": {
    "API Response Time (avg)": 245,
    "API Response Time (min)": 198,
    "API Response Time (max)": 312
  }
}
```

## Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (format: `https://*.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (minimum 50 characters)

### Optional
- `DEPLOYMENT_URL` - Override production URL (default: `https://isla-site.vercel.app`)
- `BASE_URL` - Override development URL (default: `http://localhost:3000`)

The script automatically loads variables from `.env.local` if they're not set in the environment.

## Exit Codes

- **0** - All checks passed (or only warnings)
- **1** - One or more checks failed

## Development Considerations

### Local Development

```bash
# Ensure .env.local exists with valid Supabase credentials
npm run verify:deployment

# Check report
cat verification-report.json | jq '.summary'
```

### CI/CD Pipeline

```bash
# Add to GitHub Actions workflow
- name: Verify Deployment
  run: npm run verify:deployment -- --production
```

### Production Deployment

```bash
# Run after deployment
npm run verify:deployment -- --production

# Fail pipeline if verification fails
if [ $? -ne 0 ]; then
  echo "Deployment verification failed!"
  exit 1
fi
```

## Troubleshooting

### "Missing NEXT_PUBLIC_SUPABASE_URL"
- Ensure `.env.local` exists in project root
- Check file is readable and not empty
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set correctly

### "Database query failed"
- Verify Supabase URL format is correct
- Check Supabase service is accessible
- Ensure network connection is working

### "Table not found"
- Run database migrations: `npm run db:setup`
- Verify database schema is properly initialized
- Check Supabase project has correct database

### "API endpoint failed: fetch failed"
- Ensure development server is running: `npm run dev`
- Check API endpoint exists and is responding
- Verify base URL is correct for environment

### Performance Warnings
- Database may be slow; check Supabase performance
- API endpoints may need optimization
- Check network latency and server load

## Customization

To add additional checks:

1. Create a new verification function:
```typescript
async function verifyCustomCheck() {
  const category = 'Custom';
  console.log(`\n${colors.blue}▶ Checking Custom Check${colors.reset}`);
  
  // Perform check...
  recordCheck({
    name: 'Custom check name',
    category,
    status: 'pass', // or 'fail', 'skip', 'warn'
    message: '✓ Check passed',
  });
}
```

2. Call it from `main()`:
```typescript
async function main() {
  // ... existing checks ...
  await verifyCustomCheck();
  // ... rest of main ...
}
```

3. The check will automatically be included in results and reports.

## Best Practices

1. **Run Before Deployment**: Always run verification before pushing to production
2. **Store Reports**: Archive JSON reports for deployment tracking
3. **Monitor Performance**: Use performance metrics to track deployment quality
4. **Regular Checks**: Schedule periodic verification checks in CI/CD pipeline
5. **Review Failures**: Address failures immediately to prevent issues in production

## Dependencies

- `@supabase/supabase-js` - Supabase client
- `ts-node` - TypeScript execution (dev dependency)
- `typescript` - TypeScript compiler (dev dependency)

## Related Scripts

- `npm run db:setup` - Initialize database schema
- `npm run db:verify-rls` - Verify RLS policies
- `npm run db:seed` - Seed demo data
- `npm run db:backup` - Backup database

## Support

For issues or questions about the verification script:

1. Check the script logs for error messages
2. Review the JSON report for detailed results
3. Run individual verification steps manually
4. Check Supabase console for service status
5. Review environment variables configuration

## Maintenance

The script should be updated when:
- New API endpoints are added
- Database schema changes
- Security headers requirements change
- Performance benchmarks need adjustment
- New environment variables are introduced
