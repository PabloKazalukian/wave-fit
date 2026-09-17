# Training History

## Context

The training history is a **read-only** calendar view that lists completed/pending training days across week-logs and day-logs. It lives under `/user/history` and is the only low-complexity pure-read feature in the domain.

## Requirements

### FR: Functionality

- **FR-001** `/user/history` displays a monthly calendar; each day tile shows status and container type.
- **FR-002** `TrainingHistoryService.getTrainingCalendar(year, month)` sends `GET_TRAINING_CALENDAR` with `{ year, month+1, timezone }` and returns `TrainingCalendarResponse`.
- **FR-003** `CalendarDay.type` distinguishes `WEEK_LOG` vs `DAY_LOG` entries.
- **FR-004** Each calendar day carries `status: TrainingStatus` (`pending`, `complete`, `skipped`, `rest`, `none`), and optional `workoutSessionId`, `extraSessionIds[]`, `weekLogReference` (the parent week container reference).
- **FR-005** ~~Clicking a day navigates to the corresponding show page~~ **NOT IMPLEMENTED** — day tiles have no click handler; no `Router` is injected in the History component.
- **FR-006** `WeekLogReference` exposes `id`, `startDate`, `endDate`, `completed`, `active`, `notes?`.

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

Page: `/user/history` → `History` (selector `app-history`) → calendar grid → day-tile.

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

## Files

```
src/app/core/services/training-history/training-history.service.ts  (+ .spec.ts — broken, imports nonexistent './training-history')
src/app/core/apollo/training-history.queries.ts
src/app/shared/interfaces/training-history.interface.ts
src/app/pages/user/history/  (history.ts, history.html, history.css — no spec file)
```

## Implementation Notes

### What works
- Monthly calendar grid with status/type differentiation.
- `month+1` conversion (1-based) with auto-timezone per FR-002/NFR-001/NFR-002.
- Loading/error states with retry.
- Status-based styling (complete, rest, pending, none/today).
- Week-run styling (consecutive week-log days get visual continuity within a month).
- Route registered at `user` → `history`; linked from header (desktop + mobile).

### What does NOT work
- **Day-click navigation (FR-005 / AC-003):** No click handler on day tiles. `getWrapperClasses` appends `cursor-pointer` for week-log days (line 209 of `history.ts`), signaling intended-but-missing behavior. The component imports no `Router`.
- **Skipped status visual (AC-002):** `TrainingStatus.SKIPPED` has no dedicated predicate or style. Falls through to the generic default branch in `getDayClasses`. No legend entry for "skipped". `getDayAriaLabel` labels unhandled status as "pendiente".

### Known issues
- **Debug `console.log(res)`** at `training-history.service.ts:31` — leftover debugging.
- **Effect subscription leak:** `calendarEffect` subscribes inside an `effect` without `DestroyRef`; subscription is not tied to component destroy.
- **Padding days** from adjacent months are synthetic entries typed as `DAY_LOG` with `status: NONE` — fabricated, not from API.
- **Fetched but unused fields:** `workoutSessionId`, `extraSessionIds`, `weekLogReference` are queried and declared in the interface but never read by the UI component.
- **`toUpperCase()` comparison** in `isComplete`/`isRest`/`isPending` is inconsistent with `isNone` which compares directly to the enum.

## Tests

- **TEST-001** ~~`getTrainingCalendar` sends `month+1` to the API (1-based) with the user's timezone.~~ **NOT IMPLEMENTED.**
- **TEST-002** ~~Response maps correctly: days list, type, status, optional `weekLogReference`.~~ **NOT IMPLEMENTED.**

**Note:** The existing `training-history.spec.ts` is broken — it imports `TrainingHistory` from `./training-history` which does not exist (the real export is `TrainingHistoryService` from `./training-history.service`). There is no `history.spec.ts` for the page component.

## Acceptance Criteria

- **AC-001** The user can view a month of training and distinguish week-log vs day-log entries. ✅
- **AC-002** Completed, pending, rest ~~and skipped~~ days are visually distinct. ⚠️ Skipped has no distinct rendering.
- **AC-003** ~~Clicking a day opens the corresponding detail page.~~ ❌ NOT IMPLEMENTED.
