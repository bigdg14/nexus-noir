# Authentication System Documentation

## Overview

Nexus Noir uses NextAuth.js with enhanced security features for production-ready authentication. The system supports:

- **Email/Password Authentication** with secure password hashing
- **OAuth Providers** (Google, with LinkedIn ready to enable)
- **Email Verification** for new accounts
- **Password Reset** via email tokens
- **Rate Limiting** to prevent brute force attacks
- **JWT Sessions** with secure token management

## Features

### 1. User Registration

**Endpoint**: `POST /api/auth/signup`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "username",
  "displayName": "User Name"
}
```

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Process**:
1. Validates input fields
2. Checks if email/username already exists
3. Hashes password using bcrypt (12 rounds)
4. Creates user account (emailVerified: false)
5. Generates verification token (valid for 24 hours)
6. Sends verification email
7. Returns success message

### 2. Email Verification

**Endpoints**:
- `POST /api/auth/verify-email` (programmatic)
- `GET /api/auth/verify-email?token=TOKEN` (click-through)

**Process**:
1. Validates token and expiration
2. Updates user's emailVerified status
3. Sends welcome email
4. Deletes used token (one-time use)

Users must verify their email before they can sign in.

### 3. Sign In

**Provider**: `credentials`

**Development Mode**:
- Provider: `dev-login` (no password required, email only)
- Available only when NODE_ENV=development

**Production Mode**:
- Provider: `credentials` (email + password)
- Validates email verification status
- Checks password hash
- Implements rate limiting (5 attempts per 15 minutes)
- Clears rate limit on successful login

### 4. OAuth Sign In

**Supported Providers**:
- Google (configured)
- LinkedIn (ready to enable)

**Process**:
1. User clicks "Sign in with Google"
2. Redirects to Google OAuth consent screen
3. On callback, checks if user exists
4. If new user:
   - Creates account with emailVerified=true
   - Generates unique username from email
   - Stores OAuth account details
5. If existing user:
   - Updates OAuth tokens
   - Links OAuth account if not already linked
6. Creates session

### 5. Password Reset

**Step 1: Request Reset**

**Endpoint**: `POST /api/auth/forgot-password`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Process**:
1. Validates email
2. Checks rate limiting
3. Finds user (silently fails if not found for security)
4. Deletes any existing reset tokens
5. Generates new token (valid for 1 hour)
6. Sends password reset email
7. Always returns success to prevent email enumeration

**Step 2: Reset Password**

**Endpoint**: `POST /api/auth/reset-password`

**Request Body**:
```json
{
  "token": "reset-token-here",
  "newPassword": "NewSecurePass123!"
}
```

**Process**:
1. Validates token and expiration
2. Validates new password strength
3. Hashes new password
4. Updates user password
5. Deletes used token

### 6. Rate Limiting

**Protection Against**:
- Brute force attacks
- Password guessing
- Account enumeration

**Limits**:
- Max 5 failed attempts per identifier
- 15-minute lockout period
- Tracks by IP address or email
- Auto-cleanup after 24 hours

**Identifiers**:
- Client IP address (from headers)
- Email address (as fallback)

### 7. Security Features

**Password Storage**:
- Bcrypt hashing with 12 rounds
- Never stored in plain text
- Password field nullable for OAuth-only users

**Token Security**:
- Cryptographically secure random tokens (32 bytes)
- One-time use (deleted after verification)
- Time-limited expiration
- Stored with expiry timestamps

**Session Management**:
- JWT strategy
- 30-day session duration
- Secure HTTP-only cookies
- CSRF protection built-in

**Email Security**:
- Prevents email enumeration in forgot password
- Timing attack prevention (consistent delays)
- Clear security warnings in reset emails

## Environment Variables

Required environment variables (add to `.env`):

```env
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email (Required for production)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@nexusnoir.com"
```

## Setup Instructions

### 1. Database Schema

The schema includes these new tables:
- `VerificationToken` - Email verification and password reset tokens
- `Account` - OAuth provider accounts
- `LoginAttempt` - Rate limiting data

Schema updates:
- User.password (nullable)
- User.emailVerified (boolean)

Already applied via `npx prisma db push`.

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Configure OAuth consent screen
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret to `.env`

### 3. Email Setup (Gmail Example)

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate new app password
3. Add to `.env`:
   ```
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-16-char-app-password"
   ```

### 4. Development Mode

In development, emails are logged to console instead of being sent:

```
📧 Email would be sent:
To: user@example.com
Subject: Verify your Nexus Noir email
Body: [HTML content]
```

### 5. Production Checklist

- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Configure production SMTP service
- [ ] Set up OAuth providers
- [ ] Configure proper NEXTAUTH_URL
- [ ] Enable HTTPS
- [ ] Set up email domain verification (SPF, DKIM)
- [ ] Test all auth flows
- [ ] Monitor rate limit logs
- [ ] Set up error tracking (Sentry, etc.)

## API Reference

### POST /api/auth/signup
Create new user account with email verification.

### POST /api/auth/verify-email
Verify email address with token.

### GET /api/auth/verify-email?token=TOKEN
Verify email via URL click-through.

### POST /api/auth/forgot-password
Request password reset email.

### POST /api/auth/reset-password
Reset password with token.

### POST /api/auth/signin
NextAuth endpoint for credentials/OAuth login.

### GET /api/auth/signout
Sign out current user.

## File Structure

```
src/
├── lib/
│   ├── auth.ts                    # NextAuth configuration
│   └── auth/
│       ├── password.ts            # Password hashing & validation
│       ├── email.ts               # Email sending utilities
│       ├── tokens.ts              # Token generation & verification
│       └── rate-limit.ts          # Rate limiting logic
├── app/
│   └── api/
│       └── auth/
│           ├── signup/route.ts          # User registration
│           ├── verify-email/route.ts    # Email verification
│           ├── forgot-password/route.ts # Password reset request
│           └── reset-password/route.ts  # Password reset
└── prisma/
    └── schema.prisma              # Database schema
```

## Common Issues & Solutions

### Issue: Emails not sending

**Solution**: Check SMTP credentials and enable "Less secure apps" or use App Passwords for Gmail.

### Issue: OAuth redirect not working

**Solution**: Ensure authorized redirect URI matches exactly: `{NEXTAUTH_URL}/api/auth/callback/{provider}`

### Issue: Rate limit too aggressive

**Solution**: Adjust `MAX_ATTEMPTS` and `LOCKOUT_DURATION` in `src/lib/auth/rate-limit.ts`

### Issue: Tokens expiring too quickly

**Solution**: Adjust expiration times in `src/lib/auth/tokens.ts`:
- Email verification: 24 hours
- Password reset: 1 hour

## Security Best Practices

1. **Never log passwords** - Even in development
2. **Use HTTPS in production** - Required for secure cookies
3. **Rotate NEXTAUTH_SECRET** - Invalidates all sessions
4. **Monitor failed login attempts** - Set up alerts for anomalies
5. **Keep dependencies updated** - Regular security patches
6. **Implement CSP headers** - Content Security Policy
7. **Use secure session cookies** - HTTP-only, Secure, SameSite
8. **Validate all input** - Never trust client data
9. **Log security events** - Authentication attempts, password resets
10. **Regular security audits** - Code reviews, penetration testing

## Migration from Dev Login

To transition from dev login to production auth:

1. **Update existing users**:
   ```sql
   -- Add passwords for test users (optional)
   UPDATE "User"
   SET "emailVerified" = true
   WHERE email IN ('marcus.williams@example.com', ...);
   ```

2. **Update sign-in page** to support both credentials and OAuth

3. **Test authentication flow** with real email addresses

4. **Disable dev-login** by setting `NODE_ENV=production`

## Future Enhancements

Potential additions for future iterations:

- [ ] Two-factor authentication (2FA/TOTP)
- [ ] Social login (LinkedIn, Twitter/X)
- [ ] Passwordless authentication (magic links)
- [ ] Biometric authentication (WebAuthn)
- [ ] Session management dashboard
- [ ] Login history and device tracking
- [ ] IP-based geolocation blocking
- [ ] Account recovery questions
- [ ] Email change verification
- [ ] Username change with cooldown

## Support

For issues or questions:
- GitHub Issues: [Repository Issues](https://github.com/your-repo/issues)
- Documentation: This file and inline code comments
- NextAuth.js Docs: https://next-auth.js.org/

---

**Last Updated**: December 2024
**Version**: 1.0.0
