# Plan: Add Deferred Day — Edit Day from Day-Log or Week-Log

## Context

This plan organizes the implementation of extending the deferred day-log editing capability to support editing a workout session (WS) from both:
- **Day-Log (DL)**: A standalone day-log container
- **Week-Log (WL)**: A day within a week-log container

The route `http://localhost:4200/user/history/deferred?date=2026-10-08&id=6adfd36e55dca9e5b80a2547` should work for editing a day from either context.

This feature does NOT use the active-tracking architecture with state/storage (unlike `my-week`/`my-day` which use `BehaviorSubject`-based state). In `day-deferred`, we edit the WS directly via API mutations without modifying container state or local storage. Mutations respect the service-domain-api architecture.

## Target behaviour

1. **Context Detection** (`day-deferred.ts`):
   - If route param `id` is present → `DEFERRED_DAY_LOG` context → load day-log by ID
   - If route params `weekLogId` + `dayOrder` are present → `WEEK_LOG_DAY` context → load week and resolve day's WS
   - If only `date` is present → empty form for new deferred day

2. **Editor Context** (`editor-context.service.ts`):
   - Holds `containerType`, `containerId`, `dayOrder`, `weekLogId`
   - Used by `WorkoutSessionEditor` to determine API path

3. **API Mutations**:
   - **DL**: `PlanDayService.updateDayLog(id, input)` → returns updated DayLogVM; no state/storage writes
   - **WL**: `PlanTrackingService.findById(weekLogId)` → resolve week → `store.updateWorkoutSession(date, workout)` — local-only, no parent week-log mutation (TODO for backend)

4. **Actions**:
   - `onSave`: Save workout session using appropriate API for context
   - `onCompleteDay`:
     - DL → `EditorContextService.completeDeferredDayLog()` (flips `completed: true, active: false`)
     - WL → TODO (pending backend dependency, AC-014)

## Decisions

- **D1 — No active-tracking state.** Unlike `my-week`/`my-day`, this feature never calls `setDayLog`, `setDayLogStorage`, or `markDayActive`. The day-log or week-log container is never the "active" container; edits are purely mutation-driven.
- **D2 — Context via route params.** The editing context (DL vs WL) is determined entirely by the route query/params: `id` → DL; `weekLogId`+`dayOrder` → WL. No URL state management library needed beyond `ActivatedRoute`.
- **D3 — Mutations, not state.** All changes go through GraphQL mutations (`updateDayLog` for DL, facade calls for WL) and return new VMs. No BehaviorSubject stores are updated. This keeps the component standalone and reusable.
- **D4 — DL takes precedence.** If both `id` and `weekLogId`/`dayOrder` are somehow present, `id` takes precedence for DL context. Documented as a constraint to avoid ambiguity.

## Changes

- `src/app/pages/user/history/day-deferred/day-deferred.ts` — add context detection in `ngOnInit`, call `EditorContextService.setContext()`
- `src/app/pages/user/history/day-deferred/day-deferred.html` — update header and CTA text to use `containerType()` conditional rendering
- `src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.ts` — branch `onSave()` and `onCompleteDay()` on `editorContext().containerType`
- `src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.html` — update labeling to show context-appropriate text
- `sdd/add-deferred-day/spec.md`: new SDD documenting the feature specification

## Tasks

### T1 — Context Detection and Editor Context Setup

**Files**: `src/app/pages/user/history/day-deferred/day-deferred.ts`

Steps:

1. Update `ngOnInit` in `DayDeferred` to detect context from route params:
   - T1.1: If route param `id` is present → set `containerType = 'DEFERRED_DAY_LOG'`, set `containerId = id`
   - T1.2: If route params `weekLogId` + `dayOrder` are present → set `containerType = 'WEEK_LOG_DAY'`, set those values
   - T1.3: If only `date` is present → set `containerType = 'DEFERRED_DAY_LOG'` (empty form)
2. Call `EditorContextService.setContext(ctx)` with the computed context object
3. Verify `editor-context.interface.ts` has all required fields (`containerType`, `containerId?`, `dayOrder?`, `weekLogId?`)
4. Update `day-deferred.html` to display header text based on `containerType()`:
   - T1.4a: `<h1>` text: "Día diferido" vs "Día de semana"
   - T1.4b: Subtitle/description text conditional based on container type

### T2 — API Mutation for DL (onSave)

**Files**: `src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.ts`

Steps:

1. In `onSave()`, read `editorContext().containerType`
2. If `DEFERRED_DAY_LOG`:
   - T2.2a: Get current workout session from store: `this.facade.workoutVM()`
   - T2.2b: Build `UpdateDayLogInput` with updated exercises, status, notes from form
   - T2.2c: Call `PlanDayService.updateDayLog(containerId, input)` — subscribe, handle success (notify, reload calendar), error (error notification)
   - T2.2d: Map response with `wrapperUpdateDayLogApiToVM`, keep date as `yyyy-MM-dd`
3. If `WEEK_LOG_DAY`:
   - T2.3a: Call `this.facade.updateWorkoutSession(updatedWorkout)` — local store update only
   - T2.3b: Add comment BR-020: "local-only, no parent week-log mutation"
   - T2.3c: TODO comment for when backend supports partial WL day updates (AC-014)

### T3 — API Mutation for WL (onSave)

**Files**: `src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.ts`

Steps:

1. Same `onSave()` function, branch on `containerType`
2. For `WEEK_LOG_DAY`: the existing `this.facade.updateWorkoutSession(updatedWorkout)` call already handles local store update
3. Add BR-020 documentation reference in the onSave method comment block, noting this is local-only per the business rules

### T4 — onCompleteDay for Both Contexts

**Files**: `workout-session-editor.ts`, `editor-context.service.ts`

Steps:

1. In `WorkoutSessionEditor.onCompleteDay()`:
   - T4.1a: If `DEFERRED_DAY_LOG`: call `this.ctxSvc.completeDeferredDayLog()` (already implemented in the service — flips `completed: true, active: false`)
   - T4.1b: If `WEEK_LOG_DAY`: add TODO log message, no backend operation yet (AC-014)
2. Verify `EditorContextService.completeDeferredDayLog()` handles correctly:
   - T4.2a: Check it flips `completed: true, active: false` and clears state/storage as documented
   - T4.2b: No changes needed if service already complete (verify from day-log spec implementation)

### T5 — Header and CTA Text Updates

**Files**: `src/app/pages/user/history/day-deferred/day-deferred.html`

Steps:

1. Update header `<h1>` to use `containerType()` for display:
   - T5.1a: "Día diferido" when `containerType() === 'DEFERRED_DAY_LOG'`
   - T5.1b: "Día de semana" when `containerType() === 'WEEK_LOG_DAY'`
2. Update subtitle/p element text:
   - T5.2a: DL → "Edita la sesión de entrenamiento y los datos asociados de un day-log diferido existente."
   - T5.2b: WL → "Edita la sesión de un día dentro de un week-log, preservando el parent week-log."
3. Ensure Complete Day button text/emission is appropriate for both contexts

### T6 — Not Implemented Dependencies Documentation

**Files**: Create tracking and documentation notes

Steps:

1. Document that `ExerciseSelector` and `ExtraSessionForm` are pending implementation
   - T6.1: Create a tracking issue or note in the repo README
   - T6.2: Reference that their specs/plans will be created separately
2. Add TODO comments in `workout-session-editor.html` where these components are used
   - T6.3: Indicate they're placeholders for now, form renders with "Sin ejercicios" placeholder
3. Create high-level dependency map
   - T6.4: Show which components depend on which, prioritize for future specs/plans

### T7 — Validation Gates

Steps:

1. `npm run typecheck` — ensure type safety for new context handling and branching logic
2. `npm run lint` — ensure code style consistency across the modified files
3. `npm run test:ci` — run existing tests, add new spec tests for:
   - T7.3a: Context detection in DayDeferred (all 3 param scenarios)
   - T7.3b: onSave branching for DL vs WL
   - T7.3c: onCompleteDay behavior per context
   - T7.3d: No state/storage modifications
   - Ensure existing tests still pass (764/764 from calendar-deferred-day validation)
4. `npm run build` — verify bundle budget (pre-existing warning acceptable if only new warnings related to this feature are added)
5. Manual acceptance criteria verification:
   - T7.5.1: DL route `/user/history/deferred?date=...&id=...` loads day-log form
   - T7.5.2: WL route `/user/history/week-log-day/:weekId/:dayOrder` loads week-log day editing
   - T7.5.3: `onSave` works for both DL and WL contexts using appropriate API mutation
   - T7.5.4: `onCompleteDay` flips status appropriately: DL → completed/active: false; WL → TODO
   - T7.5.5: No active-tracking state modifications when editing a deferred day
   - T7.5.6: Quality gates pass

## Validation gates

- `npx prettier --write` on all changed files.
- `npm run typecheck`
- `npm run lint`
- `npm run test:ci`
- `npm run build` (the 857 kB bundle-budget warning is pre-existing)
- Manual check: deferred page with `?date&id` loads day-log → onSave → toast → calendar refresh → empty preview with "Editar día" → `onCompleteDay` → state unchanged

## Acceptance criteria

- [ ] The deferred page `/user/history/deferred?date=...&id=...` loads a day-log and renders the read-only demo form with date, status, completed, notes, exercises, extra sessions.
- [ ] The same route with only `date` renders an empty demo form ("Sin ejercicios").
- [ ] The route `/user/history/week-log-day/:weekId/:dayOrder` loads the week-log day and allows WS editing via the same `WorkoutSessionEditor`.
- [ ] The header and CTA text switch between "Día diferido" / "Editor de Sesión de Día-Log Diferido" and "Día de semana" / "Editor de Día dentro de Semana" based on context.
- [ ] The `onSave` action works for both DL and WL contexts, using the appropriate API mutation (DL: `updateDayLog`; WL: local store update, TODO for backend).
- [ ] The `onCompleteDay` action flips the day status appropriately: DL → `completed: true, active: false`; WL → pending (TODO for backend).
- [ ] No active-tracking state (`setDayLog`, `markDayActive`, etc.) is modified when editing a deferred day.
- [ ] The exercise-selector and extra-session form are referenced as dependencies; their implementation is tracked in a separate spec/plan.
- [ ] All quality gates pass: `npm run typecheck`, `npm run lint`, `npm run test:ci`, `npm run build`.