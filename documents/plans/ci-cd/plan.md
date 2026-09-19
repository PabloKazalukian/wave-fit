# Plan: CI/CD — GitHub Actions quality gates

## Context

The repository defines canonical **local** quality gates
(`documents/engineering/ci-cd.md`) but has **no committed CI pipeline** (`no
.github/workflows`, no `vercel.json`). The unit test suite (`npm run test:ci`)
is green (see `documents/plans/test-coverage/plan.md`).

This plan introduces a GitHub Actions workflow that runs the quality gates on
pull requests to `main` and on pushes to `main`, making CI **mandatory** for
merges: if the required checks fail, the PR cannot be merged (enforced by GitHub
branch protection configured manually on `main`).

Spec: `sdd/ci-cd/spec.md`.

## Decisions

1. Platform: **GitHub Actions** (workflow `.github/workflows/ci.yml`).
2. Gates: four parallel jobs — `lint` (ESLint + Prettier check), `typecheck`,
   `unit` (`test:ci`), `build` (ng build + Workbox).
3. `typecheck` targets `tsconfig.app.json` explicitly
   (`tsc --noEmit -p tsconfig.app.json`): the root `tsconfig.json` is a
   solution-style config with empty `files` and would check nothing.
4. **No deployment** in the workflow: the Vercel Git integration deploys `main`.
5. **E2E deferred**: current Playwright specs need a live backend and a
   gitignored auth state file; not part of this pipeline.
6. Branch protection (required checks named `lint`, `typecheck`, `unit`,
   `build`) is configured manually in GitHub Settings — not versioned.
7. Node 20, `npm ci`, npm cache; minimal permissions (`contents: read`);
   `concurrency` with `cancel-in-progress`.
8. Workflow runs on `pull_request` → `main`, `push` → `main`, and
   `workflow_dispatch` (manual).

## Tasks

- **T1** Write the Spec `sdd/ci-cd/spec.md`.
- **T2** Write this Plan (`documents/plans/ci-cd/plan.md`).
- **T3** Test-first: validate every gate command locally (the Spec `Tests`):
  `npm run lint`, `npx prettier --check .`, `npm run test:ci`, `npm run build`,
  and the `typecheck` command once added in T4.
- **T4** Add the `typecheck` npm script to `package.json`:
  `"typecheck": "tsc --noEmit -p tsconfig.app.json"`.
- **T5** Add `.github/workflows/ci.yml` with the four parallel jobs (decisions
  above).
- **T6** Documentation update (after validation):
  - `documents/engineering/ci-cd.md` — replace the "no committed CI pipeline"
    status with the committed workflow (triggers, job list, required checks,
    branch-protection note); keep gate order and Vercel deployment section.
  - `documents/engineering/git-workflow.md` — remove the "no committed CI
    pipeline yet" note (Section 3) and record that required checks on `main`
    must pass before merge (Section 5).
  - Mark this Plan as Historical / Non-Authoritative.
- **T7** (deferred until requested) Push `feature/ci-cd`, open the PR, and
  validate TEST-006/TEST-007 on GitHub (all jobs green; failing-check blocks
  merge).

## Validation

Per task:

- T4 → `npm run typecheck` on the app project.
- T5 → `git diff` review of the YAML against the Spec gates; YAML parse check.
- Final local gates before pushing: `npm run lint`, `npx prettier --check .`,
  `npm run typecheck`, `npm run test:ci`, `npm run build`.
- On GitHub (T7): workflow run / PR required checks.

## Out of scope

- E2E (Playwright) job in CI.
- Deployment from CI / `vercel.json` / Vercel secrets.
- Configuring branch-protection rules via API (done manually in GitHub Settings).