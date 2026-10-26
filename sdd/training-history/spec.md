# Training History

## Context

The training history is a calendar view that lists completed/pending training days across week-logs and day-logs. It lives under `/user/history`. Calendar and preview data are read-only; the only write action is creating a **deferred day-log** for a past day with no container (FR-012).

## Requirements

### FR: Functionality

- **FR-001** `/user/history` displays a monthly calendar; each day tile shows status and container type. A pending `DAY_LOG` (including a newly created empty deferred day) renders the day circle with the pending fill (`bg-text2/40`, `rounded-full`) so it reads like a pending day inside a week-log.
- **FR-002** `TrainingHistoryService.getTrainingCalendar(year, month)` sends `GET_TRAINING_CALENDAR` with `{ year, month+1, timezone }` and returns `TrainingCalendarResponse`.
- **FR-003** `CalendarDay.type` distinguishes `WEEK_LOG` vs `DAY_LOG` entries.
- **FR-004** Each calendar day carries `status: TrainingStatus` (`pending`, `complete`, `skipped`, `rest`, `none`), and optional `workoutSessionId`, `extraSessionIds[]`, `extraSessions[]` (full objects, both container types), `dayLogId` (the day-log id for `DAY_LOG` entries) and `weekLogReference` (the parent week container reference).
- **FR-005** Every day tile — including adjacent-month padding cells — is selectable (`role="button"`, keyboard focusable, pointer cursor). Clicking a day of the displayed month with content opens a detail **preview panel below the calendar** with that day's exercises (followed by its `extraSessions` at the end of the workout-session list) and a navigation button (in the panel header) to the corresponding show page by id. Tiles without content (`none`, `rest` without extra sessions) remain selected but do not open a preview (the `DAY_LOG` empty exception is FR-008). Clicking the selected day again deselects it. Clicking a padding cell switches the calendar to that day's month and selects the day after the month loads. A selected past date with no `dayLogId` and no `weekLogReference` shows the empty-day `app-info-card` (two icon lines) and the "Agregar día" button below the calendar; clicking the button creates the day-log immediately (FR-012) instead of navigating.
- **FR-006** `WeekLogReference` exposes `id`, `startDate`, `endDate`, `completed`, `active`, `notes?`.
- **FR-007** Clicking a `WEEK_LOG` day fetches the week by `weekLogReference.id` (`PlanTrackingService.findById` → `findOne`), resolves the workout whose `date` matches the clicked day and shows its exercises in the preview; the header button "Ver semana" navigates to `/user/trackings/:id`. If that day has no exercises **and no extra sessions**, no preview opens. A `REST` day carrying `extraSessions` still opens the preview showing the extra sessions only.
- **FR-008** Clicking a `DAY_LOG` day with a `dayLogId` fetches the day-log (`PlanDayService.findById`) and always opens the preview, even when it has no exercises and no extra sessions (the newly created deferred day shows the "No hay ejercicios registrados" placeholder). The header button "Ver día" navigates to `/user/tracking/day/:id`; at the bottom, an "Editar día" action navigates to `/user/history/deferred?date=<LocalDate>&id=<dayLogId>`. A day-log without `dayLogId` but with `extraSessions` opens a preview with the extra sessions only and **no header CTA** (there is no show page to navigate to).
- **FR-009** The week-log show page (`/user/trackings/:id`) renders a status badge: "Activa" (secondary-light styling) when `tracking.active`, otherwise "Completada" (success) or "Incompleto" (warning) by `completed`.
- **FR-010** When the preview shows a `WEEK_LOG` day whose parent week is active (`DayPreview.active`), an extra CTA "Ver mi semana" (raised, primary) is rendered next to "Ver semana"; both navigate to `/user/trackings/:id`. Non-active weeks keep only "Ver semana".
- **FR-011** The preview renders each day's extra sessions at the end of the workout-session exercise list, **read-only**, using the shared `extra-session-show` widget (no edit/delete). Discipline labels are resolved from the `extraSessionCatalog` cache (`ExtraSessionService.catalog$` / `loadCatalog`), which the page loads once. An empty `DayPreview.id` (extras-only day-log without a `dayLogId`) hides the header CTA instead of building a broken link.
- **FR-012** A selected past date (strictly before today in the user timezone) with no `dayLogId` and no `weekLogReference` offers the "Agregar día" button below the calendar. Clicking it calls `PlanDayService.createDayLogDeferred(date)` immediately (no navigation), disables the button while pending, shows a success or error notification, reloads the current month from the backend and re-selects the created date. The created day opens in the preview in its empty state (FR-008) and the creation CTA disappears. Today and future dates do not show the CTA.
- **FR-013** The deferred edit page `/user/history/deferred?date=<LocalDate>&id=<dayLogId>` loads the day-log by id and renders a read-only demo form with simple labels (date, status, completed, notes, exercises, extra sessions). It also works with only `date` (no day-log loaded). Persisting changes from this page is out of scope for this iteration.

### BR

- `BR-003` (`date` fields are `LocalDate`) applies. ~~`BR-012`~~ **Note:** the spec previously cited BR-012 as "network-only read", but BR-012 in `documents/domain/business-rules.md` defines **"Offline-first writes"** — a write rule. The network-only read policy is correctly covered by NFR-001.

### NFR

- **NFR-001** Calendar queries bypass Apollo cache (`network-only`) to guarantee freshness.
- **NFR-002** Timezone is sent automatically (`Intl.DateTimeFormat().resolvedOptions().timeZone`); the user does not provide it.

## Constraints

- Calendar and preview rendering are **read-only**. The only write is the deferred day-log creation (FR-012), delegated to `PlanDayService.createDayLogDeferred`; there is no edit/delete from the calendar.
- `TrainingHistoryService` remains low-complexity (API + Service pattern; no domain/state/storage layer). Day-log creation/lookup reuse the day-log feature service.

## Architecture

```
TrainingHistoryService (core/services/training-history/training-history.service.ts)
└── training-history.queries.ts (core/apollo/) — GET_TRAINING_CALENDAR
```

The page is a **thin orchestrator** (see `documents/engineering/coding-standards.md`
§7.1) that composes two feature widgets:

```
/user/history → History (app-history) — route state + selection coordination
 ├── TrainingHistoryCalendar (app-training-history-calendar) — month nav, grid, tiles, legend, calendar loading/error
 └── TrainingHistoryDayPreview (app-training-history-day-preview) — day detail panel, CTA, edit action, detail loading/error/retry

/user/history/deferred → DayDeferred (app-day-deferred) — deferred edit page
 └── DayDeferredForm (app-day-deferred-form) — read-only demo form (date, status, completed, notes, exercises, extra sessions)
```

- `TrainingHistoryCalendar` receives `days`, `year`, `month` (0-based),
  `selectedDate`, `loading`, `error` as inputs and emits `daySelected`,
  `previousMonth`, `nextMonth`, `reload`.
- `TrainingHistoryDayPreview` receives `preview: DayPreview | null`, `loading`,
  `error`, `disciplines: ExtraSessionDisciplineConfig[]` as inputs and emits `retry`.
  The CTA routerLink and label are derived from `DayPreview.kind`; the CTA is
  hidden when `preview.id` is empty (FR-011).
- The page owns calendar data loading, month/year signals, the preview
  state machine (`loadWeekPreview` / `loadDayPreview` / `failPreview` /
  `closePreview`) and the extra-session catalog (`ExtraSessionService.catalog$`
  via `loadCatalog()`, passed down as `disciplines`; FR-011).
- Deferred creation (FR-012): `History` calls
  `PlanDayService.createDayLogDeferred(date)` and, on success, reloads the month
  (`getTrainingCalendar`) and re-selects the created date. It shows a
  success/error toast via the shared `app-notification`. The domain/state/
  storage layers of the day-log are **not** touched (no active container is
  changed).
- The deferred page (FR-013) reads `date`/`id` from `ActivatedRoute` query
  params, calls `PlanDayService.findById(id)` when `id` is present and delegates
  rendering to `DayDeferredForm`; it has no save action.

**Note:** The component class is named `History` (not `HistoryComponent` as previously spec'd). The service depends on `AuthService` and uses `handleGraphqlError` for error handling.

## Data contract

```ts
export enum CalendarDayType {
    WEEK_LOG = 'WEEK_LOG',
    DAY_LOG = 'DAY_LOG',
}
export enum TrainingStatus {
    PENDING = 'pending',
    COMPLETE = 'complete',
    SKIPPED = 'skipped',
    REST = 'rest',
    NONE = 'none',
}

export interface WeekLogReference {
    id: string;
    startDate: LocalDate;
    endDate: LocalDate;
    completed: boolean;
    active: boolean;
    notes?: string;
}
export interface CalendarDay {
    date: LocalDate; // "yyyy-MM-dd"
    type: CalendarDayType;
    status: TrainingStatus;
    workoutSessionId?: string;
    extraSessionIds?: string[];
    extraSessions?: ExtraSession[]; // full objects (WEEK_LOG and DAY_LOG); see extra-session.interface
    dayLogId?: string; // day-log id for DAY_LOG entries (backend contract; added for FR-005/FR-008)
    weekLogReference?: WeekLogReference | null;
}
export interface TrainingCalendarResponse {
    year: number;
    month: number;
    days: CalendarDay[];
}
export interface TrainingCalendarInput {
    year: number;
    month: number;
    timezone?: string;
}
```

**Note:** The interface file (`training-history.interface.ts`) is a line-for-line duplicate of this contract. Dates use `string` with `// LocalDate "yyyy-MM-dd"` comments per BR-003.

### UI View-Model (frontend-only)

```ts
export interface DayPreview {
    kind: CalendarDayType.WEEK_LOG | CalendarDayType.DAY_LOG;
    id: string; // weekLogReference.id (WEEK_LOG) or dayLogId (DAY_LOG); '' (empty) for extras-only day-logs without a dayLogId → hides the header CTA (FR-011)
    date: LocalDate;
    exercises: ExercisePerformanceVM[];
    extraSessions: ExtraSession[]; // always present; [] when the day has none (FR-011)
    active?: boolean; // WEEK_LOG only: true when the parent week is the active week (FR-010)
}
```

`TrainingHistoryDayPreview.editDayQueryParams(preview)` builds
`{ date, id }` for the "Editar día" routerLink (FR-008).

`ExercisePerformanceVM` comes from `shared/interfaces/tracking.interface.ts`.
`DayPreview` feeds `TrainingHistoryDayPreview`; `kind` selects the CTA label
("Ver semana" / "Ver día") and the routerLink
(`/user/trackings/:id` / `/user/tracking/day/:id`). For `WEEK_LOG` days,
`active` adds the raised "Ver mi semana" CTA (FR-010).

## Files

```
src/app/core/services/training-history/training-history.service.ts  (+ training-history.service.spec.ts)
src/app/core/apollo/training-history.queries.ts
src/app/shared/interfaces/training-history.interface.ts                (+ DayPreview VM)
src/app/shared/components/widgets/training-history/calendar/           (calendar.ts, .html, .spec.ts)
src/app/shared/components/widgets/training-history/day-detail-preview/ (day-detail-preview.ts, .html, .spec.ts)
src/app/shared/components/widgets/training-history/day-deferred-form/ (day-deferred-form.ts, .html, .spec.ts)
src/app/pages/user/history/  (history.ts, history.html, history.css, history.spec.ts — thin orchestrator)
src/app/pages/user/history/day-deferred/  (day-deferred.ts, .html, .spec.ts — deferred edit page)
```

## Implementation Notes

### What works

- Monthly calendar grid with status/type differentiation.
- `month+1` conversion (1-based) with auto-timezone per FR-002/NFR-001/NFR-002.
- Loading/error states with retry.
- Status-based styling (complete, rest, pending, none/today); a pending `DAY_LOG` gets the `bg-text2/40` rounded fill.
- Week-run styling (consecutive week-log days get visual continuity within a month).
- Route registered at `user` → `history`; linked from header (desktop + mobile).
- Day-click preview (FR-005/FR-007/FR-008): clicking a week-log or day-log day with exercises shows a preview panel below the calendar with a navigation button to the corresponding show page by id.
- Extra sessions in the preview (FR-011): the calendar query returns full `extraSessions` per day; the preview lists them read-only at the end of the exercise list via `extra-session-show`, with discipline labels from the catalog. Days with extras but no exercises open the preview with the extras only (both container types).
- `DayPreview.active` propagates the parent week's `active` flag (FR-010); active weeks render the raised "Ver mi semana" CTA next to "Ver semana".
- Week-log show page renders the "Activa" badge via `Tracking.active` (FR-009), exposed through the `WEEK_LOG_FIELDS` fragment.
- Deferred day creation (FR-012): the "Agregar día" button creates the day-log via `PlanDayService.createDayLogDeferred`, shows a toast, reloads the month and re-selects the created date; the empty preview opens with the placeholder and the creation CTA disappears.
- Empty `DAY_LOG` previews (FR-008): a day-log with a `dayLogId` always opens the preview, even with zero exercises and zero extra sessions.
- "Editar día" (FR-008): `DAY_LOG` previews with an id render a footer action to `/user/history/deferred?date=...&id=...`.
- Deferred edit page (FR-013): `/user/history/deferred` reads `date`/`id`, loads the day-log by id and renders a read-only demo form; date-only renders an empty form.

### What does NOT work

- **Skipped status visual (AC-002):** `TrainingStatus.SKIPPED` has no dedicated predicate or style. Falls through to the generic default branch in `getDayClasses`. No legend entry for "skipped". `getDayAriaLabel` labels unhandled status as "pendiente".

### Known issues

- **Padding days** from adjacent months are synthetic entries typed as `DAY_LOG` with `status: NONE` — fabricated, not from API. Clicking one changes the displayed month to that day's month, reloads it and re-selects the day (the calendar only holds the current month's data, so the tile itself cannot be previewed until its month is loaded).
- **Fetched but unused fields:** `workoutSessionId` is queried and declared in the interface but not read by the UI (`dayLogId`, `weekLogReference` and `extraSessions` are used).
- **Backend dependency:** the preview requires `trainingCalendar.days[].dayLogId` on `DAY_LOG` entries and `trainingCalendar.days[].extraSessions` (full objects) on both types; until `wave-fit-api` returns them, `GET_TRAINING_CALENDAR` fails at the GraphQL field-selection level (calendar breaks). Deploy fields in tandem.
- **`toUpperCase()` comparison** in `isComplete`/`isRest`/`isPending` is inconsistent with `isNone` which compares directly to the enum.

## Tests

- **TEST-001** `getTrainingCalendar` sends `month+1` to the API (1-based) with the user's timezone. ✅ (`training-history.service.spec.ts`)
- **TEST-002** Response maps correctly: days list, type, status, optional `weekLogReference`. ✅ (`training-history.service.spec.ts`)
- **TEST-003** Page composition (`history.spec.ts`): clicking a `WEEK_LOG`/`DAY_LOG` tile opens the preview with that day's exercises and the CTA; `REST`/empty days do not open a preview but remain selected (except an empty `DAY_LOG` with an id, which always opens it); an unassigned empty past day shows the compact `app-info-card` (two icon lines) plus the "Agregar día" button; clicking the button creates the day-log, shows a notification, reloads the month and re-selects the created day (empty preview, button gone); a creation failure shows an error notification and re-enables the button; today/future dates do not show the CTA; clicking a padding cell jumps to its month and selects the day; clicking the selected day again deselects it; detail error offers retry. ✅
- **TEST-004** Calendar widget (`calendar.spec.ts`): grid rendering, every tile (including rest/empty days and adjacent-month padding cells) is selectable with a pointer cursor, a pending `DAY_LOG` tile renders the `bg-text2/40` rounded fill, tile click emits `daySelected`, month nav emits `previousMonth`/`nextMonth`, loading/error blocks. ✅
- **TEST-005** Day-preview widget (`day-detail-preview.spec.ts`): exercise list rendering, CTA label/routerLink per `kind`, loading/error + `retry` emission. (Implemented with the widget extraction.)
- **TEST-006** Week show page (`show.spec.ts`): renders "Activa" (secondary-light) when `active`, "Completada"/"Incompleto" otherwise (FR-009). ✅
- **TEST-007** Day-preview widget (`day-detail-preview.spec.ts`) and page (`history.spec.ts`): an active `WEEK_LOG` day renders the raised "Ver mi semana" CTA alongside "Ver semana"; non-active weeks do not (FR-010). ✅
- **TEST-008** `extra-session-show.spec.ts`: renders discipline label (from catalog), duration, intensity, calories and notes; read-only — no "Modificar"/"Eliminar" controls (FR-011).
- **TEST-009** Day-preview widget (`day-detail-preview.spec.ts`): a preview with `extraSessions` renders them after the exercises; without extras renders none; an empty `preview.id` hides the header CTA (FR-011).
- **TEST-010** Page (`history.spec.ts`) and calendar widget (`calendar.spec.ts`): a day with empty exercises but with extras opens the preview showing the extras only; a `REST` week-log day with extras opens it too; a `REST`/empty day without extras does not; an extras-only day-log without `dayLogId` opens a CTA-less preview (FR-007/FR-008/FR-011).
- **TEST-011** Day-preview widget (`day-detail-preview.spec.ts`): "Editar día" is rendered for `DAY_LOG` previews with an id and links to `/user/history/deferred?date=...&id=...`; it is absent for `WEEK_LOG`; an empty day-log renders the placeholder (FR-008).
- **TEST-012** Deferred page (`day-deferred.spec.ts`): reads `date` + `id`, loads the day-log, renders the read-only labels, handles date-only, invalid date and fetch errors with retry (FR-013).
- **TEST-013** Deferred creation chain (`plan-day.domain.spec.ts`, `plan-day.service.spec.ts`, `day-log.wrapper.spec.ts`): `createDayLogDeferred` sends `{ date }`, does not touch state/storage/active tracking, and the wrapper keeps `yyyy-MM-dd` dates without timezone conversion (FR-012).

**Note:** The previous `training-history.spec.ts` (broken import of nonexistent `./training-history`) was removed; service coverage lives in `training-history.service.spec.ts`. The page and widget specs are `history.spec.ts`, `calendar.spec.ts`, `day-detail-preview.spec.ts`.

## Acceptance Criteria

- **AC-001** The user can view a month of training and distinguish week-log vs day-log entries. ✅
- **AC-002** Completed, pending, rest ~~and skipped~~ days are visually distinct. ⚠️ Skipped has no distinct rendering.
- **AC-003** Clicking a calendar day opens the corresponding detail page via the preview panel below the calendar. ✅
- **AC-004** The preview shows each day's extra sessions read-only at the end of the workout-session list; a day with only extra sessions still opens its preview. ✅
- **AC-005** A past empty day can be created as a deferred day-log from the calendar; the user gets feedback, the month reloads and the empty day opens in the preview. ✅
- **AC-006** A `DAY_LOG` preview offers "Editar día", which opens the deferred page with the day's read-only data. ✅
