# Git Workflow

This document defines the **branch strategy, commit conventions, and merge rules** for the WaveFit frontend repository.

---

## 1. Branch Strategy

| Purpose       | Branch pattern           | Example          |
| ------------- | ------------------------ | ---------------- |
| Large feature | `feature/<feature-name>` | `feature/sdd`    |
| Bug fix       | `fix/<bug-name>`         | `fix/day-log-ws` |

- A branch is created from a clean `main` and targets `main` when merged.
- Branch names use `feature/` and `fix/` prefixes as the canonical convention. Historical branches named `feat/*` exist and remain valid for archaeology, but new branches follow the canonical pattern.
- Every large feature must be preceded by a Spec and a Plan (see the [Engineering Charter](charter.md)).

---

## 2. Commits

- Write commits that describe **what** changed and **why**, in the imperative mood.
- Prefer conventional prefixes for clarity:
    - `feat:` — new capability
    - `fix:` — bug correction
    - `refactor:` — internal change without behavior change
    - `docs:` — documentation change
    - `chore:` — tooling/housekeeping
- Keep commits focused: one logical change per commit.
- Do not commit secrets, environment values, or build artifacts.

---

## 3. Pull Requests

- Open a PR to `main` when the feature/fix branch is ready.
- The PR description should reference:
    - the Spec it implements (`docs/specs/<feature>/spec.md`);
    - the Plan it follows (`docs/plans/<feature>/plan.md`), when applicable;
    - the validation performed.
- CI checks run on the PR (lint, build, tests — see [ci-cd.md](ci-cd.md)).

---

## 4. Merge Strategy

- Merge into `main` via **pull request**.
- Keep the default merge strategy used by the repository (merge commits are used today).
- Resolve in the PR the documentation updates that must land with the code.

---

## 5. `main` Branch Rules

- `main` is the **deployable** branch (production deployment target).
- `main` must always build and pass validation.
- Direct pushes to `main` are avoided; changes land via PRs.
- Do not force-push to `main`.

---

## 6. Documentation and Specs in PRs

Because this project is **Spec-Anchored**:

- A PR that changes behavior must include the corresponding **Spec update**.
- A PR must not leave an old Plan looking like current truth — completed plans are marked **Historical / Non-Authoritative** (see [`charter.md`](charter.md)).
- Documentation updates land **after** implementation and validation, in the same change scope.
