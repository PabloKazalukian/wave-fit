# WaveFit — Architecture

This document describes the **stable high-level architecture** of the WaveFit frontend repository.

It is intentionally feature-agnostic. Feature-specific architecture, files, and data contracts live in the relevant [Specs](../../sdd/README.md). UI visual conventions live in [UI-Conventions](../design/ui-conventions.md).

---

## 1. Architectural Style

- **Single-page application** built with **Angular 20** (standalone components, no `NgModules`) and **TypeScript 5.8** (strict).
- **Styling**: TailwindCSS (v3) utility classes; design tokens centralized in `tailwind.config.js`.
- **Server communication**: **GraphQL via Apollo Angular** (`apollo-angular` + `@apollo/client`), queries/mutations inline with `gql`.
- **Reactive state**: RxJS (`BehaviorSubject`) for service caches; **Angular Signals** for component and query state.
- **PWA**: **Workbox** (custom `src/sw.js`), not `@angular/service-worker`.
- **Offline**: IndexedDB via **Dexie** (`IndexedDbStorageService`) + mutation queue (`SyncQueueService`) + `NetworkStatusService`.
- **Dates**: `date-fns` / `date-fns-tz`; all domain dates are `LocalDate` strings (`"yyyy-MM-dd"`), never JS `Date`.
- **Deploy**: Vercel (frontend), backend at `wave-fit-api` (NestJS + GraphQL + MongoDB).

---

## 2. Major Layers

```text
Pages (lazy-loaded views, protected by authGuard)
   │
   ▼
Shared Components
   ├── widgets        (feature/business components + facades)
   └── ui             (dumb presentational components: btn, card, dialog, ...)
   │
   ▼
Core Services     ┌─ Facade (coordination of the view)
                  ├─ Domain (business logic)
                  ├─ API    (GraphQL calls, cache with BehaviorSubject)
                  ├─ Storage(local persistence: IndexedDB / localStorage)
                  └─ State  (reactive state of the active element)
   │
   ▼
Apollo GraphQL  ──►  WaveFit API (NestJS + GraphQL + MongoDB)
```

### Data flow (component → service)

```text
Dumb Components → Facade → Domain Service → (API/Storage Services + State Service)
```

- **Dumb components** render only; they receive inputs and emit outputs.
- **Facades** coordinate a view with domain services, expose the view-model and actions to templates.
- **Domain services** hold business logic and orchestrate API/storage/state.
- **API services** issue GraphQL operations and cache results.
- **State services** hold reactive state (signals + `BehaviorSubject`) for the active element (active day / active workout / active day-log).
- **Wrappers** transform data between layers (API ↔ VM ↔ Send).

---

## 3. Module / Folder Structure

```text
src/app/
├── core/
│   ├── apollo/          # GraphQL queries/mutations per feature (auth not needed)
│   ├── auth/            # TokenStorage (IndexedDB/Dexie), auth.initializer
│   ├── auth-guard.ts    # Route guard (isAuthenticated)
│   └── services/        # All services, grouped by feature (see §5)
├── pages/               # Lazy-loaded views
│   ├── auth/            # login, register, callback
│   ├── coach/           # Coach AI
│   ├── exercises/       # Exercise library
│   ├── home/            # Dashboard
│   ├── my-day/          # Day-log training (+ success/)
│   ├── my-week/         # Week-log training (+ success/)
│   ├── plans/           # Plans list (+ create/)
│   ├── routines/        # (+ show/:id)
│   ├── tracking-day/    # (+ show/)
│   ├── trackings/       # list, show/:id, stats/
│   └── user/            # profile, history
├── shared/
│   ├── animations/
│   ├── components/      # widgets (business) + ui (dumb)
│   ├── interfaces/      # *.interface.ts (+ api/, input*.ts)
│   ├── pipes/
│   ├── utils/
│   ├── validators/
│   └── wrappers/        # Data transformers (API ⇄ VM ⇄ Send)
├── app.routes.ts
└── app.config.ts
```

---

## 4. Two Data Branches (domain model)

| Branch                  | Container                           | Active element (State)          | UI route                              |
| ----------------------- | ----------------------------------- | ------------------------------- | ------------------------------------- |
| **TEMPLATE**            | `RoutinePlan`                       | `RoutineDay` (day being edited) | `/plans/create`, `/routines/show/:id` |
| **TRACKING (week-log)** | `TrackingVM` (weekly `WeekLog`)     | `WorkoutSession` (active day)   | `/my-week`                            |
| **TRACKING (day-log)**  | `DayLogVM` (single day, flat model) | `WorkoutSession` (global WS)    | `/my-day`                             |

The **TEMPLATE** branch describes how training looks on paper (weekly plan composed of routine days). The **TRACKING** branch records actual execution (sets, weights, reps) per week-log or day-log.

### Active container source of truth

`ActiveTrackingService` (`core/services/trackings/active-tracking.service.ts`) is the single start-up source of truth:

```text
activeTracking { hasActive, type: 'WEEK_LOG' | 'DAY_LOG', week?, day? }
```

It exposes `hasActive`, `isWeekLogActive`, `isDayLogActive`, and `mode: 'week' | 'day'`. Both the week and day flows and the `WORKOUT_STORE` token (see §6) consume it.

---

## 5. Services Architecture

Services are grouped under `core/services/<feature>/` and classified by complexity:

| Complexity | Pattern                        | Services                                                                                                   |
| ---------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **High**   | Domain + API + Storage + State | `PlanTrackingService`, `PlanDayService`                                                                    |
| **High**   | Domain + API + State           | `UserProfileService`                                                                                       |
| **Medium** | API + Storage + State          | `PlansService`                                                                                             |
| **Medium** | API + State                    | `ExtraSessionService`, `WorkoutStateService` (+ `DayWorkoutStore`), `CoachService` (API + State + Storage), `ActiveTrackingService` (+ `ActiveTrackingApi`) |
| **Low**    | API + Service                  | `ExercisesService`, `RoutinesService`, `AuthService`, `TrainingHistoryService`                             |
| **Infra**  | Support                        | `NetworkStatusService`, `SyncQueueService`, `IndexedDbStorageService`, `DateService`, `WarmupService`      |

### Folder layout (current)

```text
core/services/
├── auth/            # auth.service.ts, credentials.service.ts
├── coach/           # coach.service.ts, coach.state.ts, storage/coach.storage.ts
├── exercises/       # exercises.service.ts (+ offline via SyncQueue)
├── extra-session/   # extra-session.service.ts, api/extra-session.api.ts
├── day-logs/        # plan-day.service.ts / .domain.ts / .state.ts, plan-day/{api,storage}
├── network/         # network-status.service.ts
├── plans/           # plans.service.ts, day-plan-state.service.ts, api/, storage/
├── routines/        # routines.service.ts, api/routines.api.ts
├── storage/         # indexed-db.service.ts (Dexie)
├── sync/            # sync-queue.service.ts, sync.types.ts
├── trackings/       # plan-tracking.service.ts / .domain.ts / .state.ts,
│                    # active-tracking.{api,service}.ts, tracking-list.state.ts,
│                    # plan-tracking/{api,storage}
├── training-history/# training-history.service.ts
├── training-history/# training-history.service.ts
├── user/            # user-profile.service.ts / .domain.ts / .state.ts, api/
├── workouts/        # workout.state.ts, day-workout.store.ts, workout-store.*.ts, api/workout.api.ts
├── date.service.ts
└── warmup.service.ts
```

### State vs API vs Storage responsibilities

- **State services** expose `BehaviorSubject`/signals (`tracking`, `loading`, `error`, `userId`) and contain **no** API/storage logic.
- **API services** issue GraphQL operations and keep a cache (`BehaviorSubject`) where relevant.
- **Storage services** persist locally (IndexedDB via Dexie; `localStorage` for some caches).
- **Domain services** orchestrate API + State + Storage for the high-complexity features and register offline sync handlers.

---

## 6. The `WorkoutStore` Contract (day-level widgets)

Day-level workout widgets (workout-in-progress, workout-edition, workout-actions-menu, workout-routine-selector, exercise-selector, extra-session-form) depend on a **single contract** instead of a concrete service:

```text
core/services/workouts/workout-store.interface.ts
```

```ts
export interface WorkoutStore {
    selectedDate: Signal<LocalDate | null>;
    workoutSession: Signal<WorkoutSessionVM | null>;
    exercises: Signal<ExercisePerformanceVM[]>;
    outOfDateRange: Signal<boolean>;
    loadingWorkoutCreation: Signal<{ date: LocalDate; state: boolean }>;
    loadingStatusWorkout: Signal<boolean>;
    loading: Signal<boolean>;

    setDate(date: LocalDate): void;
    updateExercises(exercises: ExercisePerformanceVM[]): void;

    createWorkout(date: LocalDate): Observable<unknown>;
    setRestDay(
        date: LocalDate,
        workout: WorkoutSessionVM,
        status: StatusWorkoutSession,
    ): Observable<unknown>;
    setRemoveAllExercises(date: LocalDate): void;
    updateWorkoutStatus(date: LocalDate, status: StatusWorkoutSession): void;
    updateWorkoutSession(date: LocalDate, workout: WorkoutSessionVM): void;
    removeWorkoutSession(date: LocalDate, id: string): Observable<boolean>;
    createWorkoutWithRoutine(routineDayId: string, date: LocalDate): Observable<unknown>;
    createRoutineFromWorkout(title: string, exerciseIds: string[]): Observable<RoutineDayAPI | null>;
}

export const WORKOUT_STORE = new InjectionToken<WorkoutStore>('WORKOUT_STORE');
```

There are **two implementations**:

| Implementation        | File                            | Mode     | Backed by             |
| --------------------- | ------------------------------- | -------- | --------------------- |
| `WorkoutStateService` | `workouts/workout.state.ts`     | week-log | `PlanTrackingService` |
| `DayWorkoutStore`     | `workouts/day-workout.store.ts` | day-log  | `PlanDayService`      |

A **root factory token** (`workouts/workout-store.mode.ts`, `workoutStoreByMode()`) provides a virtual store whose signals are `computed`s that delegate dynamically to the active mode via `ActiveTrackingService.isDayLogActive()`. This lets the same day-level widgets work in both the week-log and the day-log without re-injection or duplication.

---

## 7. State and Reactivity Patterns

- **Service caches**: `BehaviorSubject<T>` exposed as `readonly $` observable plus a `toSignal(..., { initialValue })` where convenient.
- **Atomic/active state**: Signals for the resolution of the active element (e.g., `TrackingStateService.tracking`, `PlanDayStateService.dayLog`, `WorkoutStateService.workoutSession`).
- **Reactive user effect**: services that depend on the authenticated user subscribe to `AuthService.user$` in a constructor `effect` and initialize/reset their state when the user changes (e.g., `PlanTrackingService`, `ActiveTrackingService`).
- **Debounced persistence**: long-lived edits (e.g., exercise edits) persist through `debounceTime(4000)` to avoid saturating the API.
- **Loading/error/ready**: each state service exposes `loading*`, `error`, and (where relevant) `ready` signals.

---

## 8. PWA / Offline Architecture

- **Service Worker**: Workbox (`workbox-config.js` + `src/sw.js`), generated by `workbox injectManifest` at build time → `dist/wave-fit/browser/sw.js`. Registered only in production (`src/main.ts`).
- **Precaching**: `precacheAndRoute(self.__WB_MANIFEST)` for all built assets.
- **Caching strategies**:
    - Images → `CacheFirst` (cache `images`, max 60, 30 days).
    - Fonts → `CacheFirst` (cache `webfonts`, max 20, 1 year).
    - Navigation (SPA) → `NetworkFirst` with fallback to precached `index.html`.
    - GraphQL POST whitelist (`GetExercises`, `Me`) → `NetworkFirst` + IndexedDB cache fallback (store `graphqlCache`).
- **Offline-first infrastructure** (frontend services):
    - `NetworkStatusService` → online/offline signal.
    - `IndexedDbStorageService` (Dexie) → `exercises`, `routines`, `plans`, `tracking`/`dayLogs`, `graphqlCache`, `pendingMutations`, `authUser`.
    - `SyncQueueService` → mutation queue (`enqueue` / `dequeue` / `processQueue` on reconnect), with domain handlers registered per operation name. Currently registered: `CreateExercise`, `CreateRoutinePlan`, `CreateRoutineDay`, `UpdateWeekLogDay`, `UpdateDayLog`.
- Background-sync listener exists in `src/sw.js` for `sync-mutations`.

See [`pwa.md`](pwa.md) for the detailed current-state reference and the [pwa-offline Spec](../../sdd/pwa-offline/spec.md) for the feature capability model.

---

## 9. Authentication Architecture

- **Flows**: Google OAuth (PKCE, via Google Identity Services — `https://accounts.google.com/gsi/client` loaded in `index.html`) and email/password.
- **Token**: JWT delivered in an **HttpOnly cookie** (`token`); in production `Secure` + `SameSite=None`.
- **Apollo**: no `authLink`; GraphQL requests use `withCredentials`. An `errorLink` handles `UNAUTHENTICATED`/`UNAUTHORIZED` and HTTP 401 (fires a logout + redirect to `/auth/login`) and is wired in `main.ts`.
- **TokenStorage** (`core/auth/token.storage.ts`): asynchronous persistence over **IndexedDB/Dexie** (store `authUser`, key `current`). `AuthService` (in `core/services/auth/`) exposes signals + `initializeUserFromStorage`, `me()`, `hasSession()`, `avatarUrl` (`computed`).
- **Credentials** (`core/services/auth/credentials.service.ts`): "remember me" encrypted data in `localStorage` (`remember`, `identifier`, `password` via `encryption.util`).
- **Startup**: `auth.initializer.ts` runs before the app renders — it skips `/auth/login` and `/auth/register`, hydrates the session from IndexedDB first, then (only if a session exists) refreshes via `me()` with a **3s timeout**, non-blocking when offline. `authGuard` protects all routes except `/auth`.

---

## 10. Dependencies & Bounded Contexts

| Context  | Owns                                                   | Consumes                                                         |
| -------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| Template | RoutinePlan, RoutineDay, exercise library, favorites   | routines/plans/exercises services                                |
| Tracking | Tracking/WeekLog, DayLog, WorkoutSession, ExtraSession | PlanTracking/PlanDay, WorkoutStore, ExtraSession, ActiveTracking |
| Coach    | AI plan generation, plan confirmation, usage limits    | CoachService, UserProfile, ActiveTracking                        |
| Profile  | UserProfile data model                                 | UserProfileService                                               |
| Auth     | Session/token lifecycle                                | AuthService, TokenStorage                                        |
| PWA      | Workbox SW, offline queue                              | —                                                                |

Dependencies flow downward: **pages → shared widgets → core services → Apollo → API**. Feature services may consume other feature services (e.g., `ExtraSessionService` consumes `PlanTrackingService` / `WorkoutStore`; tracking consumes `ExercisesService`).

---

## 11. Major Architectural Constraints

- **No `NgModules`**: all components/pipes/directives are standalone.
- **No `UserService`**: replaced by `UserProfileService` (Domain + API + State).
- **`plan-tranking.api.ts`**: the misspelled API filename is **intentional/legacy** and must not be silently renamed in a behavior change.
- **`LocalDate` everywhere** in VMs: date comparisons are string comparisons.
- **IndexedDB (Dexie)** is the active local persistence; `localStorage` remains for some caches only.
- **One canonical documentation location** per knowledge category (see [charter.md](charter.md)).
