# PWA / Offline

## Context

WaveFit is a PWA with progressive caching and offline-first writes. The whole app functions without network for reads; writes update local state first and are replayed on reconnect. Workbox drives the service worker (via a custom `sw.js` + `workbox-config.js`), IndexedDB is the local database, and `SyncQueueService` orchestrates pending mutations.

**Note:** `@angular/service-worker` is listed as a transitive dependency but is never imported, configured, or used. There is no `ngsw-config.json`. The engineering doc (`documents/engineering/pwa.md`) confirms: "`@angular/service-worker` is **not** used."

## Requirements

### FR: Functionality

- **FR-001** Build pipeline injects a precache manifest for static assets via a custom Workbox architecture (`src/sw.js` + `workbox-config.js` with `injectManifest`). No `@angular/pwa` or `@angular/service-worker` is used.
- **FR-002** Runtime caching strategy: cache-first for static assets (images, fonts); network-first (with offline fallback) for GraphQL and navigation requests.
- **FR-003** `IndexedDB` (`WaveFitDB`) stores defined in `IndexedDbStorageService`: `graphqlCache`, `pendingMutations`, `authUser`, `exercises`, `routines`, `plans`, `tracking`, `dayLogs`. **Note:** `profile` and `extra-session catalogs` stores do NOT exist — `profile` data lives in `authUser` under key `'current'`, and extra-session catalogs are held only in memory (`BehaviorSubject`).
- **FR-004** `SyncQueueService` queues pending writes when offline. The interface is `PendingMutation` (not `SyncOp`):
  ```ts
  interface PendingMutation {
      id: string;           // UUID
      operationName: string; // e.g. 'CreateExercise', 'UpdateWeekLogDay'
      variables: any;
      status: 'pending' | 'syncing' | 'failed';
      createdAt: number;
      retryCount?: number;  // max 3
  }
  ```
  Replays in FIFO order on reconnect.
- **FR-005** Per-feature offline handlers registered via `registerHandler()`:
  - ✅ `CreateExercise` → exercises service
  - ✅ `CreateRoutineDay` → routines service
  - ✅ `CreateRoutinePlan` → plans service
  - ❌ `CreateDayLog` → **NOT IMPLEMENTED** (`PlanDayDomainService.createDayLog()` always calls API directly)
  - ✅ `UpdateWeekLogDay` → plan-tracking domain
  - ⚠️ `UpdateDayLog` → **PARTIAL** (handler registered; only used in `updateExercises()` path)
  - ❌ `UpdateDayLogStatus` → **NOT IMPLEMENTED** (`setRestDay()` always calls API directly)
  - ❌ `AssignRoutineToDayLog` → **NOT IMPLEMENTED** (`createWorkoutWithRoutine()` always calls API directly)
  - ❌ `RemoveWorkoutSessionFromDayLog` → **NOT IMPLEMENTED** (`removeWorkoutSession()` always calls API directly)
  - ❌ `RemoveExtraSessionFromDayLog` → **NOT IMPLEMENTED** (`removeExtraSession()` always calls API directly)
  - ❌ Extra-session mutations → **NOT IMPLEMENTED** for offline
- **FR-006** `NetworkStatusService` provides `isOnline` signal used by widgets to toggle offline indicators. Listens to `window.addEventListener('online'/'offline')`. Implements `OnDestroy` for cleanup.
- **FR-007** API writes use a **binary online/offline decision** (not the `localFirst` pattern originally spec'd):
  - If online → call API directly, update local state on success.
  - If offline → save to sync queue + update local state optimistically.
  - **No API-failure fallback when online:** if the user is online but the API call fails (server error, timeout), the mutation is lost — it is NOT enqueued to the sync queue.
- **FR-008** PWA install prompt: **NOT IMPLEMENTED.** No `beforeinstallprompt` event listener exists anywhere. Offline banner: **IMPLEMENTED** — yellow banner in header with text "Trabajando sin conexión (Offline)" and wifi-off SVG icon.
- **FR-009** Background sync replays queue in FIFO order (`pending.sort((a, b) => a.createdAt - b.createdAt)`), removing successful ops; failed ops remain and retry on next reconnect (max 3 retries). **Note:** no UI notification for permanently failed sync ops — only `console.error`. The service worker listens for `sync` events with tag `'sync-mutations'` and posts `PROCESS_SYNC_QUEUE` to clients, but the primary trigger is `NetworkStatusService.isOnline()` via an Angular `effect()`.

### BR

- `BR-012` (offline-first writes) and `BR-013` (active element state + `WORKOUT_STORE` polymorphism) apply.

### NFR

- **NFR-001** No user data is lost on offline → reconnect transitions. **Note:** this applies only for the 4 implemented handlers; the other operations lose data on offline.
- **NFR-002** Precached static assets are served instantly after first load.
- **NFR-003** Sync replays must not block the UI thread; background execution.

## Constraints

- The backend is the **eventual source of truth**; optimistic local state is always reconciled.
- `localStorage` is used for several storage services beyond the originally spec'd exception: `CredentialsService` (encrypted credentials), `PlansStorageService` (plan drafts), `PlanTrackingStorage`, `PlanDayStorage`, `CoachStorageService`.
- Auth tokens are HttpOnly cookies (not in JS-visible storage). **However:** `CredentialsService` stores encrypted login credentials (identifier + password) in `localStorage` for the "remember me" feature, and `TokenStorage` stores user data (id, name, email, avatar, role) in IndexedDB `authUser` store.

## Architecture

```
ServiceWorker (src/sw.js) — Workbox CDN + custom injectManifest
├── Workbox: PrecacheManifest + RuntimeCache
├── BackgroundSync (sync event → PROCESS_SYNC_QUEUE message)
└── IndexedDB onupgradeneeded: graphqlCache, pendingMutations, authUser, exercises, routines, plans, tracking

IndexedDB (Angular — IndexedDbStorageService)
├── core/services/storage/indexed-db.service.ts  — schema/migration (version 4)
└── stores: graphqlCache, pendingMutations, authUser, exercises, routines, plans, tracking, dayLogs

core/services/network/network-status.service.ts   — isOnline signal
core/services/sync/sync-queue.service.ts           — queue + FIFO replay + handler registry
core/services/sync/sync.types.ts                   — PendingMutation + event types
```

**Schema version mismatch:** The service worker opens `WaveFitDB` at version 31. The Angular `IndexedDbStorageService` defines schema up to version 4. The SW creates stores `pendingMutations`, `authUser`, `exercises`, `routines`, `plans`, `tracking` but NOT `dayLogs` (which the Angular app adds in version 4).

Per feature: offline-write handlers live inside the domain services and enqueue `PendingMutation` typed by operation name.

## Known issues

- **6 of 11+ operations have no offline handler** (see FR-005).
- **No PWA install prompt** (see FR-008).
- **IndexedDB version mismatch** between SW (version 31) and Angular app (version 4) — `dayLogs` store is only created by Angular, not by the SW.
- **No unit tests** for any PWA/offline components (`SyncQueueService`, `NetworkStatusService`, `IndexedDbStorageService`, offline-write handlers).
- **`localStorage` usage** extends beyond the spec'd exception (credentials, coach, tracking, day-log caches).
- **SW GraphQL whitelist** is limited to `['GetExercises', 'Me']` — only these two queries get cached in the SW's IndexedDB cache.

## Acceptance Criteria

- **AC-001** Loading the app in airplane mode serves the full UI from cache. ✅
- **AC-002** ~~Creating an exercise/routine/plan/workout offline persists locally and syncs after reconnect.~~ ⚠️ Only for exercises, routines, plans, and `UpdateWeekLogDay`. Day-log, extra-session, and status operations are lost offline.
- **AC-003** A banner/indicator reflects online/offline status. ✅
- **AC-004** ~~Auth remains secure: no tokens in localStorage/IndexedDB.~~ ⚠️ Encrypted credentials in `localStorage`; user profile data in IndexedDB `authUser`. No raw auth tokens stored.
- **AC-005** Queue replay is deterministic and ordered (FIFO). ✅
