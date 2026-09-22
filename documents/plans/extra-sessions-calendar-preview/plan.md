# Plan: Extra sessions in the training-history calendar preview

## Context

The `/user/history` page (spec `sdd/training-history/spec.md`) renders a
monthly calendar plus a day preview panel. The calendar query already selected
`extraSessionIds`, but the UI never read them; extra sessions were invisible in
the history. The backend now exposes full `extraSessions` objects per calendar
day (both `WEEK_LOG` and `DAY_LOG`), so the preview can list them read-only at
the end of the workout-session exercise list.

## Decision

- Extend `GET_TRAINING_CALENDAR` to select full `extraSessions` per day
  (`id`, `category`, `discipline`, `date`, `duration`, `intensityLevel`,
  `calories`, `notes`). `category` is the uppercase enum, `discipline` lowercase
  — same behavior as `extraSessionCatalog`; keep as-is.
- `CalendarDay` += `extraSessions?: ExtraSession[]`; `DayPreview` +=
  `extraSessions: ExtraSession[]` (always present, `[]` when none).
- `ExtraSession.userId` becomes optional: the backend already omits it on
  `extraSessionsByIds`, `updateExtraSession` and the new calendar payload, so
  the required field was inaccurate.
- New read-only widget `extra-session-show` (sibling of `extra-session-card`):
  inputs `session` + `disciplines` (catalog), renders category badge, discipline
  label via catalog, duration, intensity, calories, notes. No edit/delete.
- `TrainingHistoryDayPreview` renders `p.extraSessions` after the exercise list
  via `<app-extra-session-show>`, and hides the header CTA when `preview.id` is
  empty (extras-only day-log without a `dayLogId`).
- The page (`history.ts`) loads the catalog once (`ExtraSessionService.loadCatalog`
    - `catalog$` to signal) and passes it down as `disciplines` (widgets stay dumb).
- Preview open rule: a day opens the preview when it has exercises **or** extra
  sessions. A `REST` week-log day with extras opens (extras only); rest/empty
  days without extras keep closing.
- `TrainingHistoryCalendar.isClickable`: `WEEK_LOG` is clickable when
  `status !== REST` **or** `extraSessions?.length` (and has a `weekLogReference.id`);
  `DAY_LOG` is clickable when `dayLogId` or `extraSessions?.length`.

## Changes

### Spec (done)

- `sdd/training-history/spec.md`: FR-004/FR-005/FR-007/FR-008 updated, new
  FR-011 (read-only extras, catalog labels, CTA hidden on empty id), data
  contract (`CalendarDay`, `DayPreview`), architecture (page owns catalog,
  preview receives `disciplines`), implementation notes (known-issue resolved),
  TEST-008/009/010, AC-004.
- `sdd/extra-session/spec.md`: `extra-session-show` added to widgets/files; note
  about uppercase `category` in the calendar payload.

### Code

- `core/apollo/training-history.queries.ts`: select `extraSessions { ... }` inside
  `days`.
- `shared/interfaces/extra-session.interface.ts`: `userId?: string`.
- `shared/interfaces/training-history.interface.ts`: `CalendarDay` +=
  `extraSessions?: ExtraSession[]`; `DayPreview` += `extraSessions: ExtraSession[]`.
- `shared/components/widgets/extra-session/extra-session-show/*`: implement the
  read-only show widget (placeholder currently untracked).
- `shared/components/widgets/training-history/day-detail-preview/*`: new input
  `disciplines`; render extras after exercises; CTA hidden when `preview.id` empty.
- `pages/user/history/history.ts`: inject `ExtraSessionService`, `catalog` via
  `toSignal(service.catalog$)`, `loadCatalog()` on init; populate
  `DayPreview.extraSessions` from the clicked `CalendarDay`; adjust week/day
  preview guards for "exercises OR extras"; direct extras-only day-log preview
  (id `''`). `history.html`: pass `[disciplines]="catalog()"`.
- `shared/components/widgets/training-history/calendar/calendar.ts`: `isClickable`
  honors `extraSessions` (REST days with extras become clickable).

### Tests (tests first)

- `extra-session-show.spec.ts`: renders catalog label + metrics + notes; no
  "Modificar"/"Eliminar" controls.
- `day-detail-preview.spec.ts`: `extraSessions` render after exercises; none
  renders nothing; empty `id` hides the CTA.
- `history.spec.ts`: extras-only day opens preview (week + day); exercises +
  extras render both; REST + extras opens; extras-only day-log without
  `dayLogId` shows a CTA-less preview.
- `calendar.spec.ts`: `REST` + extras tile is `role=button`.
- `training-history.service.spec.ts`: sample data carries `extraSessions`;
  passthrough asserted.

## Validation

`npm run lint`, `npm test`, `npm run build`, `npx prettier --check` on touched
files only.

## Backend dependency

`trainingCalendar.days[].extraSessions` must exist in `wave-fit-api` or the
`GET_TRAINING_CALENDAR` field selection fails (same as `dayLogId`). Deploy
fields in tandem.

## Status

Done — implemented and validated (`npm run lint`, `npm test` 407 pass,
`npm run build`, prettier on touched files).

## Test fix note

Two failing tests in `day-detail-preview.spec.ts` were fixed during validation:

- the empty-id CTA test now sets the `disciplines` catalog input (label was
  falling back to the raw `discipline`);
- the "Ver mi semana" test asserted `ctas[1].href === '/user/trackings/week-1'`,
  which was wrong for the `app-btn` DOM (order is "Ver semana", then
  "Ver mi semana" with href `/my-week`). It now identifies each CTA by text.
