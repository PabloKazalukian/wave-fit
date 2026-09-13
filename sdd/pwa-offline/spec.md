# PWA / Offline

## Context

WaveFit is a PWA with progressive caching and full offline-first writes. The whole app functions without network for reads; writes update local state first and are replayed on reconnect. Workbox drives the service worker, Dexie/IndexedDB is the local database, and `SyncQueueService` orchestrates pending mutations.

## Requirements

### FR: Functionality

- **FR-001** Build pipeline injects a precache manifest for static assets (`ngsw-config.json`) via the `@angular/pwa` + Workbox architecture.
- **FR-002** Runtime caching strategy: cache-first for static assets; network-first (with offline fallback) for API calls.
- **FR-003** `IndexedDB` (via Dexie) stores: exercises, routines, profile, extra-session catalogs, auth-user, pending sync queue.
- **FR-004** `SyncQueueService` queues pending writes when offline (`SyncOp`: operation type + payload + timestamp); replays in order on reconnect.
- **FR-005** Per-feature offline handlers:
    - `CreateExercise` → exercises service
    - `CreateRoutineDay` → routines service
    - `CreateRoutinePlan` → plans service
    - `CreateDayLog` → day-log service
    - `UpdateWeekLogDay` → plan-tracking domain
    - `UpdateDayLog`, `UpdateDayLogStatus`, `AssignRoutineToDayLog`, `RemoveWorkoutSessionFromDayLog`, `RemoveExtraSessionFromDayLog` → day-log domain
    - Extra-session mutations delegated to the active container service
- **FR-006** `NetworkStatusService` provides `isOnline` signal used by widgets to toggle offline indicators.
- **FR-007** API writes always use `localFirst`: optimistic local update → attempt API → on failure, enqueue to `SyncQueueService` (BR-012).
- **FR-008** PWA install prompt and offline banner are shown when applicable.
- **FR-009** Background sync replays queue in FIFO order, removing successful ops; failed ops remain and retry on next reconnect.

### BR

- `BR-012` (offline-first writes) and `BR-013` (active element state + `WORKOUT_STORE` polymorphism) apply.

### NFR

- **NFR-001** No user data is lost on offline → reconnect transitions.
- **NFR-002** Precached static assets are served instantly after first load.
- **NFR-003** Sync replays must not block the UI thread; background execution.

## Constraints

- The backend is the **eventual source of truth**; optimistic local state is always reconciled.
- Do not use `localStorage` for large data (IndexedDB/Dexie preferred); `PlansStorageService` is the one exception for plan drafts (medium complexity).
- Do not cache auth tokens in JS-visible storage; HttpOnly cookie only.

## Architecture

```
ServiceWorker (ngsw)
├── Workbox: PrecacheManifest + RuntimeCache
└── BackgroundSync

IndexedDB (Dexie)
├── core/services/storage/indexed-db.service.ts  — schema/migration
└── stores: exercises, routines, profile, authUser, extra-session, sync-queue

core/services/network/network-status.service.ts   — isOnline signal
core/services/sync/sync-queue.service.ts           — queue + FIFO replay
```

Per feature: offline-write handlers live inside the domain services and `api`/`storage` services; they enqueue `SyncOp` typed by operation name.

## Acceptance Criteria

- **AC-001** Loading the app in airplane mode serves the full UI from cache.
- **AC-002** Creating an exercise/routine/plan/workout offline persists locally and syncs after reconnect.
- **AC-003** A banner/indicator reflects online/offline status.
- **AC-004** Auth remains secure: no tokens in localStorage/IndexedDB.
- **AC-005** Queue replay is deterministic and ordered (FIFO).
