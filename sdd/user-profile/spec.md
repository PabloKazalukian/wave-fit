# User Profile

## Context

The user profile stores body data, preferences, and longitudinal entries (strength metrics, weight logs, weekly goals). `UserProfileService` is the **medium-complexity** pattern: Domain + API + State. The profile feeds other features: `DistributionDays` provides the default logging mode, `unitsPreference`/`weightKg` drive weekly stats, and coach uses it as context.

## Requirements

### FR: Functionality

- **FR-001** `/user` and `/user/profile` expose the profile (read and edit).
- **FR-002** `UserProfileService` auto-initializes when a user authenticates: on auth change it calls `initUserProfile` and stores the result in the state.
- **FR-003** `fetchUserProfile()` and `initUserProfile()` load profile + sub-records and map them via `wrapperProfileContextToDomain(api)` (the GraphQL `UserProfileContextAPI` response). **Note:** the spec previously referenced `wrapperProfileUserToDomain` for this path; that wrapper is only used by `updateProfile`, not by the initial load.
- **FR-004** ~~`updateUserProfile(input, failedSteps)` splits the update across sub-records~~ **NOT IMPLEMENTED as described.** The actual implementation provides:
  - `completeBasicSetup({ profile, goals, schedule })` — splits across 3 sub-records (perfil, objetivos, horario) with `failedSteps` aggregation. Used only by the coach `FormUserProfile` widget.
  - Independent per-section methods (no `failedSteps` aggregation): `updateProfile`, `updateSchedule`, `updateTrainingPreference`, `updateGoals`, `updateHealthConstraints`, `updateResource`, `createStrengthMetric`, `createWeightLog`. Each fires a single mutation independently; failures are reported via `console.error` or notification, not via `failedSteps`.
- **FR-005** `updateProfile(input)` merges the result into the current state (`{ ...current, ...result }`).
- **FR-006** `DistributionDays` (`week_log`/`day_log`) is exposed; `distributionToLogMode` maps it to `LogMode` (`week`/`day`) — see day-log BR-010 (default only, not a lock).
- **FR-007** ~~Clearing the user (`logout`) resets the profile state to `null`.~~ **Partial:** `resetMyProfile()` exists and nulls the state, but the automatic reset on logout does NOT fire because `clearSession()` (called by `logout()`) never emits on `userIdSubject`, so the `effect()` that watches `authService.user$` does not trigger.
- **FR-008** Profile data is reused by Coach (`FormUserProfile`/`ShowUserProfileData` widgets) and weekly stats (weight in kg via `weightKg`).

### BR

- `BR-010` (DistributionDays default, not a lock) is owned here.
- `BR-003` (`birthDate` is `LocalDate`) applies.

### NFR

- **NFR-001** Profile loads once per session via state cache (`BehaviorSubject`). The load-once guard is in the service (line 59 of `user-profile.service.ts`), not via Apollo caching (`fetchPolicy: 'no-cache'`).
- **NFR-002** Partial updates keep previously-failed steps retryable without blocking valid ones. **Note:** this only applies to `completeBasicSetup` (coach flow); the independent per-section methods do not aggregate failed steps.

## Constraints

- `UserService` does **not** exist — this service replaced it.
- State is a plain `BehaviorSubject<ProfileUser | null>` (`UserProfileStateService`), not a signal store.
- Types live in `shared/utils/profile.types.ts` (not `user-profile.interface.ts`, which is intentionally empty).
- `birthDate` is a `LocalDate` string, converted to UTC ISO before sending to the API.

## Architecture

```
UserProfileService (core/services/user/user-profile.service.ts)          — facade
├── UserProfileDomainService (user-profile.domain.ts)                    — business logic
│     └── UserProfileApiService (api/user-profile-api.service.ts)        — GraphQL orchestration
│           ├── user-profile-api.get.service.ts   (getUserProfileContext)
│           └── user-profile-api.set.service.ts   (upsert/update per sub-record)
└── UserProfileStateService (user-profile.state.ts)                      — BehaviorSubject cache
```

Widgets:
- `shared/components/widgets/users/profile/user-profile`
- `shared/components/widgets/users/profile/weight`
- `shared/components/widgets/users/profile/strength-metrics`
- `shared/components/widgets/users/profile/resource`
- `shared/components/widgets/users/profile/training-performance`
- `shared/components/widgets/users/profile/health-constraints`
- `shared/components/widgets/users/profile/schedule`
- `shared/components/widgets/users/profile/goals`
- Coach: `form-user-profile` / `show-user-profile-data`

**Note:** The spec previously named widgets `strength-table` and `weight-table`. These do not exist; the actual widgets are `strength-metrics` and `weight`.

## Data contract (core)

```ts
export type Gender = 'M' | 'F' | 'other';
export type UnitsPreference = 'metric' | 'imperial';
export type LogMode = 'week' | 'day';

export enum DistributionDays {
    WEEK = 'week_log',
    DAY = 'day_log',
}
export function distributionToLogMode(v: DistributionDays): LogMode;

export interface ProfileUser {
    id: string;
    userId: string;
    gender: Gender;
    birthDate: string; // LocalDate
    heightCm: number;
    weightKg: number;
    bodyFatPct?: number;
    distributionDays: DistributionDays;
    unitsPreference: UnitsPreference;
    createdAt: string;
    updatedAt: string;
    goal?: Goal | null;
    healthConstraints?: HealthConstraint | null;
    schedule?: Schedule | null;
    trainingPreferences?: TrainingPreference | null;
    resources?: Resource | null;
    strengthMetrics: StrengthMetric[];
    weightLogs: WeightLog[];
}

// API
export interface UserProfileContextAPI {
    profile?: ProfileUserAPI | null;
    goal?;
    healthConstraints?;
    schedule?;
    trainingPreferences?;
    resources?;
    strengthMetrics?;
    weightLogs?;
}
```

## Files

```
src/app/core/services/user/user-profile.service.ts   (+ spec — broken, imports nonexistent './user-profile')
src/app/core/services/user/user-profile.domain.ts
src/app/core/services/user/user-profile.state.ts
src/app/core/services/user/api/user-profile-api.service.ts
src/app/core/services/user/api/user-profile-api.get.service.ts
src/app/core/services/user/api/user-profile-api.set.service.ts
src/app/core/apollo/user-profile.queries.ts
src/app/shared/utils/profile.types.ts
src/app/shared/wrappers/profile.wrapper.ts
src/app/shared/interfaces/user-profile.interface.ts  (empty file)
src/app/pages/user/  (user.ts, user.html, profile/profile.ts, profile.html)
src/app/shared/components/widgets/users/profile/  (user-profile, weight, strength-metrics, resource, training-performance, health-constraints, schedule, goals)
src/app/shared/components/widgets/coach/form-user-profile/ | show-user-profile-data/
src/app/pages/my-week/activation-selector.ts  (reads distributionDays default — NOT plans.ts)
```

**Note:** `plans.ts` does NOT read `distributionDays` as previously spec'd. The default-log-mode logic lives in `my-week/activation-selector.ts`.

## Extra features (not in original spec)

- **Profile reset/delete:** `resetMyProfile()` with confirmation dialog, calls `removeMyProfileData` GraphQL mutation, then refetches profile. UI in `profile.html` with success/error notifications.
- **Favorites:** `toggleFavoriteExercise`, `toggleFavoriteRoutine`, `toggleFavoriteRoutineDay` — optimistic toggle with API sync. Consumed by `plans.ts` and `exercise-selector`.
- **Profile visibility form:** Checkboxes to show/hide profile sections in the UI.
- **`completeBasicSetup`:** Coach flow that creates profile + goals + schedule in one call with `failedSteps` reporting.

## Dead code

- **~12 unused API methods** in `user-profile-api.service.ts` / `get.service.ts` / `set.service.ts`: `getAllUserProfiles`, `getMyProfile`, `getUserGoals`, `getUserHealthConstraints`, `getUserSchedule`, `getUserTrainingPreference`, `getUserResource`, `getUserStrengthMetrics`, `getUserWeightLogs`, `createUserProfile`, `removeUserProfile`, `removeUserStrengthMetric`. The domain layer only calls `getUserProfileContext` plus the update/create/toggle/reset methods.
- **`ShowUserProfileData`** imports `UserProfile` from the user-profile widget but never uses it.
- **Vestigial UI state** in `profile.ts`: `avatarUrl`, `showAvatarDialog`, `openAvatarUpload`, `showProfileModal`, `openProfileModal`, `editProfile` — never referenced in template (commented-out buttons).

## Tests

- **TEST-001** ~~`initUserProfile` maps `UserProfileContextAPI` → `ProfileUser`.~~ **NOT IMPLEMENTED.**
- **TEST-002** ~~`updateUserProfile` splits into sub-record calls and aggregates `failedSteps`.~~ **NOT IMPLEMENTED** (method doesn't exist as described).
- **TEST-003** ~~`updateProfile` merges the result into state.~~ **NOT IMPLEMENTED.**
- **TEST-004** ~~`distributionToLogMode` maps WEEK→`week`, DAY→`day`.~~ **NOT IMPLEMENTED.**
- **TEST-005** ~~Logout clears the profile state.~~ **NOT IMPLEMENTED** (and the behavior itself is broken — see FR-007).

**Note:** The existing `user-profile.spec.ts` is broken — it imports `UserProfile` from `./user-profile` which does not exist (the real export is `UserProfileService` from `./user-profile.service`). All other widget spec files are trivial "should create" smoke tests.

## Acceptance Criteria

- **AC-001** The user can see/edit their profile on `/user/profile`. ✅
- **AC-002** `DistributionDays` sets the default mode in `/my-week` unless a tracking container is active (BR-010). ✅
- **AC-003** ~~A failing sub-record update reports which steps failed without blocking the rest.~~ ⚠️ Only applies to `completeBasicSetup` (coach flow). Independent per-section methods don't aggregate failures.
