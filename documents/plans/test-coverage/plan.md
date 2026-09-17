# Plan: Test suite stabilization and Spec-coverage restoration

## Context

`npm test` currently fails at the compile stage. Inventory of `src/**/*.spec.ts`
(101 files): **17 broken** (do not compile), **81 trivial smoke tests**
(only `should create` / `toBeTruthy`), **3 real tests**
(`day-log.wrapper.spec.ts`, `plan-day.domain.spec.ts`, `routine-form.spec.ts`).

The Specs already acknowledge this state:

- `sdd/routines/spec.md` — *"Existing spec files are either broken
  (`routines.spec.ts` imports nonexistent `./routines`; `routines-api.service.spec.ts`
  can't resolve dependencies) or trivial smoke tests. `routine-form.spec.ts` expects
  navigation to `['/routines/create']` while the component navigates to `['/routines']`."*
- `sdd/tracking/spec.md` — *"All existing tracking spec files are trivial 'should create'
  smoke tests. `plan-tracking.spec.ts` is broken (imports nonexistent class)."* Known
  issues also note wrong `describe()` titles in `tracking-week.spec.ts` (`RoutineScheduler`)
  and `tracking-workout.spec.ts` (`RoutineTrackingExercise`).
- `sdd/user-profile/spec.md` — *"The existing `user-profile.spec.ts` is broken — it imports
  `UserProfile` from `./user-profile` which does not exist (the real export is
  `UserProfileService` from `./user-profile.service`). All other widget spec files are
  trivial 'should create' smoke tests."* TEST-002 (`method doesn't exist as described`)
  and TEST-005 (`behavior itself is broken — see FR-007`) are struck through.
- `sdd/training-history/spec.md` — same broken-import pattern; no `history.spec.ts`.
- `sdd/pwa-offline/spec.md` — Known issues: *"No unit tests for any PWA/offline components"*.
- `documents/plans/day-log-create-workout/plan.md` — *"`npm test` is currently blocked by
  pre-existing stale scaffold specs unrelated to this change."*

`TEST-xxx` scenarios marked `~~...~~ **NOT IMPLEMENTED**`: routines (5), tracking (6),
user-profile (5), training-history (2).

**Goal:** make the feature Specs' `Tests` sections real — a green, runnable unit suite
that encodes the `TEST-xxx` scenarios.

## Decisions

1. Full scope, executed in phases (0 → 1 → 2), one task at a time, test-first
   (Engineering Charter).
2. Delete the 9 zombie UI specs (they import non-existent classes; no Spec requires UI smoke).
3. Rewrite the 8 broken feature specs as part of each feature's `TEST` task, not patched in place.
4. `TEST` scenarios whose method/behavior does not exist (user-profile TEST-002/005,
   tracking `EDITED` status, stale routines gql constants) are documented in the Spec and
   **deferred** — no code repair in this plan.
5. Add a `## Files`/`## Tests` section to `sdd/pwa-offline/spec.md` and implement its tests.
6. Add a `test:ci` npm script (`ng test --watch=false --browsers=ChromeHeadless`).
7. Archive the orphan `sdd/prompt.md` (SDD-migration brief, not a Spec) to `documents/legacy/`.

## Phase 0 — Green gate (`npm test` compiles and passes)

- **0.1 Tooling**: `package.json` += `test:ci` (`ng test --watch=false --browsers=ChromeHeadless`).
  Document the targeted-run recipe for narrow validation: temporary
  `tsconfig.spec.tmp.json` with an `include` restricted to the specs under test, run
  `ng test --watch=false --ts-config=tsconfig.spec.tmp.json --browsers=ChromeHeadless`,
  then delete the temporary file.
- **0.2 Delete 9 zombie UI specs**:
  `src/app/shared/components/ui/accordion-item/accordion-item.spec.ts`,
  `src/app/shared/components/ui/btn/btn.spec.ts`,
  `src/app/shared/components/ui/dialog/dialog.spec.ts`,
  `src/app/shared/components/ui/select/select.spec.ts`,
  `src/app/shared/components/ui/table/filter/filter.spec.ts`,
  `src/app/shared/components/ui/table/pagination/pagination.spec.ts`,
  `src/app/shared/components/ui/table/table/table.spec.ts`,
  `src/app/shared/components/widgets/exercises/exercise-create/exercise-create.spec.ts`,
  `src/app/shared/components/widgets/plans/week-day-cell/week-day-cell.spec.ts`.
- **0.3 Delete 7 broken one-`it` feature scaffolds** (recreated with real coverage in Phase 1):
  `src/app/core/auth.spec.ts`,
  `src/app/core/services/auth/credentials.spec.ts`,
  `src/app/core/services/routines/routines.spec.ts`,
  `src/app/core/services/trackings/plan-tracking.spec.ts`,
  `src/app/core/services/training-history/training-history.spec.ts`,
  `src/app/core/services/user/user-profile.spec.ts`,
  `src/app/core/services/workouts/workout.spec.ts`.
- **0.4 Repair `src/app/core/auth/token.storage.spec.ts`**: fix the `mockUser` fixture to
  include the `avatar` property required by `User` (keeps its 4 real assertions).
- **0.5 Align `routine-form.spec.ts`** navigation expectation with the validated component
  (`['/routines']` instead of `['/routines/create']`).
- **0.6 Run** the full suite via `test:ci`; repair any remaining trivial runtime failures in
  smoke specs. Expected result ≈ 85 spec files (4 REAL + 81 smoke), green.
- **0.7 Rename** the wrong `describe()` titles in `tracking-week.spec.ts` and
  `tracking-workout.spec.ts` to the actual component classes.

## Phase 1 — Feature tasks (implement `TEST-xxx`, test-first)

Each task follows: write/update specs → targeted `ng test` → `ng lint` → `ng build` →
update the corresponding `sdd/<feature>/spec.md` (clear strikethrough + stale `Note:` lines).

- **T1 day-log** (`sdd/day-log/spec.md`, TEST-001..007):
  `day-log.wrapper.spec.ts` TEST-001 (ISO date → `LocalDate` per timezone; TEST-004 already
  covered); `plan-day.domain.spec.ts` TEST-002 (sends user `timezone` IANA), TEST-003
  (assign routine seeds exercises), TEST-005 (complete flips active/completed), TEST-007
  (createWorkout unified payload — partially covered); new `plan-day.service.spec.ts`
  (facade wiring), `plan-day.state.spec.ts`, `day-workout.store.spec.ts` TEST-006
  (WorkoutStore contract, day impl).
- **T2 tracking** (`sdd/tracking/spec.md`, TEST-001..006):
  `tracking.wrapper.spec.ts` TEST-005 (ISO → `LocalDate`); `plan-tracking.domain.spec.ts`
  TEST-001 (current-week range + persist), TEST-002 (setExercises debounce + offline
  enqueue), TEST-003 (REST/COMPLETE transitions; verify `EDITED` — defer if absent),
  TEST-004 (completeTracking deactivates + cleans); `workout.state.spec.ts` TEST-006
  (WorkoutStore contract, week impl); facade spec for `plan-tracking.service.ts`.
- **T3 extra-session** (`sdd/extra-session/spec.md`, TEST-001..005):
  `extra-session.service.spec.ts` + `extra-session.api.spec.ts`, covering day-log vs
  week-log routing in `create`/`remove`.
- **T4 routines** (`sdd/routines/spec.md`, TEST-001..005):
  `routines.service.spec.ts` (caching, filters, offline `CreateRoutineDay`, favorite
  optimistic cache) + `routines.wrapper.spec.ts` (API ↔ VM mapping incl. `kind`,
  `isFavorite`, `expanded`/`day`).
- **T5 plans** (`sdd/plans/spec.md`, TEST-001..005):
  `plans.service.spec.ts` TEST-001 `validateTitleUnique` (or validator spec), TEST-002
  `submitPlan` online, TEST-003 `submitPlan` offline; `day-plan-state.spec.ts` TEST-004
  (kind/expand/remove edits); `plans.wrapper.spec.ts` TEST-005 (`RoutinePlanSend` maps
  `routineDays` → day IDs).
- **T6 auth** (`sdd/auth/spec.md`, TEST-001..004):
  `token.storage.spec.ts` TEST-001 (repaired in 0.4), `credentials.service.spec.ts`
  TEST-002, `auth.service.spec.ts` TEST-003 (session + `UNAUTHENTICATED`),
  `auth-guard.spec.ts` TEST-004.
- **T7 exercises** (`sdd/exercises/spec.md`, TEST-001..004):
  `exercises.service.spec.ts` TEST-001 (cache + `force`), TEST-002 (online/offline
  `createExercise`), TEST-003 (favorite optimistic); `exercises.wrapper.spec.ts`
  TEST-004 (category normalization).
- **T8 coach** (`sdd/coach/spec.md`, TEST-001..004):
  `coach.service.spec.ts` TEST-001 (`generatePlan` maps + GraphQL errors), TEST-002
  (`confirmPlan` action/payload), TEST-003 (`getPlanTrainings` network-only + paging);
  `coach.state.spec.ts`/storage TEST-004 (drafts persist).
- **T9 training-history** (`sdd/training-history/spec.md`, TEST-001..002):
  `training-history.service.spec.ts` TEST-001 (`month+1` + timezone), TEST-002 (mapping
  days/type/status/`weekLogReference`).
- **T10 user-profile** (`sdd/user-profile/spec.md`):
  implement TEST-001 (`initUserProfile` → `ProfileUser`), TEST-003 (`updateProfile` merge),
  TEST-004 (`distributionToLogMode`); update the Spec `Note:` for deferred TEST-002/005
  (incl. FR-007 broken logout) — no code repair here.
- **T11 pwa-offline** (`sdd/pwa-offline/spec.md`):
  add `## Files`/`## Tests` sections to the Spec, then implement specs for
  `SyncQueueService`, `NetworkStatusService`, `IndexedDbStorageService`.

## Phase 2 — Docs & final validation

- Rewrite the covered-areas section of `documents/engineering/testing.md` to reflect the
  actual suite; add `npm run test:ci` to the local quality gates in
  `documents/engineering/ci-cd.md`.
- Archive `sdd/prompt.md` (SDD-migration brief) → `documents/legacy/`.
- Final gates: `npm run test:ci`, `npm run lint`, `npm run build`, `npx prettier --check .`.

## Out of scope

- Code repair for deferred behaviors (user-profile TEST-002/005, tracking `EDITED`
  status, routines stale gql constants).
- e2e expansion (the Specs define no e2e coverage). Existing `e2e/tracking-flow.spec.ts`
  requires a live backend and stays as-is.