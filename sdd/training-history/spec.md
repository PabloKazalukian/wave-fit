# Training History

## Context

The training history is a **read-only** calendar view that lists completed/pending training days across week-logs and day-logs. It lives under `/user/history` and is the only low-complexity pure-read feature in the domain.

## Requirements

### FR: Functionality

- **FR-001** `/user/history` displays a monthly calendar; each day tile shows status and container type.
- **FR-002** `TrainingHistoryService.getTrainingCalendar(year, month)` sends `GET_TRAINING_CALENDAR` with `{ year, month+1, timezone }` and returns `TrainingCalendarResponse`.
- **FR-003** `CalendarDay.type` distinguishes `WEEK_LOG` vs `DAY_LOG` entries.
- **FR-004** Each calendar day carries `status: TrainingStatus` (`pending`, `complete`, `skipped`, `rest`, `none`), and optional `workoutSessionId`, `extraSessionIds[]`, `dayLogId` (the day-log id for `DAY_LOG` entries) and `weekLogReference` (the parent week container reference).
- **FR-005** Clicking a calendar day with content opens a detail **preview panel below the calendar** with that day's exercises and a navigation button (in the panel header) to the corresponding show page by id. Tiles without content (`none`, `rest`, or days without exercises) do not open a preview.
- **FR-006** `WeekLogReference` exposes `id`, `startDate`, `endDate`, `completed`, `active`, `notes?`.
- **FR-007** Clicking a `WEEK_LOG` day fetches the week by `weekLogReference.id` (`PlanTrackingService.findById` → `findOne`), resolves the workout whose `date` matches the clicked day and shows its exercises in the preview; the header button "Ver semana" navigates to `/user/trackings/:id`. If that day has no exercises, no preview opens.
- **FR-008** Clicking a `DAY_LOG` day with a `dayLogId` fetches the day-log (`PlanDayService.findById`) and shows its exercises in the preview; the header button "Ver día" navigates to `/user/tracking/day/:id`. If the day-log has no exercises, no preview opens.
- **FR-009** The week-log show page (`/user/trackings/:id`) renders a status badge: "Activa" (secondary-light styling) when `tracking.active`, otherwise "Completada" (success) or "Incompleto" (warning) by `completed`.
- **FR-010** When the preview shows a `WEEK_LOG` day whose parent week is active (`DayPreview.active`), an extra CTA "Ver mi semana" (raised, primary) is rendered next to "Ver semana"; both navigate to `/user/trackings/:id`. Non-active weeks keep only "Ver semana".

### BR

- `BR-003` (`date` fields are `LocalDate`) applies. ~~`BR-012`~~ **Note:** the spec previously cited BR-012 as "network-only read", but BR-012 in `documents/domain/business-rules.md` defines **"Offline-first writes"** — a write rule. The network-only read policy is correctly covered by NFR-001.

### NFR

- **NFR-001** Calendar queries bypass Apollo cache (`network-only`) to guarantee freshness.
- **NFR-002** Timezone is sent automatically (`Intl.DateTimeFormat().resolvedOptions().timeZone`); the user does not provide it.

## Constraints

- This is a **read-only** view; there is no create/edit/delete in this feature.
- The service is low-complexity (API + Service pattern; no domain/state/storage layer).

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
 └── TrainingHistoryDayPreview (app-training-history-day-preview) — day detail panel, CTA, detail loading/error/retry
```

- `TrainingHistoryCalendar` receives `days`, `year`, `month` (0-based),
  `selectedDate`, `loading`, `error` as inputs and emits `daySelected`,
  `previousMonth`, `nextMonth`, `reload`.
- `TrainingHistoryDayPreview` receives `preview: DayPreview | null`, `loading`,
  `error` as inputs and emits `retry`. The CTA routerLink and label are derived
  from `DayPreview.kind`.
- The page owns calendar data loading, month/year signals, and the preview
  state machine (`loadWeekPreview` / `loadDayPreview` / `failPreview` /
  `closePreview`).

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
    id: string; // weekLogReference.id (WEEK_LOG) or dayLogId (DAY_LOG)
    date: LocalDate;
    exercises: ExercisePerformanceVM[];
    active?: boolean; // WEEK_LOG only: true when the parent week is the active week (FR-010)
}
```

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
src/app/pages/user/history/  (history.ts, history.html, history.css, history.spec.ts — thin orchestrator)
```

## Implementation Notes

### What works

- Monthly calendar grid with status/type differentiation.
- `month+1` conversion (1-based) with auto-timezone per FR-002/NFR-001/NFR-002.
- Loading/error states with retry.
- Status-based styling (complete, rest, pending, none/today).
- Week-run styling (consecutive week-log days get visual continuity within a month).
- Route registered at `user` → `history`; linked from header (desktop + mobile).
- Day-click preview (FR-005/FR-007/FR-008): clicking a week-log or day-log day with exercises shows a preview panel below the calendar with a navigation button to the corresponding show page by id.
- `DayPreview.active` propagates the parent week's `active` flag (FR-010); active weeks render the raised "Ver mi semana" CTA next to "Ver semana".
- Week-log show page renders the "Activa" badge via `Tracking.active` (FR-009), exposed through the `WEEK_LOG_FIELDS` fragment.

### What does NOT work

- **Skipped status visual (AC-002):** `TrainingStatus.SKIPPED` has no dedicated predicate or style. Falls through to the generic default branch in `getDayClasses`. No legend entry for "skipped". `getDayAriaLabel` labels unhandled status as "pendiente".

### Known issues

- **Debug `console.log(res)`** at `training-history.service.ts:31` — leftover debugging.
- **Effect subscription leak:** `calendarEffect` subscribes inside an `effect` without `DestroyRef`; subscription is not tied to component destroy.
- **Padding days** from adjacent months are synthetic entries typed as `DAY_LOG` with `status: NONE` — fabricated, not from API.
- **Fetched but unused fields:** `workoutSessionId` and `extraSessionIds` are queried and declared in the interface but never read by the UI component (`dayLogId` and `weekLogReference` are used by the preview panel).
- **Backend dependency:** the preview requires `trainingCalendar.days[].dayLogId` on `DAY_LOG` entries; until `wave-fit-api` returns it, `GET_TRAINING_CALENDAR` fails at the GraphQL field-selection level (calendar breaks). Deploy fields in tandem.
- **`toUpperCase()` comparison** in `isComplete`/`isRest`/`isPending` is inconsistent with `isNone` which compares directly to the enum.

## Tests

- **TEST-001** `getTrainingCalendar` sends `month+1` to the API (1-based) with the user's timezone. ✅ (`training-history.service.spec.ts`)
- **TEST-002** Response maps correctly: days list, type, status, optional `weekLogReference`. ✅ (`training-history.service.spec.ts`)
- **TEST-003** Page composition (`history.spec.ts`): clicking a `WEEK_LOG`/`DAY_LOG` tile opens the preview with that day's exercises and the CTA; `REST`/empty days do not open a preview; detail error offers retry. ✅
- **TEST-004** Calendar widget (`calendar.spec.ts`): grid rendering, tile click emits `daySelected`, month nav emits `previousMonth`/`nextMonth`, loading/error blocks. (Implemented with the widget extraction.)
- **TEST-005** Day-preview widget (`day-detail-preview.spec.ts`): exercise list rendering, CTA label/routerLink per `kind`, loading/error + `retry` emission. (Implemented with the widget extraction.)
- **TEST-006** Week show page (`show.spec.ts`): renders "Activa" (secondary-light) when `active`, "Completada"/"Incompleto" otherwise (FR-009). ✅
- **TEST-007** Day-preview widget (`day-detail-preview.spec.ts`) and page (`history.spec.ts`): an active `WEEK_LOG` day renders the raised "Ver mi semana" CTA alongside "Ver semana"; non-active weeks do not (FR-010). ✅

**Note:** The previous `training-history.spec.ts` (broken import of nonexistent `./training-history`) was removed; service coverage lives in `training-history.service.spec.ts`. The page and widget specs are `history.spec.ts`, `calendar.spec.ts`, `day-detail-preview.spec.ts`.

## Acceptance Criteria

- **AC-001** The user can view a month of training and distinguish week-log vs day-log entries. ✅
- **AC-002** Completed, pending, rest ~~and skipped~~ days are visually distinct. ⚠️ Skipped has no distinct rendering.
- **AC-003** Clicking a calendar day opens the corresponding detail page via the preview panel below the calendar. ✅
