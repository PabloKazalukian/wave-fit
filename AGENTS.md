# AGENTS.md — WaveFit Frontend

## Purpose

This file is the entry point for AI agents and engineers working on the WaveFit
**frontend** (Angular 20 + TypeScript + TailwindCSS + Apollo GraphQL; the
backend is a separate NestJS repository).

It defines navigation rules and mandatory development behavior.
It does not contain detailed architectural, domain, feature, or
implementation documentation — those live in `documents/` and `sdd/`.

## Mandatory Read Order

1. `documents/engineering/charter.md`
2. Relevant engineering documentation (`documents/engineering/README.md`)
3. Relevant domain documentation (`documents/domain/README.md`)
4. Relevant ADRs (`documents/decisions/README.md`)
5. Relevant Spec (`sdd/README.md`)
6. Relevant existing code and tests (`src/`)
7. Create or review the Plan (`documents/plans/<feature>/plan.md`)

## Development Workflow

Engineering Charter
→ Spec
→ Clarification
→ Plan
→ Tasks
→ Tests
→ Implementation
→ Validation
→ Documentation Update

## Source of Truth

For implemented behavior:

- Spec + Code are authoritative.
- Stable documentation (`documents/engineering/`, `documents/domain/`) describes the
  validated current system.
- ADRs (`documents/decisions/`) preserve decision rationale.
- Plans (`documents/plans/`) and the legacy archive (`documents/legacy/`) are historical
  and non-authoritative.

A contradiction between Spec and Code must be explicitly resolved.
Do not silently choose one.

## Planning

A Plan is mandatory before implementation, regardless of whether
the developer explicitly requests planning.

Plans live in:

`documents/plans/<feature>/plan.md`

Plans are implementation artifacts and never define current behavior.

## Implementation

- One task at a time.
- Tests first.
- Validate each task.
- Do not implement unspecified behavior.
- Do not silently change contracts.

## Changes

If implementation reveals that the Spec is incomplete or incorrect:

Spec
→ Clarification
→ Plan
→ Tasks
→ Tests
→ Code
→ Validation
→ Documentation

## Documentation

- Stable documentation is updated only after validation.
- Do not duplicate feature behavior in engineering documentation.
- Do not use Plans as current documentation.

## Language

- Code: English.
- Technical documentation: English.
- Specs: English.
- Developer-facing responses: developer's requested language.
- User-facing application content: product language.

## Validation

Quality gates are local (no CI pipeline committed yet — see
`documents/engineering/ci-cd.md`).

```bash
npm start        # dev server, http://localhost:4200
npm run lint     # ESLint
npm test         # unit tests (Karma + Jasmine)
npm run build    # production build + Workbox PWA service worker
npx prettier --check .   # formatting (no npm script; .prettierrc configured)
```

E2E uses Playwright (`@playwright/test`) — see `documents/engineering/testing.md`.
Before touching templates, read `documents/design/ui-conventions.md` and `documents/design/ui-components.md`.

## Repository Map

- `src/` — application code (`src/app/core`, `src/app/pages`, `src/app/shared`)
- `sdd/` — feature Specs (source of truth per feature: `sdd/<feature>/spec.md`)
- `documents/engineering/` — stable engineering knowledge (charter, architecture, coding standards, testing, git, ci-cd, pwa)
- `documents/domain/` — stable domain knowledge (overview, glossary, business rules)
- `documents/decisions/` — ADRs
- `documents/design/` — UI/UX conventions
- `documents/plans/` — implementation plans/history
- `documents/legacy/` — archived historical documentation (former loose `documents/` tree; reference only)
