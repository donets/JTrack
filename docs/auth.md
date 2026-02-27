# JTrack Authentication System

**Status (2026-02-24):** Option B implemented — register, verify email, forgot/reset password, password change, hashed one-time auth tokens, frontend flows, Resend delivery via `MAIL_PROVIDER=resend`. Password hashing uses argon2id (19MiB/2 iterations/1 parallelism) with transparent bcrypt migration on login. UX follows spec naming conventions, includes password show/hide toggles, inline blur validation, resend rate limiting (60s cooldown), and auto-redirect with toast after password reset.

---

## Table of Contents

1. [Core Architecture](#1-core-architecture)
2. [User Model & Sign Up](#2-user-model--sign-up)
3. [Auth Token Model](#3-auth-token-model)
4. [Session & Refresh Token Model](#4-session--refresh-token-model)
5. [JWT Specification](#5-jwt-specification)
6. [Password Reset](#6-password-reset)
7. [API Endpoints](#7-api-endpoints)
8. [Rate Limiting](#8-rate-limiting)
9. [Email Service (Resend)](#9-email-service-resend)
10. [UI/UX Standards](#10-uiux-standards)
11. [Security Hardening](#11-security-hardening)
12. [Shared Contracts](#12-shared-contracts)
13. [Test Matrix](#13-test-matrix)
14. [Deferred Features (Post-MVP)](#14-deferred-features-post-mvp)

---

## 1. Core Architecture

| Decision | Detail |
|----------|--------|
| Session strategy | JWT access token (`Authorization: Bearer ...`) + refresh token as HttpOnly cookie (`/auth` path) |
| Password hashing | argon2id (memory=19MiB, iterations=2, parallelism=1). bcrypt acceptable fallback; never SHA/MD5 |
| Identity model | Email IS the identity (no username). Normalized to lowercase, trimmed, Unicode NFKC normalized |
| Transport | HTTPS-only for all auth endpoints in production |

---

## 2. User Model & Sign Up

### Flow

Email + Password → validate → hash password → store user (unverified) → send verification email → user clicks link → mark verified.

### Sign Up Validation Rules

| Rule | Detail |
|------|--------|
| Email normalization | Lowercase, trim whitespace, NFKC Unicode normalization, punycode IDN domains |
| Email validation | Regex + soft MX check (don't block signup solely on MX failure; treat as warning) |
| Password length | Minimum 8 chars, maximum 128 chars |
| Password blocklist | Check against HaveIBeenPwned top-100k list (static bloom filter, no external API in hot path; update periodically) |
| Verification code | 6-digit OTP generated via `crypto.randomInt(0, 1_000_000)`, SHA-256 hashed, expires in 15 min (configurable via `AUTH_VERIFY_EMAIL_TTL_MINUTES`), single-use |
| Anti-enumeration | Always return "If this email exists, we've sent a verification link" — if email already exists, re-send verification (if unverified) or silently do nothing |

### User Table

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `email` | String | Unique, not null |
| `passwordHash` | String | argon2id hash |
| `tokenVersion` | Integer | Default 0; increment on password reset, manual revoke, suspicious activity; include in JWT as `tv` |
| `emailVerifiedAt` | DateTime? | Set on verification |
| `passwordChangedAt` | DateTime? | Set on password change/reset |
| `lastLoginAt` | DateTime? | Updated on login |
| `createdAt` | DateTime | Auto-set |

---

## 3. Auth Token Model

Dedicated `AuthToken` table for all verification/reset/invite flows.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `userId` | UUID | FK to User |
| `type` | Enum | `EmailVerification`, `PasswordReset`, `InviteAccept` |
| `tokenHash` | String | SHA-256 hash of raw token (never store plaintext; **constant-time comparison**) |
| `expiresAt` | DateTime | Token expiry |
| `consumedAt` | DateTime? | Set when token is used (single-use enforcement) |
| `createdAt` | DateTime | Creation timestamp |
| `createdByIp` | String? | Audit trail |
| `userAgent` | String? | Audit trail |

**Key detail:** Store `SHA-256(token)` in DB, send raw token in email. Compare hashes on verification using constant-time comparison. A DB leak doesn't compromise pending tokens.

### Token TTLs

| Type | Default | Env var |
|------|---------|---------|
| Email verification | 15 min | `AUTH_VERIFY_EMAIL_TTL_MINUTES` |
| Password reset | 15 min | `AUTH_RESET_PASSWORD_TTL_MINUTES` |
| Invite accept | 7 days | `JWT_INVITE_TTL` |

### Token Generation

- Generated as 6-digit OTP via `crypto.randomInt(0, 1_000_000)`, zero-padded
- Stored as SHA-256 hash (raw code sent in email)
- All email links must use HTTPS

---

## 4. Session & Refresh Token Model

### Session Table

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key / `jti` |
| `userId` | UUID | FK to User |
| `refreshTokenHash` | String | SHA-256 hash of current refresh token |
| `createdAt` | DateTime | Session creation |
| `lastUsedAt` | DateTime | Updated on each refresh |
| `revokedAt` | DateTime? | Set on revocation |
| `ip` | String? | Client IP |
| `userAgent` | String? | Client user-agent |
| `parentSessionId` | UUID? | For rotation chain tracking (optional) |

### Refresh Token Rotation (Critical)

On every `POST /auth/refresh`:

1. Validate the incoming refresh token against `refreshTokenHash` in the Session table.
2. Issue a **new** refresh token and a new access token.
3. Update `refreshTokenHash` and `lastUsedAt` in the Session row.
4. Invalidate the old refresh token.

### Reuse Detection

If a previously consumed refresh token is presented again:

1. **Treat as theft** — the token was likely stolen.
2. Revoke **all sessions** for that user (or at least the entire session family via `parentSessionId`).
3. Force re-login.
4. **Log alert**: `refresh_token_reuse_detected`.

### Session Expiry

| Rule | Value |
|------|-------|
| Idle timeout | 30 days |
| Absolute max | 90 days |

---

## 5. JWT Specification

### Claims

| Claim | Value |
|-------|-------|
| `iss` | `JWT_ISSUER` env var (default `jtrack`) |
| `aud` | `JWT_AUDIENCE` env var (default `jtrack`) |
| `sub` | `userId` (UUID) |
| `iat` | Issued-at timestamp |
| `exp` | Expiry timestamp |
| `jti` | Unique token ID (session ID) |
| `tv` | `tokenVersion` from User table |

### Configuration

| Setting | Value |
|---------|-------|
| Algorithm | HS256 (shared secret) or RS256/EdDSA with key rotation (preferred) |
| Access token TTL | 5–15 minutes |
| Clock-skew tolerance | 30–60 seconds |

### Validation Rules

- Validate `iss` and `aud` on every request; reject if missing or invalid.
- Reject if `jwt.iat < user.passwordChangedAt` (immediate invalidation on password change).
- Reject if `jwt.tv !== user.tokenVersion` (immediate invalidation on token version bump).
- Never put sensitive data in JWT payload (no passwords, no secrets).

---

## 6. Password Reset

### Flow

User enters email → send reset link → user clicks → show "new password" form → validate token → update password → invalidate **all** existing sessions → increment `tokenVersion` → send confirmation email.

### Requirements

| Requirement | Detail |
|-------------|--------|
| Reset code | 6-digit OTP, SHA-256 hashed, expires in 15 min (configurable via `AUTH_RESET_PASSWORD_TTL_MINUTES`) |
| Single-use | Set `consumedAt` on consumption |
| Session invalidation | Revoke all sessions (set `revokedAt` on all Session rows for user) |
| Token version | Increment `tokenVersion` to invalidate all outstanding access tokens |
| Anti-enumeration | "If this email is registered, you'll receive a reset link" |

---

## 7. API Endpoints

### Public Endpoints (`@Public()`, `@SkipLocationGuard()`)

| Endpoint | Input | Behavior |
|----------|-------|----------|
| `POST /auth/register` | `{ email, name, password, locationName, timezone, address? }` | Create user + Location + UserLocation(role=Owner) in transaction; create verification token; send email. Anti-enumeration: same response for duplicate emails |
| `POST /auth/verify-email/request` | `{ email }` | If user exists and not verified, issue new token + email. Always returns `{ ok: true }` |
| `POST /auth/verify-email/confirm` | `{ email, code }` | Validate 6-digit OTP, set `emailVerifiedAt`, consume token |
| `POST /auth/password/forgot` | `{ email }` | Issue reset token if account exists, send email. Always returns `{ ok: true }` |
| `POST /auth/password/reset` | `{ email, code, newPassword }` | Validate 6-digit OTP, update password, revoke all sessions, increment `tokenVersion`, consume token |
| `POST /auth/login` | `{ email, password }` | Verify credentials (reject unverified users with 403), return access token, set refresh cookie, create Session row |
| `POST /auth/refresh` | (cookie) | Rotate refresh token, issue new access token, update Session row |
| `GET /auth/me` | — | Return current user info (+ CSRF token for refresh/logout) |
| `POST /auth/logout` | — | Revoke session (set `revokedAt`), clear refresh cookie |

### Protected Endpoints

| Endpoint | Input | Behavior |
|----------|-------|----------|
| `POST /auth/password/change` | `{ currentPassword, newPassword }` | Verify current password, rotate password, revoke all sessions, increment `tokenVersion` |

---

## 8. Rate Limiting

Sliding window counter (Redis or in-memory with TTL for MVP).

### Per-Endpoint Limits

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| `POST /auth/register` | 5 req | 15 min | IP |
| `POST /auth/login` | 10 req | 15 min | IP + email |
| `POST /auth/password/forgot` | 3 req | 1 hour | IP + email |
| `POST /auth/verify-email/confirm` | 10 req | 15 min | IP |
| `POST /auth/password/reset` | 5 req | 15 min | IP |

### Global Throttle

- Per-IP cap across all auth endpoints (prevent distributed abuse).

### Error Response

```json
{
  "error": "too_many_requests",
  "message": "You've made too many attempts. Please try again in 12 minutes.",
  "retry_after_seconds": 720
}
```

- Return `429 Too Many Requests` with `Retry-After` header.
- Login: after 5 failed attempts for a specific email, progressive delay (1s, 2s, 4s, 8s...).
- Never lock accounts permanently — account lockout is a DoS vector.
- Log all rate-limit hits with IP + endpoint for monitoring.

---

## 9. Email Service (Resend)

### Configuration

| Variable | Description |
|----------|-------------|
| `MAIL_PROVIDER` | `resend` (production), `console` (dev logging), `noop` (disabled) |
| `MAIL_FROM` | Verified sender, e.g., `JTrack <no-reply@yourdomain.com>` |
| `RESEND_API_KEY` | API key from Resend dashboard |

### Email Functions

- `sendVerificationEmail(to, token)`
- `sendPasswordResetEmail(to, token)`
- `sendPasswordChangedNotification(to)`

### Implementation Notes

- Use Resend SDK (handles retries).
- DNS: SPF + DKIM + DMARC configured.
- Templates: plain text + minimal HTML, include company name, action button, "didn't request this? ignore" footer, plaintext fallback URL.
- Idempotency: generate unique `Idempotency-Key` per email send to prevent double-sends.
- All email links must use HTTPS.

---

## 10. UI/UX Standards

### Routes

| Route | Title | Purpose |
|-------|-------|---------|
| `/login` | "Sign in" | Email + password + "Forgot password?" link + "Create account" link |
| `/signup` | "Create your account" | Email + password + password strength indicator |
| `/forgot-password` | "Reset your password" | Email input only |
| `/reset-password?token=xxx` | "Set a new password" | New password + confirm |
| `/verify-email?token=xxx` | "Verify your email" | Token validation + success message |

### Naming Conventions

- "Sign in" not "Log in" (warmer, modern standard)
- "Create account" not "Register" (less bureaucratic)
- "Reset password" not "Forgot password" on the form (action-oriented)
- Button labels: "Continue" or "Continue with email" (not "Submit")
- Error messages in plain English below the field

### UX Best Practices

- Single-column centered card layout, max 400px wide
- Show/hide password toggle (eye icon)
- Inline validation on blur, not on every keystroke
- Route guard behavior: all non-public app routes redirect unauthenticated users to `/login?redirect=<original-path>`.
- If access token refresh fails on an authenticated page request, client redirects to `/login?redirect=<current-path>`.
- After signup: redirect to "Check your email" screen with email displayed and "Resend" button (rate-limited to 1 per 60s)
- After password reset request: same "Check your email" screen
- After successful reset: auto-redirect to login with toast "Password updated. Sign in with your new password."
- No CAPTCHA at launch — rate limiting handles abuse. Add Turnstile only if bot traffic appears
- Disable submit button while request is in-flight, show spinner

### Token-in-URL Safety

- Set `Referrer-Policy: no-referrer` on pages that accept tokens via URL (prevents token leakage via referrer header).
- Optional: put token in fragment (`/#token=...`) and POST to backend (avoids server logs/CDN exposure).

---

## 11. Security Hardening

### Cookie Configuration

| Attribute | Value |
|-----------|-------|
| `HttpOnly` | `true` |
| `Secure` | `true` |
| `SameSite` | `Lax` (or `Strict` if it won't break flows) |
| `Path` | `/auth` |
| Prefix | Consider `__Host-` prefix (requires Secure, Path=/, no Domain) |

### CSRF Protection

Since the refresh token is a cookie, `POST /auth/refresh` and `POST /auth/logout` are CSRF-relevant:

- Keep refresh/logout endpoints POST only.
- **Origin header validation**: `AuthController.validateOrigin()` checks the `Origin` header against configured `WEB_ORIGIN` on `/auth/refresh` and `/auth/logout`. Rejects with 403 if Origin is present but doesn't match.
- `SameSite=Lax` on the refresh cookie blocks cross-origin form POSTs in modern browsers.

### CORS

- Restrict CORS to known frontend origin(s).
- For cookie endpoints: `credentials: true`, no wildcard origins.
- Check `Origin` header on `/auth/refresh` and `/auth/logout`.

### Security Headers

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Content-Security-Policy` | `default-src 'self'` (tighten over time) |
| `Referrer-Policy` | `no-referrer` |
| `Permissions-Policy` | Disable unneeded browser features |

### Password Hardening

- Optional **pepper** (server-side secret) added to password before hashing (defense-in-depth for DB leak).
- Monitor argon2id latency in production; consider raising iterations/memory based on benchmarks.

### Auth Event Logging

Log all events with: `eventType`, `userId` (if known), `email` (normalized), `ip`, `userAgent`, `requestId`.

Events to log:
- Signup, login (success/failure), logout
- Password reset request/completion
- Password change
- Email verification
- Token reuse detection

### Alerting

Set up alerts for:
- Refresh token reuse detected
- High failed-login rates
- Repeated password reset requests across many emails from same IP
- Rate-limit threshold spikes

### Security Checklist

- [ ] HttpOnly, Secure, SameSite=Lax on session cookies
- [ ] CSRF protection via Origin header validation on refresh/logout
- [ ] All tokens are single-use and time-bounded
- [ ] Password hashed with argon2id (memory=19MiB, iterations=2, parallelism=1)
- [ ] No user-enumeration on any endpoint (register, verify, reset)
- [ ] Security headers configured (HSTS, CSP, nosniff, frame deny, referrer, permissions)
- [ ] All auth events logged with IP + user-agent + requestId
- [ ] Session expiry: 30 days idle, 90 days absolute max
- [ ] Login blocked for unverified users (403 Email not verified)
- [ ] Password reset invalidates all existing sessions + increments tokenVersion
- [ ] Refresh token rotation on every refresh
- [ ] Refresh token reuse detection triggers full session revocation
- [ ] Access tokens rejected if `iat < passwordChangedAt` or `tv !== tokenVersion`
- [ ] CORS restricted to known origins
- [ ] Constant-time token hash comparison

---

## 12. Shared Contracts

Zod schemas in `packages/shared/src/schemas.ts`:

- `RegisterInput`
- `VerifyEmailRequestInput`
- `VerifyEmailConfirmInput`
- `ForgotPasswordInput`
- `ResetPasswordInput`
- `ChangePasswordInput`

---

## 13. Test Matrix

### Registration & Verification

- [ ] Register success — user created, verification email sent
- [ ] Register with duplicate email — same success response (anti-enumeration)
- [ ] Verify email — valid token marks `emailVerifiedAt`
- [ ] Verify email — expired token rejected
- [ ] Verify email — reused (consumed) token rejected

### Login

- [ ] Login success for verified user — access token + refresh cookie returned
- [ ] Login blocked for unverified user — 403
- [ ] Login with wrong password — generic error, no enumeration

### Password Reset

- [ ] Forgot-password returns success for existing and non-existing email
- [ ] Reset-password success — password updated, all sessions revoked, `tokenVersion` incremented
- [ ] Reset-password — expired token rejected
- [ ] Reset-password — reused token rejected

### Password Change

- [ ] Change-password requires valid current password
- [ ] Change-password revokes all sessions and increments `tokenVersion`

### Refresh Token

- [ ] Refresh returns new access token + rotated refresh token
- [ ] Old refresh token rejected after rotation
- [ ] Reused refresh token triggers full session revocation (reuse detection)

### Rate Limiting

- [ ] Rate limiting enforced on all auth endpoints
- [ ] Progressive delay on repeated failed login attempts
- [ ] 429 response includes `Retry-After` header

---

## 14. Deferred Features (Post-MVP)

| Feature | Reason to defer |
|---------|-----------------|
| OAuth / social login | Adds complexity, add when users ask |
| MFA / 2FA | Add after launch (design DB to support it) |
| Email change flow | Handle via admin/support initially |
| Account deletion self-serve | Handle manually until legally required |
| Magic links | Nice but adds another flow to maintain |
| Disposable-email domain blocking | Add if abuse metrics warrant it |
| "Active sessions" list in UI | Nice UX win, low priority |
| "Log out of all devices" button | Low priority, backend support exists via session revocation |
