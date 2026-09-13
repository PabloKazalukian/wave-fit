# Authentication

## Context

WaveFit requires an authenticated user for every feature except the auth pages themselves. The frontend supports **Google OAuth (PKCE)** and **email/password** flows. The JWT is delivered in an **HttpOnly cookie**; the frontend Client ships credentials automatically (`withCredentials`) and persists a lightweight session snapshot locally.

## Requirements

### FR: Functionality

- **FR-001** Provide `/auth/login` with Google OAuth sign-in (PKCE) and an email/password form.
- **FR-002** Provide `/auth/register` for new email/password accounts.
- **FR-003** Provide `/auth/callback` to complete the Google OAuth round-trip and persist the session.
- **FR-004** `AuthService` exposes the current user as a signal/subscription (`user$`) and an `isAuthenticated` state.
- **FR-005** On startup, `auth.initializer` restores the session asynchronously before the app settles (timeout 3s); `me()` lookup is bounded (2s).
- **FR-006** `authGuard` protects all routes except `/auth/*`; unauthenticated access redirects to login.
- **FR-007** Token storage is **asynchronous** over IndexedDB/Dexie (`core/auth/token.storage.ts`, store `authUser`).
- **FR-008** `credentials.service.ts` stores "remember me" credentials encrypted in `localStorage`.
- **FR-009** `AuthService` supports `initializeUserFromStorage`, `updateAvatar`, and `avatarUrl`.
- **FR-010** GraphQL errors of type `UNAUTHENTICATED` trigger a logout through the Apollo `errorLink` wired in `main.ts`.

### BR

Cross-cutting domain rules apply (see [business-rules.md](../../domain/business-rules.md)); `BR-005` (route protection) is owned by this feature.

### NFR

- **NFR-001** Session bootstrap must not block first paint beyond the 3s timeout.
- **NFR-002** No auth token in `localStorage` or JS-accessible storage; HttpOnly cookie only.
- **NFR-003** Production cookie is `Secure` + `SameSite=None`.

## Constraints

- No `authLink`/Authorization header — Apollo uses `withCredentials`.
- `TokenStorage` is **indexed over Dexie**, not the synchronous legacy `localStorage` implementation.
- Credentials are encrypted (not plaintext).
- Do not introduce `UserService` — profile handling belongs to the User Profile feature.

## Architecture

```
AuthService (core/services/auth/auth.service.ts)          — signals, session, avatar
├── auth.initializer.ts                                   — bootstrap restore (3s)
├── core/auth/token.storage.ts                            — Dexie IndexedDB persistence
├── core/services/auth/credentials.service.ts             — encrypted "remember me"
└── Apollo errorLink (main.ts)                            — UNAUTHENTICATED → logout
```

- Google PKCE flow: the login page initiates the OAuth dance and lands on `/auth/callback`.
- Email/password credentials are persisted from the login page (`login.ts`) into `credentials.service`.
- API contract shape: `Token { access_token, userId }`, `User { id, name, email, avatar, role }`.

## Files

```
src/app/core/auth/token.storage.ts
src/app/core/auth/auth.initializer.ts
src/app/core/auth.spec.ts
src/app/core/services/auth/auth.service.ts
src/app/core/services/auth/credentials.service.ts
src/app/core/auth-guard.ts
src/app/pages/auth/login/  src/app/pages/auth/register/  src/app/pages/auth/callback/
core/apollo/user-profile.queries.ts        (Me query)
```

## Tests

- **TEST-001** TokenStorage persists/reads/clears the session asynchronously (IndexedDB).
- **TEST-002** CredentialsService encrypts and restores "remember me" data.
- **TEST-003** AuthService exposes the session and reacts to `UNAUTHENTICATED`.
- **TEST-004** authGuard redirects when unauthenticated and allows when authenticated.

## Acceptance Criteria

- **AC-001** A user can sign in with Google or email/password and is redirected to a protected page.
- **AC-002** Refreshing the app restores the session without a visible login flash beyond the timeout budget.
- **AC-003** An expired/invalid session triggers logout and redirect.
- **AC-004** No auth secret is readable from JS storage.
