# WaveFit — CI/CD

This document describes the **current build, quality-gate, and deployment strategy** for the WaveFit frontend repository.

A **GitHub Actions pipeline** is committed at `.github/workflows/ci.yml`. It runs the quality gates below on every pull request to `main` and on every push to `main`.

---

## 1. Quality Gates

| Gate         | Command                  | Notes                                     |
| ------------ | ------------------------ | ----------------------------------------- |
| Lint         | `npm run lint`           | Angular ESLint (`ng lint`)                |
| Format check | `npm run format:check`   | Prettier scoped to `src/**` + root tooling configs (`.prettierrc`, `printWidth: 140`) |
| Type check   | `npm run typecheck`      | `tsc --noEmit -p tsconfig.app.json` (root `tsconfig.json` is solution-style) |
| Unit tests   | `npm run test:ci`        | Karma + Jasmine, headless (`ng test --watch=false --browsers=ChromeHeadless`); `npm test` for watch mode |
| E2E tests    | `npx playwright test`    | Playwright (`/e2e`) — not part of CI; requires a live backend and a gitignored `e2e/.auth` state |
| Build        | `npm run build`          | `ng build` + `workbox injectManifest`     |

---

## 2. Committed CI Pipeline

`.github/workflows/ci.yml` triggers on:

- `pull_request` targeting `main`;
- `push` to `main`;
- manual `workflow_dispatch`.

Four jobs run **in parallel** on `ubuntu-latest`, and all are required for a green run:

- `lint` — `npm run lint` + `npm run format:check`;
- `typecheck` — `npm run typecheck`;
- `unit` — `npm run test:ci` (Karma + ChromeHeadless);
- `build` — `npm run build` (production build + Workbox precache).

Every job checks out the code, sets up Node 20 with the npm cache, and installs dependencies with `npm ci`. The workflow uses **minimal permissions** (`contents: read`), **cancels stale runs** via `concurrency` with `cancel-in-progress`, and requires **no secrets**.

Merging is blocked while a required check fails. Branch protection on `main` marks the checks `lint`, `typecheck`, `unit`, and `build` as required; protection rules are configured in GitHub repository Settings (not versioned).

Deployment is **not** part of this workflow — the Vercel Git integration deploys `main` (see below).

---

## 3. Build

- `npm run build` produces a production bundle with the Workbox service worker precache integrated (see [`pwa.md`](pwa.md)).

---

## 4. Deployment

- **Platform**: Vercel (production URL: <https://wave-fit.vercel.app/>).
- The backend is deployed separately (NestJS + GraphQL) and is not part of this pipeline.
- Deployment configuration is managed on the Vercel dashboard; no deployment config is committed in this repository.

---

## 5. Rules for `main` and PRs

- `main` is the deployable branch and must always build and pass the committed CI pipeline.
- PRs to `main` must pass the required checks `lint`, `typecheck`, `unit`, and `build` before merge (enforced by branch protection).
- Behavior changes must include the corresponding Spec update (see [git-workflow.md](git-workflow.md) and [charter.md](charter.md)).
