# CI / CD

## Context

The WaveFit frontend (Angular 20 + npm) defines canonical **local** quality gates
in `documents/engineering/ci-cd.md`, but there is **no committed CI pipeline**:
no `.github/workflows` and no `vercel.json`.

This Spec defines the continuous-integration pipeline for the repository: a
GitHub Actions workflow that runs the canonical quality gates on pull requests to
`main` and on pushes to `main`. Deployment to Vercel is handled by the **Vercel
Git integration** and is out of scope of this pipeline.

## Requirements

### FR-001 — Workflow triggers

A GitHub Actions workflow (`ci.yml`) runs on:

- `pull_request` targeting `main`;
- `push` to `main`;
- manual `workflow_dispatch`.

### FR-002 — Quality gates

The workflow runs these gates as **separate, parallel jobs**, all required for a
green run:

| Job        | Command                     | Purpose                                  |
| ---------- | --------------------------- | ---------------------------------------- |
| `lint`     | `npm run lint` + `npm run format:check` | ESLint + formatted code (Prettier, scoped) |
| `typecheck`| `npm run typecheck`         | Type/contract verification               |
| `unit`     | `npm run test:ci`           | Karma + Jasmine, headless                |
| `build`    | `npm run build`             | Production build + Workbox service worker precache |

### FR-003 — Failed gate blocks merge

If any required job fails, the pull request **cannot be merged**. Enforcement:

- the workflow exposes each job as a *required status check*;
- branch protection on `main` marks those checks as required (configured in
  GitHub repository Settings; branch-protection rules are **not** versioned).

### FR-004 — Cancel stale runs

`concurrency` cancels in-progress runs for the same ref when a newer trigger
arrives (`cancel-in-progress`).

### FR-005 — Minimal permissions

The workflow runs with the least privilege required: `contents: read`.

### FR-006 — Reproducible dependency installation

Dependencies are installed from `package-lock.json` with `npm ci` on Node 20,
using the GitHub Actions npm cache.

## Constraints

- **NFR-001** — Node 20 (Angular 20 requires Node `^20.19.0`).
- **NFR-002** — E2E (Playwright) is **out of scope** for this pipeline: the current
  e2e specs require a live backend and a non-committed auth state file
  (`e2e/.auth/user.json`). A dedicated E2E job is deferred to a future change.
- **NFR-003** — Deployment is owned by the Vercel Git integration; no Vercel
  configuration or secrets are committed in this repository.
- **NFR-004** — Branch-protection rules are configured manually on GitHub
  (requires admin) and are not versioned.
- **NFR-005** — The workflow requires **no secrets**.

## Architecture

Single workflow file `.github/workflows/ci.yml` (YAML) with four parallel jobs on
`ubuntu-latest`. Each job follows the same shape:

```text
checkout
  ↓
setup-node (Node 20, npm cache)
  ↓
npm ci
  ↓
gate command(s)
```

The repository root `tsconfig.json` is a solution-style config (`files: []` with
project references), so a bare `tsc --noEmit` checks nothing. The `typecheck`
script therefore targets the application project explicitly:
`tsc --noEmit -p tsconfig.app.json`.

Prettier is applied only to the **application and tooling sources** (`src/**` and
the root tooling configs listed by the `format:check` script), not to
documentation or generated artifacts.

## Files

- `.github/workflows/ci.yml` — the pipeline definition (new).
- `package.json` — adds the `typecheck` and `format:check` scripts (new).

## Tests

The gates below validate the exact commands the pipeline will run. They are the
test-first contract for this change; they run locally (T) until the pipeline
itself is live (see deferred scenarios).

- **TEST-001** — `npm run lint` passes locally.
- **TEST-002** — `npm run format:check` passes locally (Prettier scoped to `src/**`
  and root tooling configs).
- **TEST-003** — `npm run typecheck` passes locally.
- **TEST-004** — `npm run test:ci` passes locally (Karma + ChromeHeadless).
- **TEST-005** — `npm run build` passes locally (production build + Workbox).
- **TEST-006** — *Deferred (runs only on GitHub):* a pull request to `main`
  triggers the workflow and all four jobs report success.
- **TEST-007** — *Deferred (runs only on GitHub):* a failing job makes the
  corresponding required check fail, blocking the merge.

## Acceptance Criteria

- **AC-001** — A pull request to `main` shows required checks named `lint`,
  `typecheck`, `unit`, and `build`.
- **AC-002** — Merging is blocked while any required check reports failure
  (branch protection with required checks enabled).
- **AC-003** — `documents/engineering/ci-cd.md` describes the committed pipeline
  (current state), not a target.
- **AC-004** — The workflow performs **no deployment**; the Vercel Git
  integration owns deploying `main`.