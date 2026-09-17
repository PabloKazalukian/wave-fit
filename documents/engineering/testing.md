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
- CI/non-interactive run: `npm run test:ci` (`ng test --watch=false --browsers=ChromeHeadless`).
- Location: co-located `*.spec.ts` next to the source file (e.g., `exercises.service.spec.ts`, `plan-tracking.service.spec.ts`, `workout.state.spec.ts`).
- Narrow targeted run (single feature while developing): pass `--include` once per spec, e.g.
  `ng test --watch=false --browsers=ChromeHeadless --include=src/app/core/auth/token.storage.spec.ts`
  (a directory path includes all its `.spec.ts` files). This overrides the default `**/*.spec.ts`
  glob. **A comma-separated list does not work** — repeat `--include` for each spec.
- Karma binds a fixed port (`9876`), so do not run two `ng test` processes in parallel.
- Covered areas today are driven by the `sdd/*/spec.md` `Tests` sections (TEST-xxx), which are the
  source of truth for scenarios. The suite spans core services (`auth`, `coach`, `exercises`,
  `extra-session`, `plans`, `routines`, `tracking`, `training-history`, `user-profile`) and their
  domain/facade/state/storage/API layers, infrastructure (`date.service`, `token.storage`,
  `credentials`, `network-status`, `sync-queue`, `indexed-db`), shared wrappers/adapters
  (`plans`, `routines`, `tracking`, `exercises`, `profile`), plus shared UI/widget component specs.
- Spec-only support files (`src/app/core/testing/*.mock.ts`) are excluded from the application
  build via `tsconfig.app.json`.

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
- **Note**: `webServer` is **not** configured in `playwright.config.ts` (commented out) — the app must be running already (`npm start`) before `npx playwright test`.

---

## 4. Test Isolation and Fixtures

- Prefer dependency injection with mocks/stubs (e.g., `TestBed` providers with stubbed API services).
- Date-sensitive tests should rely on `DateService`/fixed `LocalDate` inputs.
- E2E authentication state is persisted to `e2e/.auth/user.json` (gitignored).
