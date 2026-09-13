# WaveFit — Domain Business Rules

Stable domain/business rules that apply **across multiple features**.

> Rules that are only relevant to one feature belong in that feature's [Spec](../../sdd/README.md) and must not be duplicated here.

---

## BR-001 — Container exclusivity

Exactly **one** tracking container may be **active** per user at a time: either a week-log (`WEEK_LOG`) or a day-log (`DAY_LOG`). `ActiveTracking` is the single start-up source of truth.

## BR-002 — Template vs Tracking

The **TEMPLATE** branch (`RoutinePlan` → `RoutineDay`) describes planned training. The **TRACKING** branch (week-log / day-log → `WorkoutSession`) records executed training. A tracking container may be created standalone or seeded from a routine day/plan, but never **is** a template.

## BR-003 — LocalDate everywhere

All calendar dates in view models are `LocalDate` strings (`"yyyy-MM-dd"`), never JS `Date`. API ISO dates are converted using the user's timezone by wrappers. Date comparisons are string comparisons.

## BR-004 — Exercise category normalization

The API returns `ExerciseCategory` in **UPPERCASE** (`CHEST`); the domain enum is **lowercase** (`chest`). Normalize with `toLowerCase()` when consuming API data.

## BR-005 — Route protection

Every route except `/auth` is protected by `authGuard`. Unauthenticated access redirects to login.

## BR-006 — `RoutinePlanSend.routineDays` are IDs

When sending a plan to the backend, `routineDays` is an array of **day IDs** (`string[] | null[]`), not day objects. Wrappers map only `id`/`name`/`description`/`weekly_distribution`/`createdBy`.

## BR-007 — Favorites are per-user toggles

Exercises, routines, and routine days can be flagged as favorites. The toggle updates the local cache optimistically and syncs to the API (`setIsFavorite`).

## BR-008 — Extra sessions belong to a WorkoutSession

An `ExtraSession` is associated with a `workoutSessionId` in a week-log (or the day-log's global workout session). Calorie estimation uses the discipline `met` value.

## BR-009 — Day-log is a flat model

The day-log does **not** nest a `days[]` array. It holds a single `workoutSessionId`, `exercises[]`, and `extraSessionIds[]` at the root. Deletion of a workout or extra session happens **from the day-log container**.

## BR-010 — `DistributionDays` is a default, not a lock

The profile's `DistributionDays` (`week_log` / `day_log`) only sets the **initial default** of the logging-mode selector. The user can always switch modes; the presence of an active tracking container takes precedence over the default.

## BR-011 — Completing a container deactivates it

Completing (week-log / day-log) flips `completed=true` and forces `active=false`; local state and storage are cleaned and the user is redirected to the success page.

## BR-012 — Offline-first writes

All writes are optimistic: update local state (IndexedDB + signals) first, then attempt the API. When offline, the operation is queued in `SyncQueueService` and replayed on reconnect. The backend is the eventual source of truth.

## BR-013 — Active element state

Each tracking feature holds its "active element" in a dedicated state service (`WorkoutSession` for the active day, `DayLogVM` for the day-log). Day-level widgets consume the polymorphic `WorkoutStore` contract instead of a concrete week/day service.

## BR-014 — Completed state is idempotent

Persisting exercise edits uses debounced writes so rapid UI changes don't send duplicate API calls.
