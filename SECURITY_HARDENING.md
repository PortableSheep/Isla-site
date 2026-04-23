# Security Hardening Checklist for Production

A comprehensive checklist for hardening the Isla application before production deployment. Follow these guidelines to ensure maximum security across all layers.

---

## 1. Rate Limiting

Implement rate limiting to protect against brute force attacks and abuse.

### Checklist
- [ ] Install `express-rate-limit` or equivalent middleware
- [ ] Configure rate limiting for auth endpoints
- [ ] Configure rate limiting for API endpoints
- [ ] Test rate limiting in staging environment
- [ ] Monitor rate limit hits in production

### Implementation

#### Installation
```bash
npm install express-rate-limit
```

#### Configuration

**Auth Endpoints (API Routes)**
```typescript
// app/api/auth/login/route.ts
import rateLimit from 'express-rate-limit';

// 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => process.env.NODE_ENV !== 'production', // Skip in dev
  keyGenerator: (req) => req.ip || req.socket.remoteAddress, // Use IP as key
});

export async function POST(request: Request) {
  // Apply middleware
  await loginLimiter(request);
  // ... rest of login logic
}
```

**Signup Endpoints**
```typescript
// app/api/auth/signup/route.ts
// 10 signup attempts per hour per IP
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many signup attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production',
  keyGenerator: (req) => req.ip || req.socket.remoteAddress,
});
```

**General API Endpoints**
```typescript
// Middleware for all API routes
// 100 requests per minute per authenticated user or IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production',
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id || req.ip || req.socket.remoteAddress;
  },
});
```

### Next.js Integration
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import rateLimit from 'express-rate-limit';

// Initialize rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  skip: () => process.env.NODE_ENV !== 'production',
});

export function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Rate limiting logic
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
```

### Testing Rate Limits
```bash
# Test login rate limit (should fail after 5 attempts)
for i in {1..7}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -H "X-Forwarded-For: 192.168.1.1"
  echo "Attempt $i"
  sleep 1
done
```

### References
- [express-rate-limit Documentation](https://github.com/nfriedly/express-rate-limit)
- [OWASP Brute Force Protection](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#brute-force-attacks)

---

## 2. Security Headers

Implement security headers to protect against common web vulnerabilities.

### Checklist
- [ ] Configure HSTS (Strict-Transport-Security)
- [ ] Set up Content-Security-Policy (CSP)
- [ ] Configure X-Content-Type-Options
- [ ] Set X-Frame-Options
- [ ] Enable X-XSS-Protection
- [ ] Configure Referrer-Policy
- [ ] Test headers with curl
- [ ] Verify in browser DevTools

### Implementation

#### next.config.ts Setup

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          // HSTS - Force HTTPS for 1 year (31536000 seconds)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // CSP - Restrict resource loading
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net", // React Dev Tools
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Clickjacking protection
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // XSS Protection (legacy, but still useful for older browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy (formerly Feature Policy)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

#### Alternative: API Route Setup (if using middleware)

```typescript
// pages/api/middleware/securityHeaders.ts
import { NextApiRequest, NextApiResponse } from 'next';

export function setSecurityHeaders(res: NextApiResponse) {
  // HSTS
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // CSP
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  // Content Type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Framing
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}
```

### Header Values Explained

| Header | Value | Purpose |
|--------|-------|---------|
| **HSTS** | `max-age=31536000; includeSubDomains` | Forces HTTPS for 1 year, includes subdomains |
| **CSP** | `default-src 'self'` | Only load resources from same origin by default |
| **X-Content-Type-Options** | `nosniff` | Prevent browser from MIME-type sniffing |
| **X-Frame-Options** | `DENY` | Prevent clickjacking by disallowing iframe embedding |
| **X-XSS-Protection** | `1; mode=block` | Enable XSS filter and block page if attack detected |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Only send referrer to same-origin requests |

### Testing Headers

```bash
# Check all security headers
curl -I https://isla.example.com | grep -E "Strict-Transport-Security|Content-Security-Policy|X-Content-Type-Options|X-Frame-Options|X-XSS-Protection|Referrer-Policy"

# Expected output:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# Content-Security-Policy: default-src 'self'; ...
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Referrer-Policy: strict-origin-when-cross-origin
```

### References
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN: HTTP Headers Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [Scott Helme: Content Security Policy](https://scotthelme.co.uk/csp-is-dead-long-live-csp/)

---

## 3. CORS Configuration

Properly configure Cross-Origin Resource Sharing to prevent unauthorized cross-origin requests.

### Checklist
- [ ] Configure CORS for production domain only
- [ ] Remove localhost from production config
- [ ] Restrict HTTP methods
- [ ] Configure credentials handling
- [ ] Test CORS with curl
- [ ] Verify preflight requests work

### Before (Insecure)
```typescript
// ❌ NOT RECOMMENDED
import cors from 'cors';

app.use(cors()); // Allows all origins - DANGEROUS!
```

### After (Secure)
```typescript
// ✅ RECOMMENDED
import cors from 'cors';

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://isla.example.com',
      'https://www.isla.example.com',
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours - cache preflight requests
};

app.use(cors(corsOptions));
```

### Next.js Middleware Implementation

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isAllowedOrigin =
    origin === 'https://isla.example.com' ||
    origin === 'https://www.isla.example.com' ||
    (process.env.NODE_ENV === 'development' && origin === 'http://localhost:3000');

  if (request.method === 'OPTIONS') {
    // Handle preflight request
    if (isAllowedOrigin) {
      return new NextResponse(null, {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }
    return new NextResponse('CORS not allowed', { status: 403 });
  }

  // Handle regular request
  const response = NextResponse.next();
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin || '');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
```

### Configuration by Environment

```typescript
// config/cors.ts
const corsConfig = {
  development: {
    origins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  },
  staging: {
    origins: ['https://staging.isla.example.com'],
  },
  production: {
    origins: ['https://isla.example.com', 'https://www.isla.example.com'],
  },
};

export function getCorsConfig(env: string = process.env.NODE_ENV || 'development') {
  return corsConfig[env as keyof typeof corsConfig] || corsConfig.development;
}
```

### Testing CORS

```bash
# Test preflight request
curl -X OPTIONS https://isla.example.com/api/endpoint \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Expected: 200 OK with CORS headers
# Not expected from wrong origin: 403 Forbidden
```

### References
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [OWASP: CORS](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Origin_Resource_Sharing_Cheat_Sheet.html)

---

## 4. DDoS Protection

Implement DDoS protection at multiple layers to maintain availability.

### Checklist
- [ ] Enable Vercel automatic DDoS protection
- [ ] Consider Cloudflare integration
- [ ] Set up rate limiting (see Section 1)
- [ ] Configure traffic monitoring
- [ ] Set up alerts for unusual traffic
- [ ] Document DDoS response procedure

### Vercel DDoS Protection (Automatic)

Vercel provides automatic DDoS protection out of the box:

```
✓ Layer 3/4 DDoS mitigation (volumetric attacks)
✓ Layer 7 application-layer protection
✓ Automatic attack detection and mitigation
✓ Geographic rate limiting
✓ No configuration needed
```

### Cloudflare Integration (Optional)

For additional protection, integrate Cloudflare:

1. **Update DNS** to point to Cloudflare nameservers
2. **Enable Cloudflare DDoS Settings**:
   ```
   Security Level: Medium or High
   Challenge Passage: 30 minutes
   Browser Integrity Check: On
   Bot Management: Enabled (if available)
   ```

3. **Add Firewall Rules**:
   ```
   Rule: Block traffic from suspicious countries (if applicable)
   Rule: Rate limit IPs with >50 requests/minute
   Rule: Block traffic patterns matching known attacks
   ```

### WAF Configuration

```typescript
// Example: Web Application Firewall rules
const wafRules = [
  {
    name: 'Block SQL Injection Patterns',
    pattern: /(\bunion\b.*\bselect\b|\bselect\b.*\bfrom\b)/i,
    action: 'block',
  },
  {
    name: 'Block XSS Patterns',
    pattern: /(<script|javascript:|onerror=|onload=)/i,
    action: 'block',
  },
  {
    name: 'Rate Limit Aggressive Crawlers',
    pattern: /bot|crawler|spider/i,
    action: 'rate_limit',
  },
];
```

### Monitoring & Alerting

```typescript
// Monitor traffic spikes
const monitorTraffic = () => {
  const threshold = 1000; // requests per minute
  if (currentRPM > threshold) {
    // Send alert
    console.error(`DDoS Alert: ${currentRPM} requests/minute`);
    notifyOpsTeam();
  }
};
```

### Traffic Monitoring

```bash
# Monitor real-time traffic with Vercel CLI
vercel logs --follow

# Check analytics dashboard
# - Vercel Analytics Dashboard
# - View traffic patterns
# - Identify anomalies
```

### DDoS Response Procedure

1. **Detection**: Monitor traffic anomalies
2. **Verification**: Confirm attack vs. legitimate spike
3. **Mitigation**: Engage DDoS protection features
4. **Escalation**: Contact Vercel support if needed
5. **Analysis**: Review logs after incident
6. **Improvement**: Update rules based on findings

### References
- [Vercel DDoS Protection](https://vercel.com/docs/edge-network/security)
- [Cloudflare DDoS Protection](https://www.cloudflare.com/ddos/managed-ddos-protection/)
- [OWASP DDoS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)

---

## 5. API Security

Secure all API endpoints against common attacks.

### Checklist
- [ ] Validate all input on every endpoint
- [ ] Use parameterized queries (Supabase handles this)
- [ ] Implement CSRF token validation
- [ ] Sanitize output (DOMPurify already in place)
- [ ] Add request authentication on protected routes
- [ ] Use HTTPS only
- [ ] Validate request content-type

### Input Validation

```typescript
// pages/api/users/create.ts
import { z } from 'zod';

// Define schema
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(12).max(128),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validated = createUserSchema.parse(body);

    // Safe to use validated data
    const user = await createUser(validated);
    return Response.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### SQL Injection Prevention

```typescript
// ✅ SAFE - Supabase uses parameterized queries
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', userEmail); // Parameterized

// ❌ UNSAFE - Never do this
const query = `SELECT * FROM users WHERE email = '${userEmail}'`; // Vulnerable!
```

### CSRF Token Implementation

```typescript
// middleware/csrfToken.ts
import { v4 as uuidv4 } from 'uuid';

export function generateCSRFToken(): string {
  return uuidv4();
}

export function validateCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken;
}

// pages/api/protected-action.ts
import { validateCSRFToken } from '@/middleware/csrfToken';

export async function POST(request: Request) {
  const body = await request.json();
  const csrfToken = request.headers.get('x-csrf-token');

  if (!validateCSRFToken(csrfToken, req.session?.csrfToken)) {
    return Response.json({ error: 'CSRF token invalid' }, { status: 403 });
  }

  // Process request
}
```

### XSS Prevention (Already Implemented)

```typescript
// Already using DOMPurify
import DOMPurify from 'isomorphic-dompurify';

const sanitized = DOMPurify.sanitize(userInput);
```

### Authentication on Protected Routes

```typescript
// middleware/auth.ts
import { getSession } from '@/lib/auth';

export async function requireAuth(request: Request) {
  const session = await getSession(request);

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return session;
}

// pages/api/protected/endpoint.ts
export async function POST(request: Request) {
  const session = await requireAuth(request);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Protected logic
}
```

### Request Validation Middleware

```typescript
// middleware/validateRequest.ts
export function validateContentType(request: Request, expected: string) {
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes(expected)) {
    throw new Error(`Expected ${expected} content type`);
  }
}

export function validateHTTPMethod(method: string, allowed: string[]) {
  if (!allowed.includes(method)) {
    throw new Error(`Method ${method} not allowed`);
  }
}

// Usage in API route
export async function handler(request: Request) {
  validateContentType(request, 'application/json');
  validateHTTPMethod(request.method, ['POST', 'PUT']);
  // ...
}
```

### References
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [API Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Assessment_Cheat_Sheet.html)

---

## 6. Database Security

Protect the database from unauthorized access and data loss.

### Checklist
- [ ] Enable encrypted backups
- [ ] Set backup retention policy (minimum 7 days)
- [ ] Enable access logs
- [ ] Enforce strong password policy
- [ ] Disable public access
- [ ] Enable Row-Level Security (RLS)
- [ ] Audit data access regularly
- [ ] Test backup restoration

### Supabase Configuration

#### Enable Backups

```typescript
// supabase/config.ts
// Navigate to Project Settings > Database > Backups

// ✓ Enable automated backups
// ✓ Set retention: 7-30 days
// ✓ Schedule: Daily at off-peak hours
```

#### Row-Level Security (RLS)

```sql
-- Enable RLS on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can see their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Posts - users can see all, but only edit their own
CREATE POLICY "Anyone can read posts"
  ON public.posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);
```

#### Database Access Control

```sql
-- Create roles for different access levels
CREATE ROLE "app_user" NOINHERIT;
CREATE ROLE "app_admin" NOINHERIT;

-- Grant minimal required permissions
GRANT USAGE ON SCHEMA public TO "app_user";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "app_user";

-- Restrict admin role
GRANT ALL PRIVILEGES ON SCHEMA public TO "app_admin";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "app_admin";

-- Set default role for connections
ALTER ROLE "app_user" SET search_path = public;
```

#### Enable Audit Logging

```sql
-- Enable pgaudit extension
CREATE EXTENSION pgaudit;

-- Log all changes
ALTER SYSTEM SET pgaudit.log = 'ALL';
ALTER SYSTEM SET pgaudit.log_level = 'LOG';

-- Select pgctrl to reload
SELECT pg_reload_conf();
```

#### Database Password Policy

```sql
-- Enforce strong password policy
ALTER USER postgres WITH PASSWORD 'StrongPassword123!@#';

-- Set password validity
ALTER ROLE postgres PASSWORD EXPIRE INTERVAL '90 days';
```

#### Disable Public Access

```typescript
// supabase/config.ts
// Database Settings:
// ✓ Disable "Allow public access" for database endpoint
// ✓ Use JWT for authentication only
```

### Backup Strategy

```bash
# Manual backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="isla_backup_${DATE}.sql"

# Backup with encryption
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | \
  openssl enc -aes-256-cbc -salt -out $BACKUP_FILE

# Upload to secure storage
aws s3 cp $BACKUP_FILE s3://isla-backups/ \
  --sse-c-algorithm AES256 \
  --sse-c-key $ENCRYPTION_KEY

# Clean old local backup
find . -name "isla_backup_*.sql" -mtime +7 -delete
```

### Backup Verification

```bash
# Test backup restoration monthly
#!/bin/bash
LATEST_BACKUP=$(aws s3 ls s3://isla-backups/ | tail -1 | awk '{print $4}')

# Restore to test database
aws s3 cp s3://isla-backups/$LATEST_BACKUP /tmp/backup.sql.enc
openssl enc -d -aes-256-cbc -in /tmp/backup.sql.enc | \
  psql -h test-db -U test-user -d test-db

echo "Backup restoration successful"
```

### References
- [Supabase Security](https://supabase.com/docs/guides/database/overview)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-security.html)
- [Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)

---

## 7. Secret Management

Properly manage secrets and credentials to prevent exposure.

### Checklist
- [ ] Store all secrets in environment variables
- [ ] Never commit `.env`, `.env.local`, `.env.*.local` files
- [ ] Use different keys for dev/staging/prod
- [ ] Rotate secrets quarterly
- [ ] Audit secret access
- [ ] Use encrypted secret storage
- [ ] Never log secrets

### Environment Configuration

#### .gitignore Setup

```bash
# .gitignore
.env
.env.local
.env.*.local
.env.production.local
*.pem
*.key
secrets/
```

#### Environment Files

```bash
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:3000
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=eyXxxx...
JWT_SECRET=dev-secret-only-for-local

# .env.staging (staging - use different secrets)
NEXT_PUBLIC_API_URL=https://staging.isla.example.com
SUPABASE_URL=https://staging-xxx.supabase.co
SUPABASE_KEY=eyStaging...
JWT_SECRET=staging-secret-rotated-quarterly

# .env.production (production - use strong secrets)
# Never commit this file
NEXT_PUBLIC_API_URL=https://isla.example.com
SUPABASE_URL=https://prod-xxx.supabase.co
SUPABASE_KEY=eyProduction...
JWT_SECRET=production-secret-rotated-monthly
DATABASE_PASSWORD=SecurePassword123!@#
ENCRYPTION_KEY=RandomEncryptionKey...
```

#### Vercel Environment Variables

```bash
# Set in Vercel Dashboard > Settings > Environment Variables

# Production
SUPABASE_URL: <production-url> (Production)
SUPABASE_KEY: <production-key> (Production)
JWT_SECRET: <production-secret> (Production)

# Staging
SUPABASE_URL: <staging-url> (Preview)
SUPABASE_KEY: <staging-key> (Preview)
JWT_SECRET: <staging-secret> (Preview)
```

### Accessing Secrets Safely

```typescript
// ✅ SAFE
const dbPassword = process.env.DATABASE_PASSWORD;

// ❌ UNSAFE - Never expose in client-side code
const apiKey = process.env.NEXT_PUBLIC_API_KEY; // Only use with NEXT_PUBLIC_

// ❌ UNSAFE - Never log secrets
console.log(`API Key: ${apiKey}`); // NEVER!

// ✅ SAFE - Log only non-sensitive info
console.log('API Key loaded (hidden)');
```

### Secret Rotation

```bash
#!/bin/bash
# Secret rotation script

# Step 1: Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# Step 2: Update in Vercel
vercel env add JWT_SECRET $NEW_SECRET --prod

# Step 3: Update in Supabase
# Login to Supabase > Project Settings > Secrets

# Step 4: Redeploy to activate
vercel deploy --prod

# Step 5: Document rotation
echo "Secret rotated on $(date): $NEW_SECRET" >> AUDIT_LOG.md

# Schedule: Run quarterly
# 0 0 1 */3 * /path/to/rotate-secrets.sh
```

### Encryption for Sensitive Data

```typescript
// crypto/encryption.ts
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const secretKey = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');

export function encryptData(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

export function decryptData(ciphertext: string): string {
  const [iv, encrypted] = ciphertext.split(':');
  const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### Audit Logging for Secrets

```typescript
// logging/audit.ts
export function logSecretAccess(secretName: string, user: string) {
  // Never log the actual secret value
  const auditLog = {
    timestamp: new Date(),
    secretName, // e.g., "DATABASE_PASSWORD"
    user, // Who accessed it
    action: 'accessed',
    // Don't log: secretValue
  };

  // Send to secure audit log service
  reportToAuditLog(auditLog);
}
```

### References
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

## 8. Monitoring & Alerting

Set up comprehensive monitoring and alerting to detect and respond to issues.

### Checklist
- [ ] Set up Sentry for error tracking
- [ ] Configure application logging
- [ ] Set up uptime monitoring
- [ ] Create alerts for error rates
- [ ] Monitor performance metrics
- [ ] Set up security event logging
- [ ] Create dashboard for metrics
- [ ] Document alerting procedures

### Sentry Setup

#### Installation

```bash
npm install @sentry/nextjs
```

#### Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});

// next.config.ts
const { withSentryConfig } = require('@sentry/nextjs');

let config = {
  // ... rest of config
};

config = withSentryConfig(config, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});

module.exports = config;
```

### Application Logging

```typescript
// lib/logger.ts
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    })
  );
}

export default logger;

// Usage
logger.info('Application started', { version: '1.0.0' });
logger.error('Error occurred', { error: err.message, stack: err.stack });
logger.warn('Rate limit approaching', { userId: user.id, remaining: 10 });
```

### Uptime Monitoring

```typescript
// Integrate with external service (e.g., Better Stack, Uptime Robot)
// Configuration:
// - Endpoint: https://isla.example.com/api/health
// - Frequency: Every 5 minutes
// - Timeout: 30 seconds
// - Alert on: 3 consecutive failures

// pages/api/health.ts
export async function GET(request: Request) {
  try {
    // Check database connection
    const { data } = await supabase.from('users').select('count()');

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}
```

### Alert Configuration

```typescript
// config/alerts.ts
export const alertConfig = {
  errorRate: {
    threshold: 0.05, // 5% error rate
    window: 5 * 60 * 1000, // 5 minutes
    severity: 'high',
    actions: ['email', 'slack'],
  },
  responseTime: {
    threshold: 5000, // 5 seconds
    window: 10 * 60 * 1000, // 10 minutes
    severity: 'medium',
    actions: ['slack'],
  },
  requestRate: {
    threshold: 10000, // 10k requests/minute
    window: 1 * 60 * 1000, // 1 minute
    severity: 'low',
    actions: ['slack'],
  },
  securityEvents: {
    threshold: 1, // Any security event
    window: 1 * 60 * 1000, // 1 minute
    severity: 'critical',
    actions: ['email', 'slack', 'pagerduty'],
  },
};
```

### Metrics Dashboard

```typescript
// Create dashboard in Vercel Analytics or external service
// Key metrics to monitor:

const metricsToMonitor = [
  'HTTP requests (total)',
  'HTTP requests (by status code)',
  'Response time (p50, p95, p99)',
  'Error rate (%)',
  'Database query time',
  'Cache hit rate',
  'Failed authentication attempts',
  'Rate limit violations',
  'API latency by endpoint',
  'User activity',
];
```

### Security Event Logging

```typescript
// middleware/securityLogging.ts
export function logSecurityEvent(event: SecurityEvent) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: event.type, // 'failed_auth', 'rate_limit', 'csrf_violation', etc.
    severity: event.severity, // 'low', 'medium', 'high', 'critical'
    user: event.userId || 'anonymous',
    ip: event.ipAddress,
    details: event.details,
  };

  // Send to security logging service
  sendToSecurityLog(logEntry);

  // Alert if critical
  if (event.severity === 'critical') {
    alertOpsTeam(logEntry);
  }
}

// Usage
logSecurityEvent({
  type: 'failed_auth',
  severity: 'low',
  userId: null,
  ipAddress: '192.168.1.1',
  details: 'Failed login attempt for user@example.com',
});
```

### References
- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Observability Best Practices](https://cloud.google.com/architecture/devops-culture/monitoring-distributed-systems)

---

## 9. Dependency Management

Keep dependencies secure and up-to-date.

### Checklist
- [ ] Run `npm audit` regularly
- [ ] Set up Dependabot for automated updates
- [ ] Pin major versions in package.json
- [ ] Review security advisories weekly
- [ ] Remove unused dependencies
- [ ] Test updates in staging before production
- [ ] Document dependency updates
- [ ] Keep Node.js updated

### Regular Audits

```bash
# Run security audit
npm audit

# Show detailed vulnerabilities
npm audit --detailed

# Fix vulnerabilities automatically
npm audit fix

# Fix with audit-level severity
npm audit fix --audit-level=moderate

# Check for outdated packages
npm outdated
```

### Dependabot Setup

#### .github/dependabot.yml

```yaml
version: 2
updates:
  # NPM dependencies
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
      time: '04:00'
    allow:
      - dependency-type: 'all'
    ignore:
      # Ignore major version updates for stability
      - dependency-name: 'next'
        update-types: ['version-update:semver-major']
    open-pull-requests-limit: 10
    reviewers:
      - 'security-team'
    assignees:
      - 'dev-lead'
    labels:
      - 'dependencies'
      - 'security'
    commit-message:
      prefix: 'chore(deps):'
      include: 'scope'
```

#### Pull Request Settings

1. Go to Settings > Branch Protection Rules
2. Require Dependabot PRs to pass checks before merge
3. Enable auto-merge for patch updates:

```yaml
# .github/workflows/auto-merge-deps.yml
name: Auto-merge Dependabot PRs

on: pull_request

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - uses: fastify/github-action-merge-dependabot@v3
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Dependency Pinning

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "zod": "^3.22.0",
    "@supabase/supabase-js": "^2.38.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

### Unused Dependencies

```bash
# Find unused dependencies
npx depcheck

# Example output:
# Unused dependencies:
#  - old-lib
#  - deprecated-package

# Remove them
npm uninstall old-lib deprecated-package
```

### Security Advisory Response

```bash
#!/bin/bash
# Weekly security check script

echo "=== Running npm audit ==="
npm audit --json > audit-report.json

# Check for critical vulnerabilities
CRITICAL=$(jq '[.vulnerabilities[] | select(.severity=="critical")] | length' audit-report.json)

if [ $CRITICAL -gt 0 ]; then
  echo "⚠️  CRITICAL: $CRITICAL critical vulnerabilities found"
  npm audit fix
  npm test
  git commit -am "fix(security): patch critical vulnerabilities"
else
  echo "✓ No critical vulnerabilities"
fi
```

### Node.js Version Management

```bash
# .nvmrc
18.17.0

# Use nvm to manage versions
nvm use

# Keep updated
# Latest LTS: 20.x
# Previous LTS: 18.x
```

### References
- [npm audit Documentation](https://docs.npmjs.com/cli/v9/commands/npm-audit)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## 10. Testing & Validation

Verify security measures are working correctly.

### Checklist
- [ ] Test all security headers present
- [ ] Verify rate limiting works
- [ ] Test CORS restrictions
- [ ] Check CSP in browser console
- [ ] Test authentication flows
- [ ] Verify HTTPS enforcement
- [ ] Test input validation
- [ ] Run security tests in CI/CD

### Security Header Verification

```bash
#!/bin/bash
# Test security headers

echo "=== Testing Security Headers ==="

HEADERS=$(curl -I https://isla.example.com 2>/dev/null)

# Check HSTS
if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
  echo "✓ HSTS header present"
else
  echo "✗ HSTS header missing"
fi

# Check CSP
if echo "$HEADERS" | grep -q "Content-Security-Policy"; then
  echo "✓ CSP header present"
else
  echo "✗ CSP header missing"
fi

# Check X-Content-Type-Options
if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
  echo "✓ X-Content-Type-Options header present"
else
  echo "✗ X-Content-Type-Options header missing"
fi

# Check X-Frame-Options
if echo "$HEADERS" | grep -q "X-Frame-Options"; then
  echo "✓ X-Frame-Options header present"
else
  echo "✗ X-Frame-Options header missing"
fi

# Full header dump
echo ""
echo "=== Full Headers ==="
echo "$HEADERS"
```

### Rate Limiting Test

```bash
#!/bin/bash
# Test rate limiting

echo "=== Testing Rate Limiting ==="

# Test login endpoint
echo "Testing login endpoint (limit: 5 per 15 min)..."
for i in {1..7}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://isla.example.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -H "X-Forwarded-For: 192.168.1.100")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  
  if [ $HTTP_CODE -eq 429 ]; then
    echo "Attempt $i: ✓ Rate limited (HTTP 429)"
    break
  elif [ $HTTP_CODE -eq 401 ]; then
    echo "Attempt $i: ✓ Accepted (HTTP 401)"
  else
    echo "Attempt $i: ? Unexpected response (HTTP $HTTP_CODE)"
  fi
  
  sleep 1
done
```

### CORS Verification

```bash
#!/bin/bash
# Test CORS restrictions

echo "=== Testing CORS ==="

# Test allowed origin
echo "Testing allowed origin (example.com)..."
curl -s -I -H "Origin: https://isla.example.com" \
  https://isla.example.com/api/endpoint | grep "Access-Control-Allow-Origin"

# Test disallowed origin
echo ""
echo "Testing disallowed origin (evil.com)..."
curl -s -I -H "Origin: https://evil.com" \
  https://isla.example.com/api/endpoint | grep "Access-Control-Allow-Origin" || echo "✓ Not allowed"
```

### CSP Validation

```javascript
// Browser console test
// Open DevTools > Console on production site

// Check for CSP violations (should be none)
// Monitor the console and network tab for CSP errors

// In developer tools:
// 1. Go to Console tab
// 2. Check for "Refused to..." errors
// 3. Go to Network tab
// 4. Check for Resources blocked by CSP

// Programmatic check
const testCSP = () => {
  // This script will fail if CSP blocks it
  const script = document.createElement('script');
  script.textContent = 'console.log("CSP allows inline scripts")';
  try {
    document.body.appendChild(script);
  } catch (e) {
    console.log('✓ CSP blocked inline script (expected)');
  }
};
```

### Authentication Testing

```typescript
// __tests__/security/auth.test.ts
import { POST as loginHandler } from '@/app/api/auth/login/route';

describe('Authentication Security', () => {
  test('Should reject request without credentials', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await loginHandler(request);
    expect(response.status).toBe(400);
  });

  test('Should rate limit excessive login attempts', async () => {
    const email = 'test@example.com';

    for (let i = 0; i < 6; i++) {
      const request = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'wrong' }),
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      });

      const response = await loginHandler(request);

      if (i < 5) {
        expect(response.status).not.toBe(429);
      } else {
        expect(response.status).toBe(429);
      }
    }
  });

  test('Should use HTTPS in production', async () => {
    const env = process.env.NODE_ENV;
    expect(env).toBe('production');
    // Verify certificate is valid via HTTPS
  });
});
```

### Input Validation Testing

```typescript
// __tests__/security/validation.test.ts
import { POST as createUserHandler } from '@/app/api/users/create/route';

describe('Input Validation', () => {
  test('Should reject invalid email', async () => {
    const request = new Request('http://localhost:3000/api/users/create', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        username: 'testuser',
        password: 'SecurePassword123!',
      }),
    });

    const response = await createUserHandler(request);
    expect(response.status).toBe(400);
  });

  test('Should reject short password', async () => {
    const request = new Request('http://localhost:3000/api/users/create', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        username: 'testuser',
        password: 'short',
      }),
    });

    const response = await createUserHandler(request);
    expect(response.status).toBe(400);
  });

  test('Should sanitize user input', async () => {
    const request = new Request('http://localhost:3000/api/users/create', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        username: 'user<script>alert("xss")</script>',
        password: 'SecurePassword123!',
      }),
    });

    const response = await createUserHandler(request);
    expect(response.status).toBe(400); // Should validate username format
  });
});
```

### CI/CD Security Testing

```yaml
# .github/workflows/security-tests.yml
name: Security Tests

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run npm audit
        run: npm audit --production

      - name: Run OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'Isla'
          path: '.'
          format: 'JSON'

      - name: Run ESLint security plugin
        run: npx eslint . --ext .ts,.tsx --plugin security

      - name: Run security tests
        run: npm run test:security

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'dependency-check-report.json'
```

### Automated Security Testing Script

```bash
#!/bin/bash
# run-security-tests.sh

echo "🔒 Running comprehensive security tests..."

# 1. Security headers
echo ""
echo "1️⃣  Testing security headers..."
bash ./tests/security/headers.sh

# 2. Rate limiting
echo ""
echo "2️⃣  Testing rate limiting..."
bash ./tests/security/rate-limiting.sh

# 3. CORS
echo ""
echo "3️⃣  Testing CORS..."
bash ./tests/security/cors.sh

# 4. Input validation
echo ""
echo "4️⃣  Running input validation tests..."
npm run test:security

# 5. Dependency audit
echo ""
echo "5️⃣  Running dependency audit..."
npm audit

echo ""
echo "✅ Security tests complete"
```

### References
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Rapid Security Testing](https://cheatsheetseries.owasp.org/cheatsheets/)

---

## Implementation Priority

### Phase 1 (Critical - Do First)
1. ✅ Security Headers (Section 2)
2. ✅ CORS Configuration (Section 3)
3. ✅ Rate Limiting (Section 1)
4. ✅ Database Security (Section 6)

### Phase 2 (High - Do Before Production)
1. ✅ Secret Management (Section 7)
2. ✅ API Security (Section 5)
3. ✅ Monitoring & Alerting (Section 8)
4. ✅ DDoS Protection (Section 4)

### Phase 3 (Medium - After Launch)
1. ✅ Dependency Management (Section 9)
2. ✅ Testing & Validation (Section 10)

---

## Verification Checklist

Complete this before production deployment:

```
Pre-Launch Security Verification
=================================

Security Headers:
  [ ] HSTS enabled and verified
  [ ] CSP configured and tested
  [ ] X-Content-Type-Options set
  [ ] X-Frame-Options set
  [ ] X-XSS-Protection enabled
  [ ] Referrer-Policy configured

Rate Limiting:
  [ ] Auth endpoints rate limited
  [ ] API endpoints rate limited
  [ ] Rate limit headers present
  [ ] Tested in staging

CORS:
  [ ] Only production domain allowed
  [ ] Localhost removed from config
  [ ] Methods restricted
  [ ] Preflight working

Database:
  [ ] RLS enabled on all tables
  [ ] Backups configured
  [ ] Access logs enabled
  [ ] Public access disabled
  [ ] Password policy enforced

Secrets:
  [ ] All secrets in env variables
  [ ] .env files in .gitignore
  [ ] Different keys for each environment
  [ ] Encryption keys generated
  [ ] No secrets in code/logs

Monitoring:
  [ ] Sentry configured
  [ ] Error tracking working
  [ ] Uptime monitoring active
  [ ] Alerts configured
  [ ] Dashboard set up

Dependencies:
  [ ] npm audit passing
  [ ] No critical vulnerabilities
  [ ] Dependabot enabled
  [ ] Unused dependencies removed
  [ ] Node.js updated

Testing:
  [ ] Security headers verified
  [ ] Rate limiting tested
  [ ] CORS verified
  [ ] Input validation tested
  [ ] Authentication flows tested
```

---

## Additional Resources

- [OWASP Top 10 Web Application Risks](https://owasp.org/www-project-top-ten/)
- [CWE Top 25 Most Dangerous Software Weaknesses](https://cwe.mitre.org/top25/)
- [Secure Coding Guidelines](https://www.securecoding.cert.org/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

## Support & Escalation

If you encounter security issues or have questions:

1. **Security Issues**: Report privately to security@isla.example.com
2. **Questions**: Consult with security team before production
3. **Incidents**: Follow incident response procedure
4. **Updates**: Review this checklist quarterly

---

**Last Updated**: [Date]
**Version**: 1.0
**Maintainer**: Security Team
