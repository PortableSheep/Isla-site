# Deployment Guide: Isla.site MVP

Complete step-by-step instructions for deploying Isla.site (Next.js + Supabase) to production on Vercel.

**Table of Contents:**
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development Setup](#local-development-setup)
4. [Supabase Project Setup](#supabase-project-setup)
5. [Database Migrations](#database-migrations)
6. [Vercel Deployment](#vercel-deployment)
7. [Email Service Integration](#email-service-integration)
8. [SSL/HTTPS Verification](#ssltls-verification)
9. [Post-Deployment Checks](#post-deployment-checks)
10. [Rollback Procedures](#rollback-procedures)
11. [Monitoring Setup](#monitoring-setup)
12. [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Prerequisites

Before deploying Isla.site, ensure you have the following installed:

### Required Software

```bash
# Check Node.js version (v18+ required)
node --version

# Check npm version (v9+ required)
npm --version

# Git for version control
git --version

# Install Vercel CLI globally
npm install -g vercel

# Install Supabase CLI globally
npm install -g supabase
```

### Required Versions
- **Node.js**: v18.17 or higher
- **npm**: v9 or higher
- **Git**: v2.30 or higher
- **Vercel CLI**: Latest version
- **Supabase CLI**: Latest version

### Required Accounts
- GitHub account (for repository hosting)
- Vercel account (for deployment)
- Supabase account (for database)
- Email service account (Resend or SendGrid)

### System Permissions
- Write access to `/Users/portablesheep/repos/Isla-site` (or your project directory)
- Network access to GitHub, Vercel, and Supabase APIs
- Ability to configure DNS records (for custom domains)

---

## Environment Setup

### Understanding Environment Variables

The Isla.site project requires three sets of environment variables:

| Variable | Type | Purpose | Source |
|----------|------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase API endpoint (safe to expose) | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Client-side auth key (safe to expose) | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Server-side admin key (DO NOT expose) | Supabase Dashboard |
| `VERCEL_DEPLOYMENT_TOKEN` | Secret | Vercel CLI authentication | Vercel Account Settings |
| `RESEND_API_KEY` | Secret | Email service authentication | Resend Dashboard |

### Local Development Environment

Create `.env.local` in the project root with all required variables:

```bash
# Navigate to project directory
cd /Users/portablesheep/repos/Isla-site

# Copy the example file
cp .env.local.example .env.local

# Edit with your actual values
nano .env.local
```

Complete `.env.local` example:

```env
# Supabase Configuration (public - safe to commit to .env.example)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Configuration (secret - DO NOT commit)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email Service (Resend)
RESEND_API_KEY=re_your_api_key_here

# Optional: Email Service Alternative (SendGrid)
# SENDGRID_API_KEY=SG.your_api_key_here

# Vercel Deployment Token (for CLI operations)
VERCEL_DEPLOYMENT_TOKEN=your_vercel_token_here
```

### Variable Retrieval Guide

#### Supabase Keys

1. Go to https://supabase.com/dashboard
2. Select your project → **Settings** → **API**
3. Find:
   - **Project URL**: Copy to `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key**: Copy to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key**: Copy to `SUPABASE_SERVICE_ROLE_KEY`

```
Supabase Dashboard Layout:
┌─────────────────────────────────────────────────┐
│ Settings → API                                  │
├─────────────────────────────────────────────────┤
│ Project URL                                     │
│ https://your-project-id.supabase.co             │
│                                                 │
│ Anon Key                                        │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...       │
│                                                 │
│ Service Role Key                                │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...       │
└─────────────────────────────────────────────────┘
```

#### Vercel Deployment Token

1. Go to https://vercel.com/account/tokens
2. Click **Create** (New Token)
3. Name: `Deployment Token`
4. Scope: `Full Account`
5. Copy the token to `VERCEL_DEPLOYMENT_TOKEN`

### Security Checklist

- [ ] `.env.local` is in `.gitignore` (never commit secrets)
- [ ] Secret keys are complex (20+ characters, mixed case/numbers/symbols)
- [ ] Public keys (`NEXT_PUBLIC_*`) are safe to expose in version control
- [ ] Secret keys are stored securely (password manager or vault)
- [ ] Different keys for dev/staging/production environments
- [ ] Verified no secrets in git history: `git log -p | grep -i "api_key\|secret\|token"`

---

## Local Development Setup

### Initial Setup

```bash
# 1. Clone repository (if starting fresh)
git clone https://github.com/PortableSheep/Isla-site.git
cd Isla-site

# 2. Install dependencies
npm install

# 3. Create .env.local with development values
cp .env.local.example .env.local
# Edit .env.local with your Supabase development project keys

# 4. Verify environment variables
npm run check:env  # If script exists, or manually verify

# 5. Start development server
npm run dev

# 6. Open browser
# Navigate to http://localhost:3000
```

### Development Server Commands

```bash
# Start development server (hot reload enabled)
npm run dev

# Build production bundle locally
npm run build

# Start production bundle (for testing before Vercel)
npm run start

# Run linting
npm run lint

# Format code (if configured)
npm run format  # If script exists
```

### Testing Local Build

Before deploying to production, test the production build locally:

```bash
# 1. Build production bundle
npm run build

# 2. Start production server
npm run start

# 3. Open http://localhost:3000 in browser

# 4. Test critical features:
#    - User sign-up/login
#    - Create post
#    - Load posts feed
#    - User profile
#    - Settings/preferences

# 5. Check console for errors (F12 → Console tab)

# 6. Stop server when done
# Press Ctrl+C
```

### Verify Database Connection

```bash
# Test Supabase connection with a simple query
npm run test:supabase  # If available, or use this manual test:

# Create a temporary test file
cat > test-supabase.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase.auth.getUser();
  if (error) console.error('Auth error:', error);
  else console.log('Connection successful! User:', data);
}

test();
EOF

# Run test
node test-supabase.js

# Clean up
rm test-supabase.js
```

---

## Supabase Project Setup

### Creating a New Supabase Project

1. **Access Dashboard**
   - Go to https://supabase.com/dashboard
   - Click **+ New project**

2. **Configure Project**
   - **Name**: `isla-site-prod` (or similar)
   - **Database Password**: Generate strong password (25+ chars)
     - Use `openssl rand -base64 32` to generate
     - Save securely in password manager
   - **Region**: Choose closest to target users
     - US-East: `us-east-1`
     - Europe: `eu-west-1`
     - Asia-Pacific: `ap-southeast-1`

3. **Project Creation**
   - Click **Create new project**
   - Wait 2-3 minutes for provisioning

4. **Initial Configuration**
   - Dashboard loads automatically
   - Navigate to **Settings** → **API** to retrieve keys
   - Copy keys to environment variables

### Configuring Authentication Providers

#### Email Authentication (Built-in)

1. Navigate to **Authentication** → **Providers**
2. Click **Email** (enabled by default)
3. Configure:
   - **Enable email confirmations**: Toggle ON
   - **Auto-confirm email**: Toggle OFF (for production)
   - **Secure email change**: Toggle ON

#### Google OAuth

1. Create Google Cloud Project:
   - Go to https://console.cloud.google.com
   - Create new project named "Isla-site"
   - Enable **Google+ API**

2. Create OAuth Credentials:
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs:
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     http://localhost:3000/auth/v1/callback
     https://your-production-domain.com/auth/v1/callback
     ```
   - Copy **Client ID** and **Client Secret**

3. Add to Supabase:
   - In Supabase Dashboard: **Authentication** → **Providers** → **Google**
   - Paste **Client ID** and **Client Secret**
   - Click **Save**

#### GitHub OAuth (Optional)

1. Create GitHub OAuth App:
   - Go to GitHub Settings → **Developer settings** → **OAuth Apps**
   - Click **New OAuth App**
   - Fill in details:
     - Application name: `Isla-site`
     - Authorization callback URL:
       ```
       https://your-project-id.supabase.co/auth/v1/callback
       ```

2. Copy credentials to Supabase:
   - **Authentication** → **Providers** → **GitHub**
   - Paste **Client ID** and **Client Secret**
   - Click **Save**

### Email Confirmation Configuration

1. Navigate to **Authentication** → **Email Templates**
2. Customize email templates:
   - **Confirmation Email**: Personalize with Isla branding
   - **Magic Link Email**: Update subject and body
   - **Change Email**: Update messaging
   - **Reset Password**: Update recovery instructions

3. Configure SMTP (optional for custom domain):
   - **Settings** → **Email** → **Enable Custom SMTP**
   - Provides better deliverability than Supabase default

### RLS (Row Level Security) Policies

RLS policies are automatically created during database migrations. Verify they're applied:

```bash
# Connect to Supabase database
supabase db pull  # Pulls current RLS policies

# Policies should include:
# - Families: Users see only their own
# - Posts: Users see only family posts
# - Users: Users see only their own profile
# - Notifications: Users see only their own notifications
```

---

## Database Migrations

### Understanding Migration Files

Isla.site includes 10+ migration files that set up the complete schema:

```
supabase/migrations/
├── 001_create_invite_tokens.sql      # Families & invite tokens
├── 002_create_child_approvals.sql    # Child account approval workflow
├── 003_create_posts.sql              # Posts and comments
├── 004_update_posts_for_isla.sql     # Isla-specific updates
├── 005_add_moderation_columns.sql    # Content moderation
├── 006_add_account_suspension.sql    # Account suspension
├── 007_add_suspension_rls_policies.sql # Suspension RLS rules
├── 007_expand_audit_logs.sql         # Audit logging
├── 008_create_notification_preferences.sql # Notification settings
├── 009_create_notifications.sql      # Notifications table
└── 010_add_reply_notification_fields.sql   # Reply notifications
```

### Running Migrations Locally

```bash
# 1. Start local Supabase instance
supabase start

# 2. Create migrations link
supabase link --project-id your-project-id

# 3. Push migrations to local instance
supabase db push

# 4. Verify migration status
supabase migration list

# 5. Check if all migrations applied successfully
supabase db pull  # Should show no pending changes
```

### Running Migrations on Production

```bash
# 1. Ensure Supabase project linked
supabase link --project-id your-production-project-id

# 2. Create backup before migrating
supabase db backup create --project-id your-production-project-id

# 3. Push migrations to production
supabase db push --project-id your-production-project-id

# 4. Verify migration status
supabase migration list --project-id your-production-project-id

# Example output:
# ┌────────────────────────────────────────────────────────────────┐
# │ name                            │ status        │ executed_at   │
# ├─────────────────────────────────┼───────────────┼───────────────┤
# │ 001_create_invite_tokens        │ Success       │ 2024-01-15... │
# │ 002_create_child_approvals      │ Success       │ 2024-01-15... │
# │ 003_create_posts                │ Success       │ 2024-01-15... │
# │ ... (all migrations)            │               │               │
# └────────────────────────────────────────────────────────────────┘
```

### Verifying Schema and RLS Policies

After migrations complete, verify the database schema:

```bash
# 1. Check tables exist
supabase db schema list --project-id your-project-id

# Should show tables:
# - families
# - invite_tokens
# - child_approvals
# - posts
# - comments
# - users (from auth)
# - notifications
# - notification_preferences
# - audit_logs

# 2. Verify RLS is enabled
supabase db shell --project-id your-project-id

-- In SQL shell:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All should show rowsecurity = true

# 3. Check RLS policies count
SELECT COUNT(*) FROM pg_policies;

-- Should show 30+ policies across tables
```

### Migration Rollback (If Needed)

```bash
# 1. Identify migration to rollback
supabase migration list --project-id your-project-id

# 2. Create rollback SQL file
# Note: Supabase doesn't auto-generate rollbacks
# Create manually: supabase/migrations/XXX_rollback_name.sql

# 3. Push rollback
supabase db push --project-id your-project-id

# 4. Verify tables restored
supabase db schema list --project-id your-project-id
```

---

## Vercel Deployment

### Connecting GitHub Repository

#### Prerequisites
- GitHub account with repository access
- Repository URL: `https://github.com/PortableSheep/Isla-site`

#### Steps

1. **Access Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Click **+ New Project**

2. **Import Repository**
   - Click **Import Git Repository**
   - Authenticate with GitHub (if needed)
   - Select `PortableSheep/Isla-site`
   - Click **Import**

3. **Configure Project**
   - **Project Name**: `isla-site` (auto-filled)
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

4. **Add Environment Variables**
   - Click **Environment Variables**
   - Add each variable:

   | Name | Value | Type |
   |------|-------|------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Public |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Public |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Secret |
   | `RESEND_API_KEY` | `re_...` | Secret |

   For each variable:
   - Paste name in **Name** field
   - Paste value in **Value** field
   - Select **Environment** (Production/Preview/Development)
   - Click **Save**

5. **Deploy**
   - Click **Deploy**
   - Wait for build to complete (3-5 minutes)
   - Click **Visit** when deployment completes

### Deployment Architecture

```
┌─────────────────┐
│  GitHub Repo    │
│ (Source Code)   │
└────────┬────────┘
         │ (Webhook on push)
         ▼
┌──────────────────────┐
│  Vercel Build        │
│  ├─ Install deps     │
│  ├─ Build Next.js    │
│  ├─ Run linting      │
│  └─ Deploy to CDN    │
└─────────┬────────────┘
          │ (Success)
          ▼
┌──────────────────────────┐
│  Vercel Production       │
│  ├─ Edge Network (100+)  │
│  ├─ Auto-scaling         │
│  └─ SSL/HTTPS            │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Supabase Backend        │
│  ├─ Auth                 │
│  ├─ Database             │
│  └─ Edge Functions       │
└──────────────────────────┘
```

### Custom Domain Setup

1. **Add Custom Domain in Vercel**
   - Project Settings → **Domains**
   - Click **+ Add**
   - Enter domain: `isla.site`
   - Click **Add**

2. **Update DNS Records**
   - Access domain registrar (GoDaddy, Namecheap, etc.)
   - Add CNAME record:
     ```
     Host: isla.site (or @)
     Type: CNAME
     Value: cname.vercel.com
     TTL: 3600 (default)
     ```

3. **Verify DNS Propagation**
   - Wait 24-48 hours for propagation
   - Test with: `nslookup isla.site`
   - Should resolve to Vercel CDN IP

4. **Enable Auto-Renewing SSL**
   - Vercel automatically provisions free SSL via Let's Encrypt
   - Takes ~5-10 minutes after DNS is live
   - Verify: Check lock icon in browser address bar

### Deployment Triggers

Deployments automatically trigger on:
- **Push to main branch**: Production deployment
- **Push to other branches**: Preview deployment (unique URL)
- **Pull requests**: Automatic preview deployments

Manual deployment:
```bash
# Using Vercel CLI
vercel deploy --prod

# Or through dashboard
# Project → Deployments → click ellipsis (...) → Redeploy
```

---

## Email Service Integration

### Option 1: Resend (Recommended)

**Resend** is a modern email service with excellent Next.js integration.

#### Setup

1. **Create Resend Account**
   - Go to https://resend.com
   - Click **Get Started**
   - Sign up with email or GitHub
   - Verify email address

2. **Generate API Key**
   - Dashboard → **API Keys**
   - Click **Create API Key**
   - Copy key to `RESEND_API_KEY` in `.env.local`

3. **Configure Sender Domain**
   - Dashboard → **Domains**
   - Click **Add Domain**
   - Add your domain (e.g., `noreply@isla.site`)
   - Follow DNS verification steps
   - Add SPF/DKIM records to your domain registrar

4. **Verify Setup**
   ```bash
   # Create test email function
   cat > test-resend.js << 'EOF'
   const { Resend } = require('resend');
   const resend = new Resend(process.env.RESEND_API_KEY);

   async function testEmail() {
     const result = await resend.emails.send({
       from: 'test@isla.site',
       to: 'your-email@example.com',
       subject: 'Test Email',
       html: '<p>This is a test email from Isla</p>',
     });
     console.log('Result:', result);
   }

   testEmail();
   EOF

   # Run test
   node test-resend.js

   # Clean up
   rm test-resend.js
   ```

#### Email Template Setup

Create email templates in `src/lib/emails/`:

```typescript
// src/lib/emails/welcome.ts
export function getWelcomeEmail(userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h1>Welcome to Isla, ${userName}!</h1>
        <p>We're excited to have you join our family-focused community.</p>
        <p><a href="https://isla.site">Get Started</a></p>
      </body>
    </html>
  `;
}
```

### Option 2: SendGrid (Alternative)

**SendGrid** is another popular email service with robust features.

#### Setup

1. **Create SendGrid Account**
   - Go to https://sendgrid.com
   - Click **Create Account**
   - Complete registration and email verification

2. **Generate API Key**
   - Dashboard → **Settings** → **API Keys**
   - Click **Create API Key**
   - Copy key to `SENDGRID_API_KEY` in `.env.local`

3. **Configure Sender Email**
   - Dashboard → **Settings** → **Sender Authentication**
   - Verify sender domain with DNS records

4. **Send Test Email**
   ```bash
   cat > test-sendgrid.js << 'EOF'
   const sgMail = require('@sendgrid/mail');
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);

   const msg = {
     to: 'test@example.com',
     from: 'noreply@isla.site',
     subject: 'Test Email',
     html: '<p>This is a test email from Isla</p>',
   };

   sgMail
     .send(msg)
     .then(() => console.log('Email sent'))
     .catch(error => console.error(error));
   EOF

   node test-sendgrid.js
   rm test-sendgrid.js
   ```

### Email Service Comparison

| Feature | Resend | SendGrid |
|---------|--------|----------|
| **Pricing** | $20/month + usage | Free tier + usage |
| **Next.js Integration** | Native support | via SDK |
| **Email Templates** | Built-in | Available |
| **Deliverability** | 99%+ | 99%+ |
| **Support** | Good | Excellent |
| **Setup Time** | 5-10 min | 10-15 min |

---

## SSL/TLS Verification

### Automatic SSL (Vercel)

Vercel automatically provisions free SSL certificates via Let's Encrypt:

```bash
# 1. Verify certificate is active
openssl s_client -connect isla.site:443 -servername isla.site

# Expected output includes:
# subject=CN = isla.site
# issuer=C = US, O = Let's Encrypt, CN = R3

# 2. Check certificate expiration
echo | openssl s_client -servername isla.site -connect isla.site:443 2>/dev/null | openssl x509 -noout -dates

# Output should show:
# notBefore=Jan 15 12:34:56 2024 GMT
# notAfter=Apr 15 12:34:56 2024 GMT
```

### HSTS Header Verification

HTTP Strict Transport Security ensures browsers always use HTTPS:

```bash
# 1. Check HSTS header
curl -I https://isla.site | grep -i "strict-transport-security"

# Expected output:
# Strict-Transport-Security: max-age=63072000; includeSubDomains

# 2. Add HSTS headers (if not present)
# Edit next.config.ts:
```

Add to `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Certificate Chain Verification

```bash
# 1. Get full certificate chain
openssl s_client -connect isla.site:443 -servername isla.site -showcerts

# 2. Verify chain is valid (no errors or warnings)
openssl x509 -text -noout -in <cert_file>

# 3. Test with certificate validators
# Use online tools:
# - https://www.ssllabs.com/ssltest/
# - https://www.geocerts.com/ssl-checker
# Both should show "A" rating or higher
```

---

## Post-Deployment Checks

### Health Check Tests

Run these tests after deployment to verify all systems:

```bash
# 1. Check HTTP status
curl -w "%{http_code}\n" -o /dev/null -s https://isla.site
# Expected: 200

# 2. Check response headers
curl -I https://isla.site
# Expected:
# HTTP/2 200
# content-type: text/html; charset=utf-8
# strict-transport-security: max-age=63072000
```

### Feature Verification

Test core functionality in production:

#### 1. Authentication
- [ ] Can sign up with email
- [ ] Receives confirmation email
- [ ] Can sign in
- [ ] Can sign out
- [ ] Password reset works
- [ ] OAuth (Google) works if configured

#### 2. User Profiles
- [ ] Can view own profile
- [ ] Can update profile information
- [ ] Can upload profile picture
- [ ] Privacy settings respected

#### 3. Family Management
- [ ] Can create family
- [ ] Can generate invite links
- [ ] Family members can join
- [ ] Can manage family settings
- [ ] Can remove family members

#### 4. Posts & Content
- [ ] Can create post
- [ ] Can add comments
- [ ] Can edit own posts
- [ ] Can delete own posts
- [ ] Feed shows posts from family
- [ ] Timestamps are correct

#### 5. Notifications
- [ ] Comment notifications sent
- [ ] Reply notifications sent
- [ ] Can adjust notification preferences
- [ ] Email notifications (if configured)

#### 6. Moderation
- [ ] Can report content (if available)
- [ ] Content flagging works
- [ ] Admin suspension works

#### 7. Performance
- [ ] Pages load in < 3 seconds
- [ ] Images optimized and cached
- [ ] Database queries efficient
- [ ] No console errors (F12)

### Database Verification

```bash
# 1. Verify tables exist and have data
supabase db shell --project-id your-project-id

-- Check user count
SELECT COUNT(*) as user_count FROM auth.users;

-- Check families
SELECT COUNT(*) as family_count FROM families;

-- Check posts
SELECT COUNT(*) as post_count FROM posts;

-- Check RLS policies active
SELECT schemaname, tablename FROM pg_tables 
WHERE rowsecurity = true ORDER BY tablename;

-- Expected output: All public tables should have rowsecurity = true
```

### Browser Console Checks

1. Open production URL in browser
2. Open Developer Tools (F12)
3. Check **Console** tab for errors
4. Check **Network** tab:
   - All requests should return 200 or 304
   - No failed CSS/JS loads
   - Images loading correctly

### Lighthouse Performance Audit

```bash
# 1. Run Lighthouse via Chrome DevTools
# - Open DevTools (F12)
# - Click "Lighthouse" tab
# - Click "Generate report"

# Expected scores (target):
# - Performance: ≥80
# - Accessibility: ≥90
# - Best Practices: ≥90
# - SEO: ≥90

# 2. Or use CLI:
npm install -g lighthouse

lighthouse https://isla.site --view --chrome-flags="--headless"
```

---

## Rollback Procedures

### Quick Rollback to Previous Deployment

If the current deployment has critical issues:

```bash
# 1. Identify previous deployment
# Option A: Via Vercel Dashboard
# - Project → Deployments
# - Find successful previous deployment
# - Click "..." → "Promote to Production"

# Option B: Via Vercel CLI
vercel deployments list

# Find the deployment before current one
# Note its ID (e.g., abc123xyz)

# 2. Promote previous deployment
vercel promote abc123xyz

# 3. Verify rollback
curl https://isla.site  # Should work with previous code

# 4. Notify team of rollback
# Document reason in commit message
```

### Git-Based Rollback

If you need to revert code to previous commit:

```bash
# 1. Identify commit to rollback to
git log --oneline | head -10

# Example output:
# abc1234 (HEAD, main) Feature: new notification system
# def5678 Fix: email validation bug
# ghi9012 Feature: user profiles

# 2. Revert to previous commit (creates new commit)
git revert abc1234

# Or: Reset to previous commit (rewrites history - use with caution)
# git reset --hard def5678

# 3. Push rollback commit
git push origin main

# 4. Vercel automatically redeploys from new commit
```

### Database Rollback

If database migrations caused issues:

```bash
# 1. Check backup created before migration
supabase db backup list --project-id your-project-id

# 2. Restore from backup (WARNING: Data loss after backup point)
supabase db restore --project-id your-project-id \
  --backup-id backup_id_here

# 3. Verify tables restored
supabase db schema list --project-id your-project-id

# 4. Test application with restored database
npm run dev  # Local test
```

### Partial Rollback (Selective Revert)

For selective feature rollback without full revert:

```bash
# 1. Create feature branch from main
git checkout -b revert/feature-name

# 2. Remove specific changes
git revert abc1234  # Specific commit

# 3. Test locally
npm run build
npm run start

# 4. Push and create PR for review
git push origin revert/feature-name
# Then create PR on GitHub

# 5. Merge when approved
# GitHub merges to main → Vercel redeploys
```

---

## Monitoring Setup

### Error Tracking

#### Option 1: Sentry (Recommended)

1. **Create Sentry Account**
   - Go to https://sentry.io
   - Click **Sign Up**
   - Create project for Next.js
   - Copy DSN key

2. **Install Sentry SDK**
   ```bash
   npm install @sentry/nextjs
   ```

3. **Configure in `next.config.ts`**
   ```typescript
   import { withSentryConfig } from "@sentry/nextjs";
   import type { NextConfig } from "next";

   const nextConfig: NextConfig = {
     // Your config
   };

   export default withSentryConfig(nextConfig, {
     org: "your-org",
     project: "isla-site",
     authToken: process.env.SENTRY_AUTH_TOKEN,
   });
   ```

4. **Add Environment Variable**
   - Add `SENTRY_DSN` to Vercel environment variables
   - Value from Sentry dashboard

#### Option 2: Vercel Analytics (Built-in)

Vercel provides built-in analytics:

1. **Enable in Vercel Dashboard**
   - Project → **Settings** → **Analytics**
   - Click **Enable**
   - Wait for data collection (~24 hours)

2. **View Analytics**
   - Dashboard → **Analytics** tab
   - See Core Web Vitals, page load times

### Performance Monitoring

#### Core Web Vitals

Monitor in Vercel Analytics:
- **LCP** (Largest Contentful Paint): Target < 2.5s
- **FID** (First Input Delay): Target < 100ms
- **CLS** (Cumulative Layout Shift): Target < 0.1

#### Database Performance

```bash
# 1. Check slow queries
supabase db shell --project-id your-project-id

-- Find slow queries (>100ms)
SELECT 
  mean_time,
  calls,
  query
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;

-- 2. Add indexes for slow queries
CREATE INDEX idx_posts_family_created 
ON posts(family_id, created_at DESC);

-- 3. Analyze query plans
EXPLAIN ANALYZE SELECT * FROM posts WHERE family_id = 'xxx';
```

### Uptime Monitoring

#### Option 1: Uptime Robot (Free)

1. **Create Account**
   - Go to https://uptimerobot.com
   - Click **Sign Up**

2. **Add Monitor**
   - Click **+ Add Monitor**
   - Type: HTTPS
   - URL: https://isla.site
   - Check interval: 5 minutes
   - Alerts: Email

3. **Verify**
   - Should start monitoring immediately
   - Sends alerts if site down

#### Option 2: Vercel Status Page

Vercel provides status monitoring:
- https://vercel.com/dashboard/activity
- Shows deployment history and status

### Log Monitoring

#### Vercel Functions Logs

```bash
# View real-time logs
vercel logs isla-site --follow

# View logs from specific time
vercel logs isla-site --since 2024-01-15T10:00:00Z
```

#### Supabase Logs

1. **Access Supabase Logs**
   - Dashboard → **Logs** → **API**
   - See API requests and errors
   - Filter by status, endpoint, etc.

2. **View Slow Queries**
   - **Logs** → **Database** → **Slow Queries**

3. **Real-time Monitoring**
   - Use `supabase realtime` for live data

---

## Common Issues & Troubleshooting

### Authentication Issues

#### Problem: "Invalid API key" error

**Symptoms**: 
- Can't sign up or login
- Console error: `Invalid API key`

**Solution**:
```bash
# 1. Verify Supabase keys in environment
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. Check keys are current (not rotated)
# - Supabase Dashboard → Settings → API

# 3. Verify Supabase project is active
# - Dashboard → Home → Project status should be "Active"

# 4. Check CORS settings (if cross-domain)
# - Supabase Dashboard → Settings → API → CORS
# - Add your domain: https://isla.site
```

#### Problem: "User not confirmed" despite email verification

**Symptoms**:
- Can receive confirmation email
- Can't log in after clicking confirmation link

**Solution**:
```bash
# 1. Check email templates
# Supabase Dashboard → Authentication → Email Templates
# Verify confirmation link includes correct domain

# 2. Check if auto-confirm is off (for production)
# Authentication → Providers → Email
# Toggle "Auto-confirm email" should be OFF

# 3. Manually confirm user (admin only)
supabase db shell --project-id your-project-id

-- Find user
SELECT id, email FROM auth.users WHERE email = 'user@example.com';

-- Confirm user
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'user@example.com';
```

### Database Connection Issues

#### Problem: "Could not connect to database"

**Symptoms**:
- Page shows database error
- Application crashes on load
- 500 Internal Server Error

**Solution**:
```bash
# 1. Check Supabase project status
# Dashboard → Home
# Project status should be "Active"

# 2. Verify database credentials
echo $SUPABASE_SERVICE_ROLE_KEY
# Should be set and not empty

# 3. Test database connection
supabase status --project-id your-project-id

# 4. Check RLS policies aren't blocking access
supabase db shell --project-id your-project-id

-- Count enabled policies
SELECT COUNT(*) FROM pg_policies;

-- 5. Restart Supabase instance
supabase stop
supabase start
```

#### Problem: "Relation does not exist" (after migration)

**Symptoms**:
- Can't create/read posts
- Error mentions missing table
- Happens after deployment

**Solution**:
```bash
# 1. Check migration status
supabase migration list --project-id your-project-id

# Find failed migrations (status = "error")

# 2. View migration error
supabase migration list --project-id your-project-id --verbose

# 3. Manually apply failed migration
supabase db push --project-id your-project-id

# 4. Verify tables exist
supabase db schema list --project-id your-project-id

# 5. If migration corrupted, restore from backup
supabase db backup list --project-id your-project-id
# Then restore from previous backup
```

### Deployment Issues

#### Problem: Build fails on Vercel

**Symptoms**:
- Red X on deployment
- Build logs show errors
- Error message mentions TypeScript or linting

**Solution**:
```bash
# 1. Test build locally
npm run build

# 2. Fix any errors shown
# Common issues:
# - TypeScript errors: Check src/ files
# - Missing imports: Run npm install
# - Env variable not set: Add to .env.local

# 3. View Vercel build logs
vercel logs isla-site --failed

# 4. Push fix and redeploy
git add .
git commit -m "Fix: build error"
git push origin main
# Vercel automatically redeploys
```

#### Problem: "Command not found: npm"

**Symptoms**:
- Vercel build fails
- Error: "npm: command not found"

**Solution**:
```bash
# 1. Check Node.js version in Vercel project settings
# Settings → General → Node.js Version
# Should be ≥18.17

# 2. Specify Node version in .nvmrc
echo "18.17" > .nvmrc
git add .nvmrc
git commit -m "chore: specify Node.js version"
git push origin main

# 3. Force rebuild
vercel deploy --prod
```

### Email Service Issues

#### Problem: "Email not sending"

**Symptoms**:
- User doesn't receive confirmation email
- No error in logs
- Email service shows 0 sent

**Solution**:
```bash
# 1. Check email service credentials
echo $RESEND_API_KEY
# Should be set (starts with "re_")

# 2. Test email service directly
cat > test-email.js << 'EOF'
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  const result = await resend.emails.send({
    from: 'test@isla.site',
    to: 'your-email@example.com',
    subject: 'Test',
    html: '<p>Test</p>',
  });
  console.log('Result:', result);
}

test();
EOF

node test-email.js
rm test-email.js

# 3. Check email domain verified
# Resend Dashboard → Domains
# Domain should show "Verified"

# 4. Add domain SPF/DKIM records if not verified
# Follow Resend instructions for DNS records
```

#### Problem: "Email goes to spam"

**Symptoms**:
- Emails received but in spam folder
- User marks as spam manually

**Solution**:
```bash
# 1. Check SPF/DKIM/DMARC records
# Use online tool: https://mxtoolbox.com/
# Enter domain: isla.site
# All records should show "Pass"

# 2. Add DMARC record to DNS
# Host: _dmarc
# Type: TXT
# Value: v=DMARC1; p=none; rua=mailto:admin@isla.site

# 3. Verify sender email address
# In email templates, use:
# from: "Isla <noreply@isla.site>"
# Not: from: "test@gmail.com"

# 4. Include unsubscribe link in emails
# Required by Gmail/Outlook
# Add to email template:
# <a href="{{unsubscribe_link}}">Unsubscribe</a>
```

### Performance Issues

#### Problem: Slow page loads (> 5 seconds)

**Symptoms**:
- Users complain about slow loading
- Lighthouse score low (< 60)
- Database queries slow

**Solution**:
```bash
# 1. Run Lighthouse audit
lighthouse https://isla.site --view

# 2. Check images are optimized
# Next.js `<Image>` component should handle optimization
# Verify in Network tab:
# - Images should be WebP format
# - Size should be < 100KB for thumbnails

# 3. Check database query performance
supabase db shell --project-id your-project-id

-- Find slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC 
LIMIT 5;

-- Add index for slow query
CREATE INDEX idx_name ON table(column);

# 4. Enable caching
# Edit src/app/layout.tsx:
// Add cache headers
export const metadata: Metadata = {
  // ...
};

export const revalidate = 3600; // Cache 1 hour
```

#### Problem: High memory/CPU usage

**Symptoms**:
- Vercel shows high usage
- Deployment times out
- Application crashes

**Solution**:
```bash
# 1. Check for memory leaks
# Add to src/app/layout.tsx or relevant component:
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    console.log('Memory:', process.memoryUsage());
  }, 30000);
}

# 2. Optimize database queries
# Use explain analyze to find expensive queries
supabase db shell --project-id your-project-id

EXPLAIN ANALYZE SELECT * FROM posts 
WHERE family_id = 'xxx' 
ORDER BY created_at DESC;

# 3. Add pagination
# Don't load all posts at once
# Load 20 per page, add "Load More" button

# 4. Enable compression
# Edit next.config.ts:
const nextConfig: NextConfig = {
  compress: true,
};
```

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build production
npm run start            # Start production server
npm run lint             # Run linter

# Supabase
supabase link            # Link to project
supabase push            # Push migrations
supabase db shell        # SQL shell
supabase status          # Check status
supabase logs            # View logs

# Vercel
vercel deploy --prod     # Deploy to production
vercel logs              # View deployment logs
vercel env               # Manage env vars
vercel deployments list  # List deployments
```

### Key URLs

| URL | Purpose |
|-----|---------|
| https://isla.site | Production application |
| https://vercel.com/dashboard | Deployments & logs |
| https://supabase.com/dashboard | Database & auth |
| https://resend.com/emails | Email service |
| https://github.com/PortableSheep/Isla-site | Source code |

### Support Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Resend Docs**: https://resend.com/docs
- **Deployment Checklist**: See `DEPLOYMENT_CHECKLIST.md`

---

## Appendix: Pre-Deployment Checklist

Before deploying to production, verify:

### Code Quality
- [ ] All tests pass: `npm run test` (if configured)
- [ ] Linting clean: `npm run lint`
- [ ] No console errors: `npm run build && npm run start`
- [ ] All environment variables set in `.env.local`
- [ ] No secrets in source code: `git log -p | grep -i "api_key"`

### Database
- [ ] All migrations tested locally: `supabase db push`
- [ ] RLS policies verified: All tables have `rowsecurity = true`
- [ ] Backup created: `supabase db backup create`
- [ ] No data loss expected: Reviewed migration SQL files

### Infrastructure
- [ ] Vercel project created and linked
- [ ] All environment variables added to Vercel
- [ ] Custom domain DNS records ready
- [ ] SSL certificate configured

### Email Service
- [ ] Email service account created (Resend or SendGrid)
- [ ] API key generated and added to Vercel
- [ ] Sender domain verified
- [ ] Test email sent successfully

### Security
- [ ] All secrets stored securely (not in git)
- [ ] HTTPS/SSL configured
- [ ] HSTS headers enabled
- [ ] CORS settings configured
- [ ] RLS policies prevent unauthorized access

### Monitoring
- [ ] Error tracking set up (Sentry or Vercel)
- [ ] Uptime monitoring configured
- [ ] Performance monitoring enabled
- [ ] Log aggregation ready

### Documentation
- [ ] Team knows deployment procedure
- [ ] Rollback plan documented
- [ ] Post-deployment checks planned
- [ ] Support contacts identified

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**Maintained By**: Isla Development Team

For questions or updates to this guide, contact the team lead or open an issue in the GitHub repository.
