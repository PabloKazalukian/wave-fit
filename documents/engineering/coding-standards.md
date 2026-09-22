# WaveFit — Coding Standards

This document defines the **stable source-code conventions** for the WaveFit frontend repository. Only rules that actually apply to this project are listed.

---

## 1. Naming Conventions

| Item                         | Convention                  | Example                                |
| ---------------------------- | --------------------------- | -------------------------------------- |
| Files                        | `kebab-case`                | `plan-tracking.service.ts`             |
| Classes / Interfaces / Enums | `PascalCase`                | `PlanTrackingService`                  |
| Functions / Variables        | `camelCase`                 | `getTracking()`                        |
| Interface suffix `VM`        | UI-facing view model        | `RoutineDayVM`                         |
| Interface suffix `API`       | Raw backend response        | `RoutineDayAPI`                        |
| Suffix `SEND`                | Payload sent to backend     | `RoutineDayCreateSend`                 |
| Suffix `Create`              | Data to create an entity    | `RoutinePlanCreate`                    |
| Wrapper functions            | `wrapper<Source>To<Target>` | `wrapperRoutineDayAPItoRoutineDayVM()` |

### Known naming exceptions (intentional / legacy)

- `plan-tranking.api.ts` — the "tranking" typo is legacy and **must not** be silently renamed in a behavior change.
- Service files in high-complexity features use `.ts` suffixes without `.service`: `plan-tracking.domain.ts`, `plan-tracking.state.ts`, `plan-day.domain.ts`, `plan-day.state.ts`.
- Wrapper function names are **not** uniformly `wrapper<Source>To<Target>`: actual code also uses `wrapperExerciseAPItoVM` (lowercase `to`), `wrapperDayLogApiToVM` (lowercase `Api`), and non-`wrapper`-prefixed helpers (`apiDateToLocalDate`, `patchDayLog`, `mapToUpdateWeekLogExtraSessionInput`, `emptyDay`). The convention above is a default for new code, not enforced on existing wrappers.

---

## 2. TypeScript / Angular Conventions

- **Angular 20 standalone** components, pipes, directives — no `NgModules`.
- **Strict TypeScript**: use precise types; avoid `any` in non-adapter code.
- **Inject dependencies** with `inject()` (modern Angular); class constructors with explicit DI for legacy files are discouraged for new code.
- **Signals** for component/query state; **`BehaviorSubject`** + `toSignal` for service caches.
- Prefer `computed()` over manual signal derivation; use `effect()` sparingly (setup, user reactivity).
- `providedIn: 'root'` for root services; component-scoped providers for per-mode services (e.g., facades, `WORKOUT_STORE` implementations).
- Use `InjectorContext`/`InjectionToken` for polymorphic contracts (e.g., `WORKOUT_STORE`).

---

## 3. Data Contract Conventions

- **`LocalDate` = `string`** (`"yyyy-MM-dd"`), never JS `Date`, in VMs. Date comparisons are string comparisons.
- Enums live next to their feature interfaces (`shared/interfaces/*`).
- API responses are normalized with **wrappers** (`shared/wrappers/*.ts`): ISO dates → `LocalDate`, `_id`/`id` sanitization, category case normalization.
- Known domain quirk: the API returns `ExerciseCategory` in **UPPERCASE** (`CHEST`) while the enum is lowercase (`chest`); normalize with `toLowerCase()` when consuming.

---

## 4. Semantic HTML (required in templates)

Use semantic tags instead of bare `<div>`. Reference implementation: `src/app/pages/auth/callback/callback.html` and `weekly-stats.html`.

| Tag                       | Use                                               |
| ------------------------- | ------------------------------------------------- |
| `<section>`               | Self-contained themed block (widget/card)         |
| `<header>`                | Block header (title + actions)                    |
| `<footer>`                | Block footer (complementary info)                 |
| `<nav>`                   | Navigation (pagination, carousel dots, menus)     |
| `<h1>`–`<h6>`             | Headings respecting hierarchy (h2 > h3 > h4…)     |
| `<ul>`/`<ol>` + `<li>`    | Data lists (rows, stats) — never repeated `<div>` |
| `<p>`                     | Text paragraphs                                   |
| `<a>` / `<button>`        | Links / clickable actions                         |
| `<aside>`                 | Complementary content                             |
| `<figure>`/`<figcaption>` | Illustrations with caption                        |

Rules:

1. Only use `<div>` for pure layout (grid/flex without semantic value).
2. Respect heading hierarchy; do not repeat `<h1>` in widgets.
3. Label/value rows → `<ul>` with `<li>`.
4. Use `aria-label`/`aria-labelledby` on sections, navigations, and controls without visible text.

---

## 5. Error Handling

- GraphQL errors are handled through the shared `handleGraphqlError` utility in `shared/utils/`.
- Reactive features expose `error` signals; consumers render meaningful messages.
- Avoid double error reporting from services and components (choose one owner per flow).

---

## 6. RxJS Conventions

- Service caches: `BehaviorSubject` private + readonly `$` observable + optional `toSignal`.
- Long-lived edits persist with `debounceTime` (e.g., 4s exercise update) to avoid API saturation.
- Use `takeUntilDestroyed` / `DestroyRef` for subscriptions in components and services.
- Prefer `switchMap` for dependent async loads (e.g., exercises before tracking mapping).

---

## 7. Architecture Pattern Conventions

Follow the complexity-based service pattern (see [architecture.md](architecture.md)):

| Complexity | Pattern                                    |
| ---------- | ------------------------------------------ |
| High       | Facade + Domain + (API \| Storage) + State |
| Medium     | Service + API (+ Storage + State)          |
| Low        | Service + API combined                     |
| Infra      | standalone service                         |

- **Dumb components** have no business logic; they render inputs and emit outputs.
- **Facades** expose the view-model and actions to templates.
- **Domain services** own business rules and offline sync registration.
- **State services** own reactive state only — **no API/storage logic**.

### 7.1 Page composition and component granularity

Pages (route components) are **thin orchestrators**: they own the route's state
(data loading, selection, navigation) and compose feature widgets. Views and
logic that are **not core to the page** must be extracted into feature widgets
under `shared/components/widgets/<feature>/` — pages do not define their own
child components.

Extract when any of the following holds:

- The view is **secondary** to the page's main responsibility. Example: the
  training-history page's core is the calendar grid; the day-detail preview
  panel underneath it is an extra and lives in its own widget.
- The page's template/class grows beyond a thin orchestrator (the biggest
  pages historically exceeded ~350 lines and duplicated markup that already
  existed in other pages).
- The same markup or logic would be duplicated across pages (e.g., the
  exercise list is shared by `trackings/show`, `tracking-day/show` and the
  history day preview).

Rules:

- A page renders its primary view and coordinates (loads data, wires widget
  outputs); it does **not** render secondary panels inline.
- Feature widgets live in `shared/components/widgets/<feature>/` and may be
  presentational (inputs + outputs) or smart (inject services/facades via
  local `providers`), matching existing widgets such as `tracking-day`,
  `tracking-week`.
- Widget selectors are **feature-prefixed** (`app-<feature>-<name>`, e.g.
  `app-training-history-calendar`), never generic (`app-calendar`).
- Reference implementations: `pages/user/history` composes
  `app-training-history-calendar` + `app-training-history-day-preview`;
  `pages/my-day`, `pages/my-week`, `pages/user/profile` are thin pages over
  widgets.

---

## 8. Formatting and Imports

- **Prettier**: `printWidth: 100`, `singleQuote: true` — configured via the **`prettier` key in `package.json`** (this is the config Prettier actually resolves, confirmed with `prettier --find-config-path`). The repository's `.prettierrc` file (`printWidth: 140`, `tabWidth: 4`) exists but is **shadowed/ignored** because Prettier resolves `package.json` first; treat it as obsolete.
- Run `npx prettier --write .` before finalizing changes; there is **no** `format` npm script. Run `npm run lint` after implementing.
- Keep imports explicit and ordered: Angular core → rxjs → project modules → local.
- Do not add comments to code unless they carry real value (per current repo style, avoid gratuitous comments).

---

## 9. Prohibited / Discouraged

- **`UserService`** does not exist; use `UserProfileService` (Domain + API + State).
- `workout.wrapper.ts` is an empty placeholder — do not use it.
- Do not introduce `@angular/service-worker` — Workbox is the SW.
- Do not create new branches with `feat/` prefix — use `feature/` (see [git-workflow.md](git-workflow.md)).
