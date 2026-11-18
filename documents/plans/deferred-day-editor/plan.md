# Plan: Deferred Day Editor — Decoupled Component Architecture

## Context

`/user/history/deferred` evolved beyond its `FR-013` read-only demo scope: it
now needs to **edit** a workout session from either a `DAY_LOG` or a
`WEEK_LOG_DAY`. The current implementation has an **infinite loop bug** in
`WorkoutSessionEditor` and mixes concerns across layers that prevent the page
from loading at all.

This plan supersedes the deferred-page section of `calendar-deferred-day/plan.md`
(which scoped the page as read-only) and aligns with the user's clarification:

- The deferred page is a **full editor** for a past day's workout session.
- The same sub-components (`ExerciseSelector`, `WorkoutEdition`,
  `ExtraSessionForm`) are shared between the active flow and the deferred flow.
- Those components must be **decoupled** (pure I/O, no store coupling, no side
  effects) so they can be reused by either context.
- The correct backend mutation depends on the container type (`DAY_LOG` →
  `PlanDayDomainService.updateWorkoutSession`, `WEEK_LOG_DAY` →
  `WorkoutApi.updateWorkoutSession`).
- Navigating away from the deferred page must leave **no residual state** in
  `EditorContextService`, the `WORKOUT_STORE`, or any singleton service.

## Root-cause analysis of the infinite loop

```
DayDeferred.editorContext (computed) ─► WorkoutSessionEditor.editorContext (input)
   ↓ effect triggered
   WorkoutSessionEditor.effect → ctxSvc.setContext(ctx) + loadSession(ctx)
                                   ↓ API call → workoutSession.set(ws)
                                                 ↓ OrchestratorComponent input changes
                                                     ↓ Orchestrator.effect → selectedExercises.set(...)
```

The `WorkoutSessionEditor` effect unconditionally calls `ctxSvc.setContext(ctx)`
and `loadSession(ctx)` **every time the input signal is read**. Because
`editorContext` is a `computed()` in the parent and signals written inside the
effect (`workoutSession`, `exercises`) feed back into the template, Angular's
signal graph re-evaluates the effect repeatedly.

Additional issues:

1. `EditorContextService` is `providedIn: 'root'` and accumulates dirty state
   between navigations.
2. `OrchestratorComponent.effect` writes three signals (`workoutSessionInternal`,
   `exercisesInternal`, `selectedExercises`) on every input change — each write
   can trigger a re-render that re-reads inputs, creating a secondary loop.
3. `TrackingWorkoutFacade` — used in the orchestrator for WL saves — injects the
   global `WORKOUT_STORE`, which ties deferred editing to the active week state.
4. `PlanDayService.updateExtraSession` (called in the orchestrator for DL extra
   sessions) calls `this._persist(res)`, which writes to the **active** day-log
   state and storage. This is incorrect for a past deferred day.

## Decisions

- **D1 — Fix the effect loop first.** Replace the `effect()` in
  `WorkoutSessionEditor` with an `input.required` + `ngOnInit` + `ngOnDestroy`
  pattern. Load data once per input identity, not on every signal read.
- **D2 — `DayDeferred` owns data loading.** The page fetches the `WorkoutSessionVM`
  and `ExercisePerformanceVM[]` from the API (`PlanDayService.findById` or
  `PlanTrackingService.findById`) and passes them **down as inputs** to
  `WorkoutSessionEditor`. The editor is a dumb coordinator.
- **D3 — `WorkoutSessionEditor` becomes a dumb coordinator.** It receives
  `workoutSession`, `exercises`, `selectedDate`, and `editorContext` as
  `input.required`. It owns local editing state only. Saving triggers an output
  event upward, not a direct service call.
- **D4 — `OrchestratorComponent` is absorbed into `WorkoutSessionEditor`.** The
  two-level hierarchy (`WSE → Orchestrator`) adds no value and caused the second
  loop. `WorkoutSessionEditor` will host the exercise selector dialog,
  `WorkoutEdition`, and the extra-session dialog directly.
- **D5 — Save routing in `DayDeferred`.** The page listens to `save` output from
  `WorkoutSessionEditor` and calls the correct mutation:
    - `DEFERRED_DAY_LOG` → `PlanDayDomainService.updateWorkoutSession(workout)` (direct API, no state write).
    - `WEEK_LOG_DAY` → `WorkoutApi.updateWorkoutSession(workout)` (direct API, no store update).
- **D6 — Extra-sessions deferred path.** For `DEFERRED_DAY_LOG`, extra sessions
  must call a **separate** `PlanDayDomainService.updateExtraSession(extraSession)`
  that bypasses `PlanDayService._persist`. For `WEEK_LOG_DAY`, they call
  `PlanTrackingService.updateExtraSession(date, extraSession)`.
  `WorkoutSessionEditor` emits an `extraSessionSave` output; `DayDeferred`
  routes to the correct service.
- **D7 — `EditorContextService` state is cleared on destroy.** `DayDeferred`
  calls `ctxSvc.clearContext()` in `ngOnDestroy`. A new `clearContext()` method
  resets the internal context to `{}`.
- **D8 — No `WORKOUT_STORE` in deferred path.** `WorkoutSessionEditor` and
  `DayDeferred` do not inject `WORKOUT_STORE`; they depend only on domain-level
  services.
- **D9 — Spec updated.** `sdd/training-history/spec.md` FR-013 is promoted to
  full edit with these constraints. `sdd/extra-session/spec.md` gains a note
  about the deferred path bypassing state.

## Target architecture

```
/user/history/deferred  →  DayDeferred (page, thin orchestrator)
   │  Owns: data fetch, context signals, mutation routing, loading/error
   │  Inputs to child: workoutSession, exercises, selectedDate, editorContext
   │  Outputs from child: save(WorkoutSessionVM), extraSessionSave(ExtraSessionForm), completeDay
   │
   └── WorkoutSessionEditor (coordinator widget — no store, no singleton writes)
         │  Owns: local editing state (selectedExercises, dialog open flags)
         │  Uses: WorkoutEdition, ExerciseSelector, ExtraSessionForm (all pure I/O)
         │
         ├── WorkoutEdition  (pure: inputs session+exercises, output saveWorkoutSession)
         ├── ExerciseSelector (pure: inputs exercises+selected, outputs toggle/change)
         └── ExtraSessionForm (pure: inputs date, output saveExtraSession)
```

## Tasks

### T1 — Bug fix: eliminate infinite loop (Priority: Critical)

**Files:**

- `src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.ts`

**Steps:**

1. Remove the `effect()` from the constructor entirely.
2. Implement `OnChanges` / `ngOnInit`. Load session data once from the
   `editorContext` input using `ngOnChanges` with an identity check on
   `ctx.containerId` + `ctx.containerType`.
3. The `workoutSession`, `exercises`, and `selectedDate` signals become
   **plain `input.required`** passed from `DayDeferred` — the component no
   longer fetches data itself.
4. Remove the `OrchestratorComponent` forwarding; inline the template.

**Validation:** Page loads without console loop. `npm run typecheck`.

### T2 — DayDeferred becomes the data owner

**Files:**

- `src/app/pages/user/history/day-deferred/day-deferred.ts`
- `src/app/pages/user/history/day-deferred/day-deferred.html`

**Steps:**

1. Keep `ngOnInit` for route param reading (unchanged).
2. Add data fetch: after params are read, call `findById(id)` or
   `findById(weekLogId)` → `workoutSession` + `exercises` signals.
3. Pass `workoutSession()`, `exercises()`, `selectedDate()`, `editorContext()` as
   inputs to `WorkoutSessionEditor`.
4. Listen to `save` output → call correct mutation (D5).
5. Listen to `extraSessionSave` output → call correct service (D6).
6. Implement `ngOnDestroy` → `ctxSvc.clearContext()` (D7).
7. Remove `WORKOUT_STORE` injection.

### T3 — WorkoutSessionEditor refactored to pure coordinator

**Files:**

- `src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.ts`
- `src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.html`

**Steps:**

1. New inputs: `workoutSession = input.required<WorkoutSessionVM | null>()`,
   `exercises = input.required<ExercisePerformanceVM[]>()`,
   `selectedDate = input.required<string>()`, `editorContext = input.required<EditorContext>()`.
2. New outputs: `save = output<WorkoutSessionVM>()`,
   `extraSessionSave = output<CreateExtraSessionForm>()`,
   `closeEditor = output<void>()`, `completeDay = output<void>()`.
3. Local state only: `selectedExercises = signal<ExercisePerformanceVM[]>([])`,
   `isExerciseSelectorOpen`, `isExtraSessionOpen`, `saving`.
4. Initialize `selectedExercises` from the `exercises` input using `ngOnChanges`
   (identity check on array reference or length).
5. Absorb Orchestrator logic: `onToggleExercise`, `onExercisesSelectedChange`,
   `onWorkoutSave`, `onExtraSessionSave` — but `onWorkoutSave` emits `save`
   upward; `onExtraSessionSave` emits `extraSessionSave` upward. No direct
   service calls.
6. Remove `OrchestratorComponent` import and usage.
7. Update template to inline the selector + edition + extra-session dialogs.

### T4 — Remove OrchestratorComponent

**Files:**

- `src/app/shared/components/widgets/tracking/workout-session-editor/orchestrator.component.ts`
  (delete)

**Steps:**

1. Confirm no other component imports `OrchestratorComponent`.
2. Delete the file.

### T5 — EditorContextService: add `clearContext()`

**Files:**

- `src/app/core/services/editor-context/editor-context.service.ts`

**Steps:**

1. Add `clearContext(): void { this.context = {} as EditorContext; }`.
2. `DayDeferred.ngOnDestroy` calls `this.ctxSvc.clearContext()`.

### T6 — PlanDayDomainService: expose deferred-safe extra session update

**Files:**

- `src/app/core/services/day-logs/plan-day.domain.ts`
- `src/app/core/services/day-logs/plan-day.service.ts`

**Steps:**

1. Verify `PlanDayDomainService.updateExtraSession(extraSession)` calls the API
   without touching state. If it already does (delegating to `PlanDayApi`), just
   expose it directly.
2. Add `PlanDayService.updateExtraSessionDeferred(extraSession)` that delegates to
   `domain.updateExtraSession` without calling `this._persist`. This is what
   `DayDeferred` calls for DL extra sessions.

### T7 — Spec update: training-history FR-013 promoted to edit

**Files:**

- `sdd/training-history/spec.md`

**Steps:**

1. Rewrite FR-013 from "read-only demo form" to full edit:
    - `DayDeferred` orchestrates route parsing + data fetch + mutation routing.
    - `WorkoutSessionEditor` is a pure coordinator (no store, no service calls).
    - Save path: DL → `PlanDayDomainService.updateWorkoutSession`, WL →
      `WorkoutApi.updateWorkoutSession`.
    - Extra-session path: DL → `PlanDayService.updateExtraSessionDeferred`, WL →
      `PlanTrackingService.updateExtraSession`.
2. Add AC-007: "The deferred editor saves exercises without touching active state."

### T8 — Tests

**Files:**

- `src/app/pages/user/history/day-deferred/day-deferred.spec.ts`
- `src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.spec.ts`

**Cases:**

- `WorkoutSessionEditor` renders with inputs; emits `save` on workout save;
  emits `extraSessionSave` on extra-session save; no service calls internal.
- `DayDeferred` DL path: fetches day-log, passes to WSE, calls
  `PlanDayDomainService.updateWorkoutSession` on save output.
- `DayDeferred` WL path: fetches week-log, resolves day, calls
  `WorkoutApi.updateWorkoutSession` on save output.
- No state/storage written in either path.
- `clearContext()` called on destroy.

### T9 — Validation gates

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:ci
npm run build
```

## Acceptance criteria

- [x] Infinite loop in `WorkoutSessionEditor` eliminated.
- [x] `DayDeferred` owns session and extra-session data fetching.
- [x] `WorkoutSessionEditor` is a decoupled coordinator component with pure I/O.
- [x] `OrchestratorComponent` removed (logic consolidated cleanly).
- [x] Extra sessions listed in deferred day with `ExtraSessionCard`.
- [x] Extra session operations (create, inline edit, delete) fully functional in deferred mode.
- [x] Context and services bypass active tracking state and local storage.
- [x] `EditorContextService.clearContext()` executed on page destroy.
- [x] Quality gates pass: typecheck, lint, format, 776/776 tests, production build.

## Status

Done — fully implemented, tested, and validated.
