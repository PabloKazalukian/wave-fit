# Report: CI/CD implementation — GitHub Actions quality gates

> **Historical / Non-Authoritative.** Record of the CI/CD implementation on
> branch `feature/ci-cd`, including a dependency lock incident resolved during
> validation. Current behavior: see `sdd/ci-cd/spec.md` and
> `documents/engineering/ci-cd.md`.

## 1. Objective

Give the WaveFit frontend a committed continuous-integration pipeline that runs
the canonical quality gates on pull requests to `main` and on pushes to `main`,
making CI **mandatory** for merges (per the developer workflow: PR to `main`
must pass CI or it is rejected).

## 2. What was done

Spec and plan first, then the pipeline, with local validation of every gate.

| Commit (feature/ci-cd) | Content |
| ---------------------- | ------- |
| `e747409` | `sdd/ci-cd/spec.md`, `documents/plans/ci-cd/plan.md`, `typecheck` npm script |
| `cc9d113` | Lint debt cleanup (~88 pre-existing ESLint errors → 0) and one-time Prettier format of `src/**` + tooling configs |
| `577e149` | `.github/workflows/ci.yml` (4 jobs) + `format:check` npm script |
| `0b4c30e` | Spec/plan updated to the Prettier decision; engineering docs reflect the committed pipeline; plan marked historical |
| `40e5c40` | `package-lock.json` sync for `npm ci` (chokidar@5/readdirp@5 incident, see §4) |

Supporting work on `main`:

- Merged `feature/test-coverage` into `main` (`8908dec`) so the workflow's
  `unit` gate (`npm run test:ci`, 360 specs) exists on the target branch;
  16 pre-existing commits were unmerged before this work.

### 2.1 Pipeline (`.github/workflows/ci.yml`)

- Triggers: `pull_request` → `main`, `push` → `main`, `workflow_dispatch`.
- Four parallel jobs on `ubuntu-latest`, each: checkout → setup-node (Node 20,
  npm cache) → `npm ci` → gate.

| Job | Command | Notes |
| --- | ------- | ----- |
| `lint` | `npm run lint` + `npm run format:check` | ESLint + Prettier (scoped to `src/**` + root tooling configs) |
| `typecheck` | `npm run typecheck` | `tsc --noEmit -p tsconfig.app.json` |
| `unit` | `npm run test:ci` | Karma + Jasmine, ChromeHeadless |
| `build` | `npm run build` | Angular prod build + Workbox precache |

- `permissions: contents: read`; `concurrency` with `cancel-in-progress`;
  no secrets; no deployment (Vercel Git integration owns deploys).

## 3. Validation (local)

All gates ran green on `feature/ci-cd`:

| Gate | Result |
| ---- | ------ |
| `npm run lint` | ✅ All files pass linting |
| `npm run format:check` | ✅ All matched files use Prettier code style |
| `npm run typecheck` | ✅ |
| `npm run test:ci` | ✅ 360/360 specs |
| `npm run build` | ✅ (warning: initial bundle 846.87 kB > 500 kB budget — non-blocking) |

Deferred until CI runs on GitHub: the same checks as required checks on the PR
and the fail-blocks-merge behavior.

## 4. Incident: `npm ci` EUSAGE ("Missing: chokidar@5.0.0 from lock file")

### 4.1 Symptom

First CI run failed on every job at the `npm ci` step:

```
npm error `npm ci` can only install packages when your package.json and
package-lock.json or npm-shrinkwrap.json are in sync.
npm error Missing: chokidar@5.0.0 from lock file
npm error Missing: readdirp@5.1.1 from lock file
```

### 4.2 Root cause

`package-lock.json` was stale and out of sync with what `package.json` resolves
to. `angular-eslint@21` pulls `@angular-devkit/core@21.2.7`, which declares an
**optional peer dependency** `chokidar@^5.0.0` (tree needs `chokidar@5.0.0` and
`readdirp@5.1.1`). The committed lock only contained `chokidar@4.0.3` /
`readdirp@4.1.2` (last touched in the pre-existing commit `pwa offline works
but bad`).

The discrepancy went unnoticed locally because `npm install` is tolerant:
it resolves and fetches whatever is missing into `node_modules` without failing.
`npm ci` is strict: it installs 1:1 from the lock and validates the lock against
`package.json`; any missing package aborts with `EUSAGE`.

Compounding factor: local npm (11.x) does **not** record the optional peer
(no change from repeated `npm install`), while the CI runner's npm (10.x) does
resolve it. Regenerating the lock with local npm 11 also produced no change.
Only lock regeneration with **npm@10** added the missing entries.

### 4.3 Fix

```text
npx -y npm@10.9.2 install --package-lock-only
```

This added `chokidar@5.0.0` and `readdirp@5.1.1` as `optional + peer` entries
nested under `@angular-eslint/*`, leaving `package.json` unchanged. Validated
with `npm ci --dry-run` under both npm 11 and npm 10 (the runner's npm):
no sync error.

(Note: a real local `npm ci` was blocked by Windows since the developer's dev
server held `node_modules/@esbuild/win32-x64/esbuild.exe`; this is a local
file-lock issue only and does not affect the Linux runner.)

## 5. Deferred / next steps

- Push is done (`feature/ci-cd`), PR is opened by the developer from the web.
- Once the PR is up: enable branch protection on `main` in GitHub Settings and
  mark `lint`, `typecheck`, `unit`, `build` as required checks.
- E2E (Playwright) job in CI: deferred (needs a live backend and gitignored
  `e2e/.auth` state).
- Optional cleanup: remove the unusual runtime dependency `"npm": "^11.12.1"`
  from `package.json` (not required for this feature).