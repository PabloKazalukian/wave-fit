# Plan: Training-history day preview

## Context

The `/user/history` page (spec `sdd/training-history/spec.md`) renders a monthly
calendar with a tile per day. Tiles were static: clicking a `WEEK_LOG` or
`DAY_LOG` day gave no feedback and offered no path into the detail pages
(`/user/trackings/:id` or `/user/tracking/day/:id`).

## Decision

Clicking an informative tile shows, directly below the calendar, a preview
panel listing that day's exercises, with a button on top that navigates to the
detail page by id. The exercises come from already-existing lookups, so no new
endpoint is required beyond one backend contract addition.

- Clicked day semantics: for `WEEK_LOG` tiles the preview shows the exercises of
  the **clicked** day, resolved via `tracking.workouts.find(w => w.date === tile.date)` —
  not the first day of the week.
- `DAY_LOG` tiles use the day-log's own workout.
- `REST` days and days without exercises never open a preview (re-click closes /
  does not open). Padding `NONE` tiles always close the preview.
- The CTA button (`app-btn` with a string `routerLink`) navigates to
  `/user/trackings/:id` (week) or `/user/tracking/day/:id` (day).
- Exercise names are populated by joining against
  `ExercisesService.getExercises()`.

### Component structure (Phase 2 follow-up)

Following `documents/engineering/coding-standards.md` §7.1 (page composition),
`history.ts` initially grew to ~370 lines and duplicated the exercise-list
markup (3rd copy). The page is split into a thin orchestrator plus two feature
widgets (see `sdd/training-history/spec.md` Architecture):

- `TrainingHistoryCalendar` (`app-training-history-calendar`) — month nav,
  grid, day tiles, legend, calendar loading/error. Inputs `days`, `year`,
  `month`, `selectedDate`, `loading`, `error`; outputs `daySelected`,
  `previousMonth`, `nextMonth`, `reload`.
- `TrainingHistoryDayPreview` (`app-training-history-day-preview`) — detail
  panel with CTA and exercise list. Inputs `preview`, `loading`, `error`;
  output `retry`.
- The page keeps data loading, month/year signals and the preview state machine,
  and drops its `calendarEffect` (a leak, see spec Known issues) in favor of
  ngOnInit + nav outputs.

### Backend contract (required)

The training-holiday payload must expose the day-log id next to each days tile:

```
trainingCalendar.days[].dayLogId  // string | null
```

The frontend query selects `dayLogId`; without the backend returning it the
`GET_TRAINING_CALENDAR` field selection fails. Deployment must be coordinated
with `wave-fit-api`.

## Changes

### Phase 1 (preview behind one-page component — done)

- `core/apollo/training-history.queries.ts`: select `dayLogId` inside `days`.
- `shared/interfaces/training-history.interface.ts`: `CalendarDay` += `dayLogId?: string`.
- `pages/user/history/history.ts`:
    - `DayPreview` state machine (loading / error / ready, closed by default).
    - `onDayClick`: `DAY_LOG`/`WEEK_LOG` with exercises → load preview; same tile
      re-click toggles closed; `REST`/empty/`NONE` → close.
    - `loadWeekPreview` (`PlanTrackingService.findById`) / `loadDayPreview`
      (`PlanDayService.findById`) chained with `ExercisesService.getExercises()`
      via `switchMap`.
    - `failPreview` / `retryPreview`, `previewRouterLink`, `previewCtaLabel`.
- `pages/user/history/history.html`: tiles become focusable (`role`, `tabindex`,
  `data-date`) and render the preview panel with CTA, loading and error+retry
  states.
- Tests: `pages/user/history/history.spec.ts` (new), `training-history.service.spec.ts`
  (sample data now carries `dayLogId`).
- Docs: component-granularity rule added to `coding-standards.md` §7.1 + thin-page
  note in `architecture.md`; spec Architecture/Files/DayPreview/Tests updated.

### Phase 2 (extract widgets — done)

- `shared/interfaces/training-history.interface.ts`: move `DayPreview` here from
  `history.ts`.

### Phase 3 (active week: badge + "Ver mi semana" CTA — in progress)

Objective: let the user know a week is the active one and jump to it from the
preview. Backend already exposes `active` on `WeekLogReference`; the frontend
carries it through to the views.

- Contract — carry `active: boolean` on `TrackingAPI` / `TrackingVM` /
  `TrackingVMS` via `tracking-api.interface.ts` + `tracking.interface.ts` +
  `tracking.wrapper.ts` + `tracking.queries.ts` (`WEEK_LOG_FIELDS`). Backend
  must expose it (deploy coordinated with `wave-fit-api`).
- `shared/interfaces/training-history.interface.ts`: `DayPreview` +=
  `active?: boolean` (parent week `active` for `WEEK_LOG` previews, absent
  otherwise).
- `pages/user/history/history.ts`: `loadWeekPreview` sets
  `active: this.selectedDay()?.weekLogReference?.active ?? false`.
- `widgets/training-history/day-detail-preview/`: for `WEEK_LOG` previews with
  `preview.active`, render an extra raised primary CTA "Ver mi semana" (on the
  left) next to "Ver semana"; both navigate to `/user/trackings/:id`. Non-active
  weeks and `DAY_LOG` previews keep only "Ver semana".
- `pages/user/trackings/show/show.{ts,html}`: new status badge — "Activa"
  (secondaryLight, `data-test="week-status-badge"`) when `tracking.active`, else
  "Completada" (success) / "Incompleto" (warning). (FR-009 / FR-010)
- Builders updated with `active`: `tracking.wrapper.spec.ts`, `history.spec.ts`
  (`weekTracking`, `weekLogDay`), `workout.state.spec.ts`,
  `plan-tracking.service.spec.ts`, `plan-tracking.domain.spec.ts`.
- New tests: `show.spec.ts` badge matrix, `day-detail-preview.spec.ts`
  (CTA shown/hidden by `active`), `history.spec.ts` ("Ver mi semana" shown for
  active week only).

`npm run typecheck`, `npm run lint`, `npm run test:ci` (currently 390 pass,
include the badge + CTA specs), `npx prettier --write` only on touched files.
Formatting of the wider repo is a preexisting, unrelated baseline.
