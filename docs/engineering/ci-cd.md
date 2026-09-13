# WaveFit — CI/CD

This document describes the **current build, quality-gate, and deployment strategy** for the WaveFit frontend repository.

> ⚠️ **Status**: There is currently **no committed CI pipeline** in this repository (no `.github/workflows`, no `vercel.json`). The checks below are the canonical **local** quality gates. They are listed in the intended CI order as a target; do not treat them as an existing CI implementation.

---

## 1. Quality Gates (local commands)

| Gate         | Command                  | Notes                                     |
| ------------ | ------------------------ | ----------------------------------------- |
| Lint         | `npm run lint`           | Angular ESLint (`ng lint`)                |
| Format check | `npx prettier --check .` | Prettier `printWidth: 100`, `singleQuote` |
| Unit tests   | `npm test`               | Karma + Jasmine (`ng test`)               |
| E2E tests    | `npx playwright test`    | Playwright (`/e2e`) — optional, CI-aware  |
| Build        | `npm run build`          | `ng build` + `workbox injectManifest`     |
| Type check   | `npx tsc --noEmit`       | Enum/type contract verification           |

---

## 2. Intended Pipeline Order

```text
Lint
  ↓
Type Check
  ↓
Unit Tests
  ↓
E2E
  ↓
Build
  ↓
Deploy
```

This is the **recommended** gate order for a future CI workflow (e.g., GitHub Actions on pull requests to `main`) and for the deployment branch.

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

- `main` is the deployable branch and must always build and pass the local quality gates.
- PRs must pass lint, build, and unit tests before merge.
- Behavior changes must include the corresponding Spec update (see [git-workflow.md](git-workflow.md) and [charter.md](charter.md)).
