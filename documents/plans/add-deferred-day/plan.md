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

- `src/app/pages/user/history/day-deferred/day-deferred.ts` — add context detection in `ngOnInit`, call `EditorContextService.setContext()`, update `containerType` signal
- `src/app/pages/user/history/day-deferred/day-deferred.html` — update header and CTA text to use `containerType()` conditional rendering
- `src/app/shared/components/widgets/tracking/workout-session-editor/orchestrator.component.ts` — fix template signal calls `exercises()`, `workoutSession()!`, `selectedDate()`; bind all `@Output` events of subcomponents (`ExerciseSelector`, `WorkoutEdition`, `ExtraSessionForm`); emit `WorkoutSessionVM` via `saveOutput`
- `src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.ts` — declare outputs (`save`, `close`, `completeDay`); load session data reactively based on `editorContext`; implement `onSave(workout)` resolving circular delegation via DL/WL mutations; implement `onCompleteDay()`
- `src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.html` — restore loading spinner, context header/subtitles, action buttons (Cancelar, Complete Day); pass input signals and bind events to `<app-orchestrator>`
- `src/app/shared/components/widgets/tracking/tracking-workout/workout-edition/workout-edition.html` — remove broken legacy dialog with `app-exercise-selector` to fix template build error
- `src/app/shared/components/widgets/extra-session/extra-session-form/extra-session-form.spec.ts` — fix call to `onSave()`
- `sdd/add-deferred-day/spec.md`: updated SDD documenting the feature specification

## Tasks

### T1 — Context Detection and Editor Context Setup

**Files**: `src/app/pages/user/history/day-deferred/day-deferred.ts`, `day-deferred.html`

Steps:

1. Update `ngOnInit` in `DayDeferred` to detect context from route params:
    - T1.1: If route param `id` is present → set `containerType = 'DEFERRED_DAY_LOG'`, set `containerId = id`
    - T1.2: If route params `weekLogId` + `dayOrder` are present → set `containerType = 'WEEK_LOG_DAY'`, set those values
    - T1.3: If only `date` is present → set `containerType = 'DEFERRED_DAY_LOG'` (empty form)
    - T1.4: Update `this.containerType.set(...)` explicitly so `day-deferred.html` reflects the current context
2. Call `EditorContextService.setContext(ctx)` with the computed context object
3. Verify `editor-context.interface.ts` has all required fields (`containerType`, `containerId?`, `dayOrder?`, `weekLogId?`)
4. Verify `day-deferred.html` binds `<app-workout-session-editor>` outputs `(save)`, `(close)`, and `(completeDay)`.

### T2 — Fix Template Compilation Errors in Dependencies

**Files**: `src/app/shared/components/widgets/tracking/tracking-workout/workout-edition/workout-edition.html`, `src/app/shared/components/widgets/extra-session/extra-session-form/extra-session-form.spec.ts`

Steps:

1. In `workout-edition.html`: remove the leftover `<app-dialog>` containing `<app-exercise-selector>` (lines 132-154) which causes Angular compiler errors TS2339 / NG8002 (methods and selector not part of `WorkoutEdition`). `ExerciseSelector` is managed by `OrchestratorComponent`.
2. In `extra-session-form.spec.ts`: fix `component.save()` → `component.onSave()`.
3. Verify `npx ng build` progresses past dependency errors.

### T3 — Refactor and Connect OrchestratorComponent

**Files**: `src/app/shared/components/widgets/tracking/workout-session-editor/orchestrator.component.ts`

Steps:

1. Fix template signal calls:
    - `[exercises]="exercises()"`
    - `[selectedDate]="selectedDate()"`
    - `[workoutSession]="workoutSession()!"`
2. Connect all `@Output` event bindings:
    - `<app-exercise-selector>`:
        - `(toggleExerciseChange)="onToggleExercise($event)"`
        - `(exercisesSelectedChange)="onExercisesSelectedChange($event)"`
        - `(categoryToggle)="onCategoryToggle($event)"`
        - `(favoritesFilterToggle)="onFavoritesFilterToggle()"`
    - `<app-workout-edition>`:
        - `[exercises]="selectedExercises"`
        - `(saveWorkoutSession)="onWorkoutSave($event)"`
        - `(closeEdition)="onClose()"`
    - `<app-extra-session-form>`:
        - `(saveExtraSession)="onExtraSessionSave()"`
        - `(cancelExtraSession)="onExtraSessionCancel()"`
3. Update `saveOutput` to emit the modified workout: `saveOutput = output<WorkoutSessionVM>()`.
4. In `onWorkoutSave(workout: WorkoutSessionVM)`: emit `this.saveOutput.emit(workout)` to parent `WorkoutSessionEditor`.
5. In `effect()`: sync `selectedExercises` with incoming `exercises()` input.

### T4 — Connect WorkoutSessionEditor Template & Shell

**Files**: `src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.html`

Steps:

1. Restore loading state: `@if (loading()) { <app-loading></app-loading> } @else { ... }`.
2. Restore context-aware header and subtitle:
    - Header title: "Editor de Sesión de Día-Log Diferido" vs "Editor de Día dentro de Semana" based on `editorContext().containerType`.
    - Subtitle text tailored to DL vs WL.
3. Embed `<app-orchestrator>` passing all required and data inputs:
    - `[editorContext]="editorContext()"`
    - `[workoutSession]="workoutSession()"`
    - `[exercises]="exercises()"`
    - `[selectedDate]="selectedDate()"`
    - `(saveOutput)="onSave($event)"`
    - `(closeOutput)="closeDialog()"`
4. Restore action footer:
    - "Cancelar" button calling `closeDialog()`
    - "Complete Day" button calling `onCompleteDay()` with loading status indicator.

### T5 — Implement Reactive Data Loading & Saving in WorkoutSessionEditor

**Files**: `src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.ts`

Steps:

1. Declare component outputs:
    - `save = output<void>()`
    - `close = output<void>()`
    - `completeDay = output<void>()`
2. Add internal state signals:
    - `loading = signal(false)`
    - `workoutSession = signal<WorkoutSessionVM | null>(null)`
    - `exercises = signal<ExercisePerformanceVM[]>([])`
    - `selectedDate = signal<string>('')`
3. Implement session data loading in `effect()` when `editorContext()` changes:
    - If `DEFERRED_DAY_LOG` with `containerId`: load via `planDaySvc.findById(containerId)`, map `DayLogVM` to `WorkoutSessionVM`.
    - If `DEFERRED_DAY_LOG` without `containerId`: initialize empty `WorkoutSessionVM`.
    - If `WEEK_LOG_DAY`: load week via `planTrackingSvc.findById(weekLogId)`, resolve day by `dayOrder`.
4. Resolve circular delegation on `onSave(updatedWorkout: WorkoutSessionVM)`:
    - DL (`DEFERRED_DAY_LOG`): call `this.planDaySvc.updateWorkoutSession(updatedWorkout)` (mutation only, no active tracking state modification per BR-019/BR-020).
    - WL (`WEEK_LOG_DAY`): call `this.facade.updateWorkoutSession(updatedWorkout)` (local store update only, BR-020).
    - Emit `this.save.emit()`.
5. Implement `onCompleteDay()`:
    - DL: call `this.ctxSvc.completeDeferredDayLog()`, emit `this.completeDay.emit()`.
    - WL: log pending backend dependency (AC-014), emit `this.completeDay.emit()`.
6. Implement `closeDialog()`:
    - Set `isDialogOpen.set(false)`, emit `this.close.emit()`.

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
