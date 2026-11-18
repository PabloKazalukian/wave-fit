# Add Deferred Day

## Context

This feature extends the deferred day-log editing capability to support editing a workout session (WS) from both:

- **Day-Log (DL)**: a standalone day-log container, reached by `/user/history/deferred?date=<LocalDate>&id=<dayLogId>` or `/user/deferred-day-log/:id`
- **Week-Log (WL)**: a day within a week-log container, reached by `/user/week-log-day/:weekId/:dayOrder?date=<LocalDate>`

The route `http://localhost:4200/user/history/deferred?date=2026-10-08&id=6adfd36e55dca9e5b80a2547` opens the DL editor. Context detection reads `id` and `weekId` (alias `weekLogId`) from path params with query-param fallback (FR-018).

The parent component `DayDeferred` (in `day-deferred.ts`) must execute the changes for the DL or WL day. The `WorkoutSessionEditor` (in `workout-session-editor.ts`) must edit the WS within either context, using reusable components (`extra-session` and `exercise-selector`).

**Important architectural decision**: This feature does NOT use the active-tracking architecture with state/storage (like `my-week`/`my-day` do). Those components use a `BehaviorSubject`-based state that persists data for managing active week/day sessions. In `day-deferred`, we edit the WS directly via API mutations without modifying container state or local storage. The mutations respect the service-domain-api architecture.

## Requirements

### FR: Functionality

- **FR-014** The deferred page `/user/history/deferred?date=<LocalDate>&id=<dayLogId>` loads a day-log by `id` and renders `WorkoutSessionEditor` to edit its workout session and extra sessions. It also works with only `date` (no `id`), rendering an empty editor.
- **FR-015** The same page handles a week-log day at `/user/week-log-day/:weekId/:dayOrder`. It detects the context from route/query params and switches between DL and WL editing mode.
- **FR-016** The `WorkoutSessionEditor` can edit a workout session within a deferred day-log or within a week-log day, using the same reusable components (`ExerciseSelector`, `ExtraSessionForm`, `ExtraSessionCard`, `WorkoutEdition`). The components are shared with the active flow; they do not own container-specific writes.
- **FR-017** The `onCompleteDay` action in `DayDeferred` flips the day status appropriately: `completed: true, active: false` for DL; pending status for WL (with TODO for backend completion).
- **FR-018** The editor context (`EditorContext`) is computed from route params with query-param fallback: `id` (path param on `/user/deferred-day-log/:id`, or query param) → `DEFERRED_DAY_LOG`; `weekId` / `weekLogId` plus `dayOrder` → `WEEK_LOG_DAY`. Otherwise it defaults to `DEFERRED_DAY_LOG` with an empty editor.
- **FR-019** Extra-session writes from the deferred page target the edited container explicitly: DL uses the loaded day-log / workout-session id and WL uses the route `weekId`. `ExtraSessionForm` only validates and emits `saveExtraSession`; the owning page performs the mutation. No deferred write infers its target from `ActiveTracking`, and no active-day write is performed.
- **FR-020** Save failures on the deferred page are surfaced to the user; a mutation is never silently ignored.

### BR: Business Rules

- **BR-019** No active-tracking state is modified when editing a deferred day. The day-log or week-log container state is not persisted or changed.
- **BR-020** Mutations are selected by container, not by the active tracking mode: DL uses the day-log API (`PlanDayApi.updateDayLog` with `{ id, workoutSession }` for WS edits and `{ id, extraSession }` for extra-session creates; `extraSessionId` for extra-session deletion), WL uses the week-log API (`WorkoutApi.updateWorkoutSession(workout, weekLogId)` for WS edits and the deferred plan-tracking methods for extra sessions). DL never calls `UpdateWorkoutSession`.
- **BR-021** The `date` query param is always a `LocalDate` in `yyyy-MM-dd` format. The `id` param, when present, is a day-log ID. The `weekLogId` and `dayOrder` are derived from the route params for WL context.
- **BR-022** The wrapper for API responses keeps `date` as `yyyy-MM-dd` (no timezone conversion), since the backend already sends LocalDate for deferred days.

### NFR: Non-Functional

- **NFR-003** No `setDayLog`, `setDayLogStorage`, `markDayActive`, or similar state/storage writes are performed. The feature is purely mutation-driven via the API.
- **NFR-004** API wrappers (`wrapperUpdateDayLogApiToVM`, `wrapperDayLogDeferredApiToVM`) are reused as documented in the day-log spec.
- **NFR-005** The `DayDeferred` page and `WorkoutSessionEditor` components are standalone (no framework state beyond signals) so they can be used in both DL and WL contexts without side effects.

## Constraints

- The day-log deferred creation path must not write container state, local storage or active tracking (already established in day-log spec FR-013).
- The WL day editing path must use `PlanTrackingService.findById` to load the week and resolve the day's workout session.
- The reusable editor components already exist and are shared by the active and deferred flows; the deferred page must not introduce active-state dependencies into them.
- The `DayDeferred` must work with only `date` (empty editor), `date` + `id` (DL), `/user/deferred-day-log/:id` (DL path param), or `weekId` / `weekLogId` + `dayOrder` (WL).

## Architecture

```
DayDeferred (page)
├── Activates route: reads date, id, weekId/weekLogId, dayOrder from query/route params
│   ├── If id exists → context = DEFERRED_DAY_LOG → setEditorContext(DEFERRED_DAY_LOG, id)
│   ├── If weekId/weekLogId + dayOrder exist → context = WEEK_LOG_DAY → setEditorContext(WEEK_LOG_DAY, weekLogId, dayOrder)
│   └── Otherwise → context = DEFERRED_DAY_LOG (empty editor)
├── EditorContextService (holds containerType, containerId, dayOrder?, weekLogId)
│   └── Used by WorkoutSessionEditor to determine which API to call
└── WorkoutSessionEditor (composite component)
    └── OrchestratorComponent (orchestrates reusable widgets via @Input/@Output)
        ├── ExerciseSelector (reusable, exercise selection)
        ├── WorkoutEdition (reusable, handles WS sets/reps edition)
        └── ExtraSessionForm (reusable, extra session creation)
            └── Emits saveExtraSession / cancelExtraSession events

Mutations:
- DL WS: PlanDayService.updateWorkoutSession(workout, { updateActiveState: false })
  → PlanDayDomainService → PlanDayApi.updateDayLog({ id, workoutSession })
  - Persists the full WS (id, exercises, status); no state/storage writes
- DL extra sessions: PlanDayService.{updateExtraSessionDeferred,removeExtraSessionDeferred}
  → PlanDayApi with the explicit day-log id for creates (`UpdateDayLogInput.id`) and the
  extra-session id for deferred deletions (`RemoveExtraSessionFromDeferredDayLog($extraSessionId)`)
- WL: PlanTrackingService.findById → resolves week → day workout session
  - onSave: WorkoutApi.updateWorkoutSession(workout, weekLogId) with the id from the route context (no store/active-state write)
  - Extra sessions: PlanTrackingService.{updateExtraSessionDeferred,removeExtraSessionDeferred} with the route week-log id
  - onCompleteDay: TODO for backend completion of WL day
```

## Files

```
sdd/add-deferred-day/spec.md: this document (properties, constraints, architecture)
documents/plans/add-deferred-day/plan.md: implementation plan (tasks, validation)

Modified (existing):
- src/app/pages/user/history/day-deferred/day-deferred.ts — context detection, setEditorContext, containerType signal update
- src/app/pages/user/history/day-deferred/day-deferred.html — header/CTA based on containerType
- src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.ts — data loading, onSave/onCompleteDay branching, output events
- src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.html — context labeling, header, loading indicator, orchestrator host
- src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.html — coordination of ExerciseSelector, WorkoutEdition, ExtraSessionForm and ExtraSessionCard with signals & event bindings
- src/app/shared/components/widgets/tracking/tracking-workout/workout-edition/workout-edition.html — cleanup legacy selector dialog
- src/app/core/services/editor-context/editor-context.interface.ts — already has required fields, no change needed
- src/app/core/services/editor-context/editor-context.service.ts — already has loadDeferredDayLogSession and loadWeekLogDaySession, no change needed
- src/app/shared/components/widgets/tracking/tracking-workout/tracking-workout.facade.ts — already has updateWorkoutSession, no change needed
```

## Tests

- **TEST-001** Context detection in `DayDeferred.ngOnInit` for `id` query param, `/user/deferred-day-log/:id`, `weekId` / `weekLogId` + `dayOrder`, and date-only (FR-015, FR-018).
- **TEST-002** `onSave` branching: DL calls `updateDayLog({ id, workoutSession })` and WL calls `WorkoutApi.updateWorkoutSession(workout, weekLogId)` (FR-014, BR-020).
- **TEST-003** Deferred extra-session writes use the explicit container id and never create the extra-session on the active day (FR-019).
- **TEST-004** `onCompleteDay` correct behavior per `containerType` (FR-017).
- **TEST-005** No active-tracking state, active day-log state or local storage write occurs when editing a deferred day (BR-019, NFR-003).
- **TEST-006** Header text switches between DL and WL contexts.
- **TEST-007** A failed save is surfaced in the editor (FR-020).

## Acceptance Criteria

- [ ] The deferred page `/user/history/deferred?date=...&id=...` loads a day-log and renders `WorkoutSessionEditor` with its exercises and extra sessions.
- [ ] The same route with only `date` renders an empty editor ("Sin ejercicios").
- [ ] The route `/user/week-log-day/:weekId/:dayOrder` loads the week-log day and allows WS editing via the same `WorkoutSessionEditor`.
- [ ] The header text switches between "Día diferido" (DL) and "Día de semana" (WL) based on context.
- [ ] The `onSave` action works for both DL and WL contexts, using the appropriate API mutation (DL: `updateDayLog`; WL: `updateWorkoutSession` with the route `weekLogId`).
- [ ] The `onCompleteDay` action flips the day status appropriately: DL → `completed: true, active: false`; WL → pending (TODO for backend).
- [ ] No active-tracking state, active day-log state or local storage is modified when editing a deferred day.
- [ ] Adding an extra-session in a deferred day creates it only in that deferred container; the active day remains unchanged.
- [x] Deleting an extra-session from a deferred day sends `extraSessionId` through `RemoveExtraSessionFromDeferredDayLog` and does not write to the active container.
- [ ] Save failures are visible in the editor.
- [ ] All quality gates pass: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:ci`, `npm run build`.
