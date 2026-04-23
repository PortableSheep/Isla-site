# Isla.site Authentication Setup Guide

This guide covers complete authentication configuration for Isla.site, including Supabase setup, email templates, OAuth providers, JWT management, and security best practices.

---

## Table of Contents

1. [Supabase Auth Setup](#supabase-auth-setup)
2. [Email Templates](#email-templates)
3. [OAuth Providers](#oauth-providers)
4. [JWT Management](#jwt-management)
5. [Session Security](#session-security)
6. [Testing Authentication](#testing-authentication)
7. [Production Considerations](#production-considerations)
8. [Troubleshooting](#troubleshooting)

---

## Supabase Auth Setup

### Email/Password Configuration

#### Step 1: Access Supabase Console

1. Navigate to [supabase.com](https://supabase.com)
2. Sign in to your project
3. Go to **Authentication** > **Providers**
4. Verify **Email** provider is enabled (enabled by default)

#### Step 2: Configure Email Settings

1. In **Authentication** > **Email** tab, configure:
   - **Sender Name**: "Isla Support"
   - **Sender Email**: `noreply@isla.example.com` (or your domain)
   - **Email Confirmation**: Choose below options

#### Step 3: Email Confirmation Options

**Option A: Auto-Confirm (Development Only)**
```
- Users registered, immediately logged in
- No email confirmation required
- Suitable for local testing only
```

**Option B: Require Email Confirmation (Recommended)**
```
- Users receive confirmation email
- Cannot login until email verified
- More secure for production
- Settings:
  - Enable "Email Confirmations"
  - Set "Email Confirmation Validity" to 24 hours
  - Enable "Double Confirm Change"
```

#### Step 4: Password Requirements

Configure in **Authentication** > **Policies**:

```
- Minimum length: 8 characters
- Require at least one uppercase letter
- Require at least one lowercase letter
- Require at least one number
- Require at least one special character (@#$%^&*)
```

**Implementation in Next.js**:
```typescript
// src/lib/auth/validation.ts
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*])[A-Za-z\d@#$%^&*]{8,}$/;

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) errors.push("Password must be at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain an uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Password must contain a lowercase letter");
  if (!/\d/.test(password)) errors.push("Password must contain a number");
  if (!/[@#$%^&*]/.test(password)) errors.push("Password must contain a special character");
  
  return { valid: errors.length === 0, errors };
};
```

#### Step 5: Session Timeout Settings

Configure in **Authentication** > **Advanced Settings**:

```
- JWT Expiry Limit: 3600 seconds (1 hour) - Access Token
- JWT Refresh Duration: 86400 seconds (24 hours) - Refresh Token
- Inactivity Timeout: 604800 seconds (7 days)
```

**Explanation**:
- **Access Token (1 hour)**: Short-lived token for API requests
- **Refresh Token (24 hours)**: Longer-lived token to get new access tokens
- **Inactivity Timeout (7 days)**: Session expires if unused

#### Step 6: Token Expiration Configuration

1. Go to **Authentication** > **Security Settings**
2. Configure token expiration:

```typescript
// JWT expires after this duration
const ACCESS_TOKEN_EXPIRY = 3600; // 1 hour

// Refresh token validity
const REFRESH_TOKEN_EXPIRY = 86400; // 24 hours

// Auto-refresh tokens before expiry
const TOKEN_REFRESH_THRESHOLD = 300; // 5 minutes before expiry
```

---

## Email Templates

### Template Management

Email templates are configured in Supabase Console under **Authentication** > **Email Templates**. You can customize:

1. Confirmation Email
2. Password Reset Email
3. Email Change Confirmation
4. Magic Link Email

### 1. Signup Confirmation Email

**Template Variables**:
- `{{ .ConfirmationURL }}` - Email confirmation link
- `{{ .Email }}` - User email address
- `{{ .Token }}` - Confirmation token
- `{{ .SiteURL }}` - Your site URL

**HTML Template**:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { color: #6b7280; font-size: 12px; text-align: center; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Isla</h1>
        </div>
        <div class="content">
            <p>Hello {{ .Email }},</p>
            <p>Thank you for signing up! Please confirm your email address to complete your registration.</p>
            <center>
                <a href="{{ .ConfirmationURL }}" class="button">Confirm Email</a>
            </center>
            <p style="color: #6b7280; font-size: 14px;">Or paste this link in your browser:</p>
            <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">{{ .ConfirmationURL }}</p>
            <p style="color: #6b7280; font-size: 12px;">This link expires in 24 hours.</p>
        </div>
        <div class="footer">
            <p>If you didn't sign up for this account, please ignore this email.</p>
            <p>&copy; 2024 Isla. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

**Text Template**:
```
Welcome to Isla

Hello {{ .Email }},

Thank you for signing up! Please confirm your email address by visiting this link:

{{ .ConfirmationURL }}

This link expires in 24 hours.

If you didn't sign up for this account, please ignore this email.

© 2024 Isla. All rights reserved.
```

### 2. Password Reset Email

**HTML Template**:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #fef3c7; color: #92400e; padding: 20px; text-align: center; border-radius: 8px; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { color: #6b7280; font-size: 12px; text-align: center; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Password Reset Request</h2>
        </div>
        <div class="content">
            <p>Hello {{ .Email }},</p>
            <p>We received a request to reset your password. Click the button below to create a new password.</p>
            <center>
                <a href="{{ .RecoveryURL }}" class="button">Reset Password</a>
            </center>
            <p style="color: #6b7280; font-size: 14px;">Or paste this link in your browser:</p>
            <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">{{ .RecoveryURL }}</p>
            <p style="color: #dc2626; font-size: 12px;"><strong>This link expires in 1 hour.</strong></p>
        </div>
        <div class="footer">
            <p>If you didn't request a password reset, please ignore this email or contact support.</p>
            <p>&copy; 2024 Isla. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

**Text Template**:
```
Password Reset Request

Hello {{ .Email }},

We received a request to reset your password. Visit this link to create a new password:

{{ .RecoveryURL }}

This link expires in 1 hour.

If you didn't request this reset, please ignore this email.

© 2024 Isla. All rights reserved.
```

### 3. Email Change Confirmation

**HTML Template**:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { color: #6b7280; font-size: 12px; text-align: center; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Confirm Your New Email</h2>
        </div>
        <div class="content">
            <p>Hello {{ .Email }},</p>
            <p>We received a request to change your email address. Please confirm this change by clicking the button below.</p>
            <center>
                <a href="{{ .EmailChangeURL }}" class="button">Confirm Email Change</a>
            </center>
            <p style="color: #6b7280; font-size: 12px;">This link expires in 24 hours.</p>
            <p style="color: #6b7280; font-size: 12px;">If you didn't request this change, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Isla. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

**Text Template**:
```
Confirm Your New Email

Hello {{ .Email }},

We received a request to change your email address. Confirm this change:

{{ .EmailChangeURL }}

This link expires in 24 hours.

If you didn't request this change, ignore this email.

© 2024 Isla. All rights reserved.
```

### Using External Email Services

**For Resend** (recommended for Next.js):

```typescript
// src/lib/email/resend.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendConfirmationEmail = async (email: string, confirmationUrl: string) => {
  return resend.emails.send({
    from: 'Isla Support <noreply@isla.example.com>',
    to: email,
    subject: 'Confirm your email address',
    react: ConfirmationEmailTemplate({ email, confirmationUrl }),
  });
};
```

**For SendGrid**:

```typescript
// src/lib/email/sendgrid.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendConfirmationEmail = async (email: string, confirmationUrl: string) => {
  await sgMail.send({
    to: email,
    from: 'noreply@isla.example.com',
    subject: 'Confirm your email address',
    html: confirmationEmailHTML({ email, confirmationUrl }),
    text: confirmationEmailText({ email, confirmationUrl }),
  });
};
```

---

## OAuth Providers

### Google OAuth Setup

#### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: "Isla Site"
3. Enable **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   - Local: `http://localhost:3000/auth/callback`
   - Staging: `https://staging.isla.example.com/auth/callback`
   - Production: `https://isla.example.com/auth/callback`

#### Step 2: Configure in Supabase

1. Go to Supabase Console > **Authentication** > **Providers**
2. Enable **Google**
3. Enter **Client ID** and **Client Secret** from Google Cloud
4. Save

#### Step 3: Frontend Implementation

```typescript
// src/lib/auth/oauth.ts
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export const signInWithGoogle = async () => {
  const supabase = useSupabaseClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      skipBrowserRedirect: false,
    },
  });
  
  if (error) throw error;
  return data;
};
```

```typescript
// src/app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.redirect(new URL('/auth/error', request.url));
}
```

### Apple OAuth Setup

#### Step 1: Create Apple OAuth Credentials

1. Go to [Apple Developer Account](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create a new **Identifier** (App ID)
4. Enable **Sign in with Apple**
5. Create a new **Services ID** for web
6. Configure Return URLs:
   - `https://your-project.supabase.co/auth/v1/callback?provider=apple`

#### Step 2: Configure in Supabase

1. Go to Supabase Console > **Authentication** > **Providers**
2. Enable **Apple**
3. Enter **Services ID**, **Team ID**, **Key ID**, and **Private Key**
4. Save

#### Step 3: Frontend Implementation

```typescript
// src/lib/auth/oauth.ts
export const signInWithApple = async () => {
  const supabase = useSupabaseClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      skipBrowserRedirect: false,
    },
  });
  
  if (error) throw error;
  return data;
};
```

### GitHub OAuth Setup (Development)

#### Step 1: Create GitHub OAuth App

1. Go to GitHub Settings > **Developer settings** > **OAuth Apps**
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: "Isla Dev"
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/auth/callback`
4. Copy **Client ID** and **Client Secret**

#### Step 2: Configure in Supabase (Local)

Update local `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GITHUB_OAUTH_CLIENT_ID=your_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_client_secret
```

#### Step 3: Update Supabase for Production

Use the same process as Google/Apple for production deployment.

---

## JWT Management

### How JWT Tokens Work in Isla.site

JWT (JSON Web Tokens) are cryptographically signed tokens that verify the user's identity and permissions.

**Token Flow**:
```
User Login → Supabase Auth → Access Token (1hr) + Refresh Token (24hr)
    ↓
Access Token stored in cookie/localStorage
    ↓
Every API request includes token in Authorization header
    ↓
Backend verifies JWT signature and expiry
```

### Token Structure

**Access Token Payload Example**:
```json
{
  "sub": "user-id-uuid",
  "aud": "authenticated",
  "role": "authenticated",
  "iat": 1704067200,
  "exp": 1704070800,
  "email": "user@example.com",
  "email_verified": true,
  "user_metadata": {
    "profile_picture": "https://...",
    "username": "username"
  }
}
```

**Claims**:
- `sub` - Subject (user ID)
- `aud` - Audience (always "authenticated")
- `iat` - Issued at (timestamp)
- `exp` - Expiration time (timestamp)
- `email` - User email
- `role` - User role in app

### Refresh Token Flow

**Automatic Token Refresh**:

```typescript
// src/lib/auth/token-refresh.ts
export const setupTokenRefresh = async (supabase: SupabaseClient) => {
  // Refresh token 5 minutes before expiry
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.expires_at) {
    const expiresIn = (session.expires_at * 1000) - Date.now();
    const refreshThreshold = 5 * 60 * 1000; // 5 minutes
    
    if (expiresIn < refreshThreshold) {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return data.session;
    }
  }
  
  return session;
};

// Run on app startup and periodically
useEffect(() => {
  const interval = setInterval(() => {
    setupTokenRefresh(supabase);
  }, 60000); // Check every minute
  
  return () => clearInterval(interval);
}, [supabase]);
```

### Token Storage

**Option 1: Secure HttpOnly Cookies (Recommended)**

```typescript
// src/lib/auth/cookies.ts
export const storeTokenInCookie = (accessToken: string, refreshToken: string) => {
  // Set via Set-Cookie header (HttpOnly, Secure, SameSite)
  document.cookie = `sb-access-token=${accessToken}; Path=/; Secure; HttpOnly; SameSite=Strict`;
  document.cookie = `sb-refresh-token=${refreshToken}; Path=/; Secure; HttpOnly; SameSite=Strict`;
};
```

**Option 2: localStorage (Less Secure)**

```typescript
// src/lib/auth/storage.ts
export const storeTokenInStorage = (session: Session) => {
  localStorage.setItem('supabase.auth.token', JSON.stringify(session));
};

export const getTokenFromStorage = () => {
  const stored = localStorage.getItem('supabase.auth.token');
  return stored ? JSON.parse(stored) : null;
};
```

**Comparison**:
| Method | Security | CSRF Safe | XSS Safe | Complexity |
|--------|----------|-----------|----------|-----------|
| HttpOnly Cookie | High | Yes | Yes | Medium |
| localStorage | Low | No | No | Low |
| sessionStorage | Low | No | No | Low |

**Recommendation**: Use HttpOnly cookies for production, combined with CSRF tokens.

---

## Session Security

### Best Practices for Session Handling

#### 1. Session Creation

```typescript
// src/app/auth/login/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();
  
  const supabase = createRouteHandlerClient({ cookies });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Session automatically created by Supabase
  return NextResponse.json({ user: data.user });
}
```

#### 2. Session Verification

```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Verify session on every request
  const { data: { session } } = await supabase.auth.getSession();

  // Protect routes
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
};
```

#### 3. Session Termination (Logout)

```typescript
// src/app/auth/logout/route.ts
export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  
  await supabase.auth.signOut();
  
  // Clear cookies
  const response = NextResponse.redirect(new URL('/auth/login', request.url), { status: 302 });
  response.cookies.set('sb-access-token', '', { maxAge: 0 });
  response.cookies.set('sb-refresh-token', '', { maxAge: 0 });
  
  return response;
}
```

### CSRF Protection Explanation

**CSRF (Cross-Site Request Forgery)**: Attacker tricks user into making unwanted requests.

**How Isla.site Prevents CSRF**:

1. **SameSite Cookies**: Cookies only sent to same site
```typescript
// Automatically set by Supabase
// Set-Cookie: session=...; SameSite=Strict
```

2. **CSRF Tokens** (for POST/PUT/DELETE):
```typescript
// src/lib/csrf.ts
export const generateCsrfToken = () => {
  return crypto.randomUUID();
};

export const validateCsrfToken = (token: string, storedToken: string) => {
  return token === storedToken;
};
```

3. **Origin/Referer Validation**:
```typescript
// src/middleware.ts
const validOrigins = [
  'https://isla.example.com',
  'https://staging.isla.example.com',
  'http://localhost:3000',
];

if (!validOrigins.includes(request.headers.get('origin'))) {
  return NextResponse.json({ error: 'CSRF protection' }, { status: 403 });
}
```

### Secure Cookie Settings

```typescript
// src/lib/auth/cookies.ts
export const getCookieOptions = () => ({
  httpOnly: true,      // Prevent JavaScript access
  secure: true,        // HTTPS only
  sameSite: 'strict',  // Only same-site requests
  maxAge: 3600,        // 1 hour
  path: '/',           // Available site-wide
});
```

**Production Cookie Configuration**:
```typescript
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  domain: process.env.COOKIE_DOMAIN,
  path: '/',
};
```

### Session Timeout Recommendations

| Setting | Value | Reason |
|---------|-------|--------|
| Access Token Expiry | 1 hour | Short-lived, minimizes damage if stolen |
| Refresh Token Expiry | 24 hours | Allows extended usage |
| Inactivity Timeout | 7 days | Force re-login after week of inactivity |
| Remember Me Duration | 30 days | Optional extended sessions |

**Configuring Inactivity Timeout**:

```typescript
// src/lib/auth/inactivity.ts
export const setupInactivityTimeout = (
  supabase: SupabaseClient,
  timeoutMinutes = 60
) => {
  let inactivityTimer: NodeJS.Timeout;

  const resetTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(async () => {
      await supabase.auth.signOut();
      window.location.href = '/auth/login?reason=inactivity';
    }, timeoutMinutes * 60 * 1000);
  };

  // Reset on user activity
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetTimer);
  });

  resetTimer();
};
```

### Handling Logged-Out Users

```typescript
// src/app/auth/callback/route.ts
export async function handleAuthStateChange(event, session) {
  if (event === 'SIGNED_OUT') {
    // Clear sensitive data
    localStorage.removeItem('user_preferences');
    sessionStorage.clear();
    
    // Redirect to login
    window.location.href = '/auth/login';
  }
}

// Setup listener in app layout
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    handleAuthStateChange
  );
  
  return () => subscription?.unsubscribe();
}, []);
```

---

## Testing Authentication

### Testing Signup Flow Locally

**Step 1: Configure Supabase Local Development**

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Get local credentials from output
# Store in .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Step 2: Test Signup**

```typescript
// src/__tests__/auth/signup.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupForm from '@/components/auth/SignupForm';

describe('Signup Flow', () => {
  it('should create a new user account', async () => {
    render(<SignupForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'SecurePass123!');
    await userEvent.type(confirmInput, 'SecurePass123!');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/confirmation email sent/i)).toBeInTheDocument();
    });
  });

  it('should show validation errors', async () => {
    render(<SignupForm />);
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('should prevent duplicate email signup', async () => {
    // First signup
    render(<SignupForm />);
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'SecurePass123!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    // Second signup with same email
    await waitFor(() => {
      expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
    });
  });
});
```

### Testing Password Reset

```typescript
// src/__tests__/auth/password-reset.test.ts
describe('Password Reset Flow', () => {
  it('should send password reset email', async () => {
    const { supabase } = setupTestClient();
    
    const { error } = await supabase.auth.resetPasswordForEmail('test@example.com', {
      redirectTo: 'http://localhost:3000/auth/reset-password',
    });

    expect(error).toBeNull();
  });

  it('should update password with valid token', async () => {
    const { supabase } = setupTestClient();
    
    // Simulate token from email
    const resetToken = 'token_from_reset_email';
    
    const { error } = await supabase.auth.updateUser({
      password: 'NewSecurePass123!',
    });

    expect(error).toBeNull();
  });

  it('should reject expired reset tokens', async () => {
    const { supabase } = setupTestClient();
    
    // Simulate expired token
    const { error } = await supabase.auth.verifyOtp({
      email: 'test@example.com',
      token: 'expired_token',
      type: 'recovery',
    });

    expect(error?.message).toContain('Invalid or expired');
  });
});
```

### Email Inbox Testing

**Using MailSlurp**:

```typescript
// src/__tests__/auth/email.test.ts
import { MailSlurp } from 'mailslurp-client';

const mailslurp = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY });

describe('Email Verification', () => {
  it('should send confirmation email', async () => {
    // Create temporary email
    const inbox = await mailslurp.inboxController.createInbox();
    const testEmail = inbox.emailAddress;

    // Trigger signup
    await signupUser(testEmail, 'SecurePass123!');

    // Wait for email
    const emails = await mailslurp.waitController.waitForLatestEmail({
      inboxId: inbox.id,
      timeout: 30000,
    });

    expect(emails.subject).toContain('Confirm your email');
    expect(emails.body).toContain('Welcome to Isla');

    // Extract confirmation link
    const linkMatch = emails.body?.match(/href="([^"]+confirmation[^"]*)"/);
    expect(linkMatch).toBeDefined();
  });
});
```

**Using Console Output in Development**:

```bash
# In local Supabase logs, confirmation links appear:
# [6] <URL> http://localhost:3000/auth/callback?code=xyz...token=abc...

# Click or paste the link in your browser to confirm
```

### Debug Auth Issues

**Enable Supabase Logging**:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Monitor auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth Event:', event);
  console.log('Session:', session);
});
```

**Check Session in Browser Console**:

```javascript
// Browser DevTools Console
const session = await supabase.auth.getSession();
console.log('Current Session:', session);
console.log('Token Expiry:', new Date(session.data.session.expires_at * 1000));
```

**Network Tab Inspection**:

1. Open DevTools > Network tab
2. Look for calls to:
   - `/auth/v1/signup` - Account creation
   - `/auth/v1/token` - Token exchange
   - `/auth/v1/user` - User info
3. Check response status and error messages

---

## Production Considerations

### Email Verification Requirements

**Pre-Launch Checklist**:

- [ ] Enable email confirmation (no auto-confirm)
- [ ] Configure email sender domain (SPF/DKIM/DMARC)
- [ ] Test all email templates
- [ ] Set email confirmation validity to 24-48 hours
- [ ] Enable double confirmation for email changes
- [ ] Configure bounce handling
- [ ] Set up email logs/monitoring

**Configuring SPF/DKIM/DMARC**:

```
SPF Record (DNS):
v=spf1 include:sendgrid.net ~all
or
v=spf1 include:resend.com ~all

DKIM Record (from email provider):
Add all provided DKIM keys to DNS

DMARC Record (DNS):
v=DMARC1; p=quarantine; rua=mailto:dmarc@isla.example.com
```

### Rate Limiting on Auth Endpoints

**Implement Rate Limiting**:

```typescript
// src/middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  analytics: true,
  prefix: 'auth',
});

export async function middleware(request: NextRequest) {
  // Rate limit auth endpoints
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    const identifier = request.ip || 'anonymous';
    const limit = await ratelimit.limit(identifier);

    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/:path*'],
};
```

**Recommended Rate Limits**:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/signup` | 5 | Per hour per IP |
| `/auth/login` | 10 | Per hour per IP |
| `/auth/password-reset` | 3 | Per hour per email |
| `/auth/verify` | 10 | Per hour per token |

### Account Lockout After Failed Attempts

```typescript
// src/lib/auth/lockout.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60; // 15 minutes

export async function recordLoginAttempt(email: string, success: boolean) {
  const key = `login_attempts:${email}`;
  
  if (success) {
    // Clear attempts on successful login
    await redis.del(key);
    return;
  }

  // Increment failed attempts
  const attempts = await redis.incr(key);
  
  if (attempts === 1) {
    // Set expiry on first attempt
    await redis.expire(key, LOCKOUT_DURATION);
  }

  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    // Lock account
    await redis.set(`account_locked:${email}`, 'true', { ex: LOCKOUT_DURATION });
    throw new Error('Account locked due to too many failed attempts');
  }

  return attempts;
}

export async function isAccountLocked(email: string): Promise<boolean> {
  const locked = await redis.get(`account_locked:${email}`);
  return locked === 'true';
}
```

**Integration with Login Endpoint**:

```typescript
// src/app/api/auth/login/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();

  // Check if account is locked
  if (await isAccountLocked(email)) {
    return NextResponse.json(
      { error: 'Account temporarily locked. Try again in 15 minutes.' },
      { status: 429 }
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    await recordLoginAttempt(email, false);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  await recordLoginAttempt(email, true);
  return NextResponse.json({ user: data.user });
}
```

### Two-Factor Authentication (Optional Future)

**TOTP (Time-based One-Time Password) Setup**:

```typescript
// src/lib/auth/2fa.ts
import * as speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export async function generate2FASecret(userEmail: string) {
  const secret = speakeasy.generateSecret({
    name: `Isla (${userEmail})`,
    issuer: 'Isla',
    length: 32,
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode,
  };
}

export function verify2FAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  });
}
```

---

## Troubleshooting

### "Email already exists" Errors

**Cause**: User attempts to sign up with existing email address.

**Solution**:

```typescript
// src/app/api/auth/signup/route.ts
try {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error?.message.includes('already registered')) {
    return NextResponse.json(
      { 
        error: 'Email already registered. Try logging in or use password reset.',
        code: 'EMAIL_EXISTS'
      },
      { status: 400 }
    );
  }
} catch (err) {
  // Handle error
}
```

**User Action**:
1. Click "Forgot Password" to reset password
2. Or use a different email address

### "Invalid token" Errors

**Cause**: Token is expired, malformed, or revoked.

**Solutions**:

```typescript
// src/lib/auth/token-validation.ts
export async function validateAndRefreshToken(supabase: SupabaseClient) {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error('No valid session');
  }

  // Check if token needs refresh
  const expiresIn = (session.expires_at! * 1000) - Date.now();
  
  if (expiresIn < 0) {
    // Token expired, refresh
    const { data, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) throw new Error('Failed to refresh session');
    return data.session;
  }

  return session;
}
```

**User Action**:
1. Log out and log back in
2. Clear browser cookies: `document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"))`
3. Refresh the page

### Session Expiration Issues

**Cause**: Session expires while user is active.

**Solution - Auto-Refresh**:

```typescript
// src/hooks/useSessionRefresh.ts
import { useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export function useSessionRefresh() {
  const supabase = useSupabaseClient();

  useEffect(() => {
    // Check every 5 minutes
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const expiresIn = (session.expires_at! * 1000) - Date.now();
        
        // Refresh if less than 10 minutes remaining
        if (expiresIn < 10 * 60 * 1000) {
          await supabase.auth.refreshSession();
        }
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [supabase]);
}

// Use in your app layout
export default function RootLayout() {
  useSessionRefresh();
  // ... rest of layout
}
```

### CORS Errors During Auth

**Cause**: Authentication requests blocked by Cross-Origin Resource Sharing policy.

**Solution - Configure CORS in Supabase**:

1. Go to Supabase Console > **Project Settings** > **API**
2. Update **API Settings** > **CORS**:

```
Allowed origins:
- http://localhost:3000
- http://localhost:3001
- https://isla.example.com
- https://staging.isla.example.com
- https://*.isla.example.com
```

**Client-Side Headers**:

```typescript
// src/lib/supabase.ts
const supabase = createClient(
  url,
  key,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    },
  }
);
```

**Verify CORS Headers**:

1. Open DevTools > Network tab
2. Find auth request (e.g., `/auth/v1/signup`)
3. Check Response Headers for `Access-Control-Allow-Origin`
4. Should match your current origin

---

## Additional Resources

- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Next.js Auth Integration**: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- **JWT Best Practices**: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
- **OWASP Authentication Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **Email Deliverability**: https://sendgrid.com/en-us/blog/email-deliverability-best-practices

---

## Changelog

| Date | Update |
|------|--------|
| 2024-01-01 | Initial AUTH_SETUP.md documentation |
| | Added Supabase auth configuration guide |
| | Included email templates for signup, password reset, email change |
| | Added OAuth provider setup (Google, Apple, GitHub) |
| | Documented JWT management and token flow |
| | Added session security best practices |
| | Included testing guide with examples |
| | Added production considerations and rate limiting |
| | Created troubleshooting section |
