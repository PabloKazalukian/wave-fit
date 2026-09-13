# Training History

## Context

The training history is a **read-only** calendar view that lists completed/pending training days across week-logs and day-logs. It lives under `/user/history` and is the only low-complexity pure-read feature in the domain.

## Requirements

### FR: Functionality

- **FR-001** `/user/history` displays a monthly calendar; each day tile shows status and container type.
- **FR-002** `TrainingHistoryService.getTrainingCalendar(year, month)` sends `GET_TRAINING_CALENDAR` with `{ year, month+1, timezone }` and returns `TrainingCalendarResponse`.
- **FR-003** `CalendarDay.type` distinguishes `WEEK_LOG` vs `DAY_LOG` entries.
- **FR-004** Each calendar day carries `status: TrainingStatus` (`pending`, `complete`, `skipped`, `rest`, `none`), and optional `workoutSessionId`, `extraSessionIds[]`, `weekLogReference` (the parent week container reference).
- **FR-005** Clicking a day can navigate to the corresponding show page (`/user/trackings/show/:id` for week-logs; the day-log show page for day-logs).
- **FR-006** `WeekLogReference` exposes `id`, `startDate`, `endDate`, `completed`, `active`, `notes?`.

### BR

- `BR-003` (`date` fields are `LocalDate`) and `BR-012` (network-only read) apply.

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

Page: `/user/history` → `HistoryComponent` → calendar grid → day-tile → (click) → show.

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

## Files

```
src/app/core/services/training-history/training-history.service.ts  (+ .spec.ts)
src/app/core/apollo/training-history.queries.ts
src/app/shared/interfaces/training-history.interface.ts
src/app/pages/user/history/
```

## Tests

- **TEST-001** `getTrainingCalendar` sends `month+1` to the API (1-based) with the user's timezone.
- **TEST-002** Response maps correctly: days list, type, status, optional `weekLogReference`.

## Acceptance Criteria

- **AC-001** The user can view a month of training and distinguish week-log vs day-log entries.
- **AC-002** Completed, pending, rest and skipped days are visually distinct.
- **AC-003** Clicking a day opens the corresponding detail page.
