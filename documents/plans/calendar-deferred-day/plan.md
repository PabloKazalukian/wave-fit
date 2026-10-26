# Plan: Calendar deferred day — create on click

## Context

`/user/history` (spec `sdd/training-history/spec.md`) renders a monthly calendar
plus a day preview panel. The previous iteration added the "Agregar día" button
for an unassigned day, but it only navigated to `/user/history/deferred` and that
page was still a scaffold (`day-deferred works!`). Nothing was created and the
new day never appeared in the calendar.

This plan records the iteration that closes the flow: the button creates the
deferred day-log immediately, notifies the user, reloads the month, opens the new
empty day in the preview and offers an "Editar día" action that opens a
read-only demo form.

## Target behaviour

1. Selecting an eligible empty day shows the existing `app-info-card` (two icon
   lines) and the "Agregar día" button below the calendar.
2. Clicking "Agregar día":
    - creates the day-log immediately (no navigation);
    - shows a success notification ("Día creado correctamente");
    - disables the button while the request is in flight;
    - on error, shows an error notification and keeps the button usable.
3. After creation the page reloads the current month from the backend and
   re-selects the created date, so the new day-log appears in the calendar.
4. The created day opens in the preview in its empty state (no exercises, no
   extra sessions) with the "No hay ejercicios registrados" placeholder.
5. The "Agregar día" button and the empty-day info card disappear because the
   day now has a `dayLogId`.
6. A `DAY_LOG` preview shows a new "Editar día" action at the bottom. It
   navigates to `/user/history/deferred?date=<LocalDate>&id=<dayLogId>`.
7. The deferred page reads `date` + `id`, loads the day-log by id and renders a
   simple read-only demo form with labels (date, status, completed, notes,
   exercises, extra sessions). Persisting changes from that page is out of
   scope for this iteration.
8. The "Agregar día" button is only offered for past dates (strictly before
   today in the user timezone). Today/future days stay selectable but show no
   creation CTA.

## Decisions

- **D1 — Immediate creation.** The button stops being a router link; it becomes
  a `<button>` action. No intermediate confirmation screen. The deferred page
  is the _edit_ screen, not the _create_ screen.
- **D2 — Mutation contract (confirmed).** The backend exposes
  `createDayLogDeferred(input: CreateDayLogDeferredInput!)` with
  `CreateDayLogDeferredInput { date: String!, timezone?, planId?, routineDayId?,
notes? }`. It returns the created day-log (`id`, `userId`, `date` as
  `yyyy-MM-dd`, `status`, `active: false`, `completed: false`, `notes`,
  `workoutSessionId` — always present —, `routineDayId`, `planId`). The frontend
  sends `{ date }` only; `timezone` is omitted and the backend uses its default.
- **D3 — No active-tracking side effects.** `createDayLogDeferred` goes
  `PlanDayService` → `PlanDayDomainService` → `PlanDayApi` and returns the
  created VM. It must NOT call `setDayLog`, `setDayLogStorage` or
  `markDayActive`; a past deferred day is not the active day.
- **D4 — Dedicated mutation and wrapper.** A dedicated `CREATE_DAY_LOG_DEFERRED`
  document avoids overloading `createDayLog` (which always sends `timezone`).
  The response is mapped by `wrapperDayLogDeferredApiToVM`; because the backend
  returns a plain `yyyy-MM-dd` date, `deferredDateToLocalDate` keeps it as-is and
  only falls back to the timezone conversion when an ISO instant arrives.
- **D5 — Reload + reselect with fallback.** After creation call
  `loadCalendar(currentYear, currentMonth, created.date, created.id)`. If the
  calendar response does not include the new `dayLogId` (eventual consistency),
  the helper synthesizes the selected `CalendarDay` with `dayLogId = created.id`
  so the preview and "Editar día" still work.
- **D6 — Empty day-log preview.** `loadDayPreview` always sets the preview when
  a day-log exists, even with zero exercises/extras. The existing "No hay
  ejercicios registrados" placeholder stays. Week-log empty/rest days keep their
  current behaviour.
- **D7 — Edit link params.** Pass both `date` and `id`:
  `/user/history/deferred?date=2026-10-15&id=<dayLogId>`. `date` is the
  user-facing value; `id` lets the page fetch the real day-log without a second
  calendar lookup. The page still works with only `date` (empty demo form).
- **D8 — Deferred page is a demo.** `DayDeferred` orchestrates routing/loading;
  `DayDeferredForm` renders the read-only form. No save mutation in this
  iteration.
- **D9 — Notification.** Reuse the shared `app-notification` toast pattern from
  `stats.html`/`stats.ts` (fixed top-center, 4 s auto-close).

## Tasks

### T1 — Data layer: deferred creation

Files:

- `src/app/core/apollo/day-log.queries.ts`
- `src/app/shared/interfaces/api/day-log-api.interface.ts`
- `src/app/core/services/day-logs/plan-day/api/plan-day.api.ts`
- `src/app/core/services/day-logs/plan-day.domain.ts`
- `src/app/core/services/day-logs/plan-day.service.ts`
- `src/app/shared/wrappers/day-log.wrapper.ts`

Steps:

1. Add `CREATE_DAY_LOG_DEFERRED` with `DAY_LOG_FIELDS` and the
   `CreateDayLogDeferredInput` argument.
2. Add `CreateDayLogDeferredInput` and `DayLogDeferredAPI`.
3. `PlanDayApi.createDayLogDeferred(payload)` → Apollo mutate, map with
   `wrapperDayLogDeferredApiToVM`, same `handleGraphqlError` pipeline as
   `createDayLog`.
4. `PlanDayDomainService.createDayLogDeferred(date)` → API call only. No state,
   storage or active-tracking writes.
5. `PlanDayService.createDayLogDeferred(date)` → delegates to the domain, no
   `_persist`.

### T2 — History page: create, notify, refresh

Files:

- `src/app/pages/user/history/history.ts`
- `src/app/pages/user/history/history.html`

Steps:

1. Inject `PlanDayService` (already injected) and add:
    - `creatingDeferred = signal(false)`
    - `notification = signal<{ message: string; type: 'success' | 'error' } | null>(null)`
    - `addDeferredDay()`: guard `selectedDay()` / `creatingDeferred()`; call
      `planDaySvc.createDayLogDeferred(date)`; on success notify, then
      `loadCalendar(currentYear, currentMonth, date, created.id)`; on error
      notify "No se pudo crear el día"; `finalize` resets `creatingDeferred`.
2. `canAddDeferred` requires `isPastDate(date)` (compare `yyyy-MM-dd` against
   the user-local today) in addition to no `dayLogId` / no
   `weekLogReference`.
3. Extend `loadCalendar(year, month, selectDate?, fallbackDayLogId?)` and
   `findDay(days, date, fallbackDayLogId?)` to attach the fallback id.
4. Remove `routerLink` / `queryParams` from the "Agregar día" button; bind
   `[text]="creatingDeferred() ? 'Creando...' : 'Agregar día'"`,
   `[isDisabled]="creatingDeferred()"`, `(click)="addDeferredDay()"`, keep
   `dataTest="history-add-deferred"`.
5. Add the notification block at the top of the template (same fixed wrapper as
   `stats.html`).
6. Render the info card + button under `@if (isEmptySelection())` so the CTA
   never appears while a preview is open; both disappear naturally after
   creation.

### T3 — Preview widget: empty day + "Editar día"

Files:

- `src/app/shared/components/widgets/training-history/day-detail-preview/day-detail-preview.ts`
- `src/app/shared/components/widgets/training-history/day-detail-preview/day-detail-preview.html`
- `src/app/pages/user/history/history.ts` (`loadDayPreview`)

Steps:

1. `loadDayPreview`: if `dayLog` exists, always set the preview; drop the
   "no exercises and no extras → clear" branch for `DAY_LOG`.
2. After the exercises + extra-sessions blocks, add a footer visible only for
   `p.kind === CalendarDayType.DAY_LOG && p.id`:
   `<app-btn text="Editar día" variant="outline" color="primary" size="sm"
routerLink="/user/history/deferred" [queryParams]="editDayQueryParams(p)"
dataTest="history-edit-day">`.
3. Add `editDayQueryParams(p): Params` returning `{ date: p.date, id: p.id }`.
4. Keep the existing header CTA ("Ver día") unchanged.

### T4 — Deferred page: read-only demo form

Files:

- `src/app/pages/user/history/day-deferred/day-deferred.ts`
- `src/app/pages/user/history/day-deferred/day-deferred.html`
- `src/app/shared/components/widgets/training-history/day-deferred-form/day-deferred-form.ts`
- `src/app/shared/components/widgets/training-history/day-deferred-form/day-deferred-form.html`

Steps:

1. `DayDeferred`: inject `ActivatedRoute`, `PlanDayService`, `DateService`; read
   `date` and `id` from `queryParamMap`; validate `date` as a LocalDate; if `id`,
   call `planDaySvc.findById(id)` with `loading`/`error` signals and a `retry`;
   render a "Volver al historial" link to `/user/history`.
2. `DayDeferredForm` inputs `date`, `dayLog`, `loading`, `error`; emits `retry`.
   Renders read-only controls:
    - `Fecha` (display string + raw `yyyy-MM-dd`);
    - `Estado`;
    - `Completado`;
    - `Notas` (readonly textarea);
    - `Ejercicios` list (name + series) or "Sin ejercicios";
    - `Sesiones extra` count or "Sin sesiones extra";
    - loading and error placeholders.
3. No save button (to avoid implying persistence).
4. Use the design tokens from `documents/design/ui-conventions.md`
   (`bg-background2`, `border-background4`, `text-text1/text2`, `text-primary`).

### T5 — Tests

Files:

- `src/app/pages/user/history/history.spec.ts`
- `src/app/shared/components/widgets/training-history/day-detail-preview/day-detail-preview.spec.ts`
- `src/app/pages/user/history/day-deferred/day-deferred.spec.ts`
- `src/app/shared/components/widgets/training-history/day-deferred-form/day-deferred-form.spec.ts`
- `src/app/core/services/day-logs/plan-day.domain.spec.ts`
- `src/app/core/services/day-logs/plan-day.service.spec.ts`
- `src/app/shared/wrappers/day-log.wrapper.spec.ts`

Cases implemented:

1. "Agregar día" calls `createDayLogDeferred(date)` once and does not navigate.
2. Success: notification, `getTrainingCalendar` reloaded, created date selected,
   empty preview open, creation CTA gone, "Editar día" links to
   `/user/history/deferred?date=...&id=...`.
3. Reload without the new `dayLogId` still selects the created id (fallback).
4. Failure: error notification, button enabled again, calendar not reloaded.
5. Empty `DAY_LOG` with `dayLogId` opens the preview with the placeholder.
6. "Editar día" exists for `DAY_LOG` and is absent for `WEEK_LOG`.
7. Deferred page with `?date&id` loads the day-log and renders the labels; with
   only `?date` renders the empty form; invalid date and fetch error are handled
   (retry).
8. Today/future days do not show the creation CTA.
9. `createDayLogDeferred` does not call
   `state.setDayLog`/`storage.setDayLogStorage`/`markDayActive`; the wrapper
   keeps `yyyy-MM-dd` dates and normalizes optional fields.

### T6 — SDD and plan sync

- `sdd/training-history/spec.md`: context (write action), FR-005/FR-008,
  new FR-012/FR-013, constraints, architecture (page + deferred page),
  data-contract note (`editDayQueryParams`), file map, implementation notes,
  TEST-003/011/012/013, AC-005/006.
- `sdd/day-log/spec.md`: FR-013 rewritten with the confirmed contract,
  constraints (`CreateDayLogDeferredInput`), deferred creation path in the
  architecture, data contract (`CreateDayLogDeferredInput`,
  `DayLogDeferredAPI`), file map, TEST-008/009.
- This document.

### T7 — Validation gates

- `npx prettier --write` on all changed files.
- `npm run typecheck`
- `npm run lint`
- `npm run test:ci`
- `npm run build` (the 857 kB bundle-budget warning is pre-existing)
- Manual check: empty past day → create → toast → calendar refresh → empty
  preview with "Editar día" → deferred page shows the data.

## Acceptance criteria

- [x] "Agregar día" creates a day-log; it no longer navigates.
- [x] Success toast is shown; error toast is shown on failure.
- [x] The calendar month is reloaded from the backend and the created day is
      selected (with a fallback id when the response lags).
- [x] The created day's empty preview is visible with the placeholder.
- [x] The "Agregar día" button and empty-day info card disappear after creation.
- [x] "Editar día" appears at the bottom of a `DAY_LOG` preview and opens
      `/user/history/deferred?date=...&id=...`.
- [x] The deferred page loads the day-log and shows date/status/notes/exercises
      with simple labels.
- [x] No active day-log/active tracking is changed by the deferred creation.
- [x] Today/future days do not offer creation.
- [x] All quality gates pass.

## Risks / open questions

- **Backend contract:** confirmed against the backend repo
  (`createDayLogDeferred`, `CreateDayLogDeferredInput`, `workoutSessionId`
  always present). If the backend changes the argument name or the response
  shape, the GraphQL document and `DayLogDeferredAPI` must be updated together.
- **Eventual consistency:** the calendar reload may not include the new
  `dayLogId` immediately; the fallback id in D5 covers this.
- **Active tracking:** must not be touched; covered by domain and facade tests.
- **Empty `DAY_LOG` display:** opening previews for all empty day-logs is a
  deliberate behaviour change (needed for the created day); pre-existing empty
  day-logs now show the empty preview + "Editar día".
- **Timezone:** the past-date check uses the user's local date. The calendar
  strings are already local dates, so no conversion is applied.

## Status

Done — implemented and validated (`npm run typecheck`, `npm run lint`,
`npm run test:ci` 764/764, `npm run build` with only the pre-existing
bundle-budget warning, `npm run format:check`).
