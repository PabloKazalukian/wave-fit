# WaveFit — Testing Strategy

This document defines the **stable testing strategy** for the WaveFit frontend repository.

Feature-specific test scenarios live in the relevant [Specs](../../sdd/README.md) under their `Tests` section.

---

## 1. Testing Philosophy

- Prefer **unit tests** for services, facades, states, and pure functions (wrappers, adapters).
- Prefer **more unit tests** over fewer brittle integration tests; cover edge cases found in the Specs.
- Test the **contract, not the implementation** (public API, behaviors, error states).
- Follow the **test-first** policy of the [Engineering Charter](charter.md): write/update tests before implementing each task.

---

## 2. Unit Tests (Karma + Jasmine)

- Framework: **Jasmine** runner on **Karma** (`jasmine-core`, `karma`, `karma-chrome-launcher`, `karma-jasmine`, `karma-coverage`).
- Command: `npm test` (alias `ng test`); `ng test` in watch mode for development.
- Location: co-located `*.spec.ts` next to the source file (e.g., `exercises.service.spec.ts`, `plan-tracking.spec.ts`, `workout.spec.ts`).
- Covered areas today include: services (`auth`, `coach`, `exercises`, `plans`, `routines`, `tracking-history`, `user-profile`), API modules (`extra-session.api`, `plans.api`, `routines.api`, `plan-tranking.api`), storage (`plans.storage`, `plan-tracking.storage`), state (`workout`), infra (`date.service`, `token.storage`, `credentials`).

### Naming

- File: `<name>.spec.ts`.
- Test blocks: `describe('<Unit under test>')`, `it('<behavior under test>')` describing the expected contract behavior.

---

## 3. End-to-End Tests (Playwright)

- Framework: **Playwright** (`@playwright/test`).
- Location: `/e2e`.
- Command: `npx playwright test` (not wired into `npm` scripts).
- Config: `playwright.config.ts` (baseURL `http://localhost:4200`, `data-test` test id attribute, chromium project, `e2e/.auth/user.json` storage state, HTML reporter, CI-aware retries/workers).
- A **setup** project (`*.setup.ts`) prepares authenticated state before the main suite.

---

## 4. Test Isolation and Fixtures

- Prefer dependency injection with mocks/stubs (e.g., `TestBed` providers with stubbed API services).
- Date-sensitive tests should rely on `DateService`/fixed `LocalDate` inputs.
- E2E authentication state is persisted to `e2e/.auth/user.json` (gitignored).
