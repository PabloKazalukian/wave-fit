# User Profile

## Context

The user profile stores body data, preferences, and longitudinal entries (strength metrics, weight logs, weekly goals). `UserProfileService` is the **medium-complexity** pattern: Domain + API + State. The profile feeds other features: `DistributionDays` provides the default logging mode, `unitsPreference`/`weightKg` drive weekly stats, and coach uses it as context.

## Requirements

### FR: Functionality

- **FR-001** `/user` and `/user/profile` expose the profile (read and edit).
- **FR-002** `UserProfileService` auto-initializes when a user authenticates: on auth change it calls `initUserProfile` and stores the result in the state.
- **FR-003** `fetchUserProfile()` and `initUserProfile()` load profile + sub-records and map them via `wrapperProfileUserToDomain(api)`.
- **FR-004** `updateUserProfile(input, failedSteps)` splits the update across sub-records (goal, healthConstraints, schedule, trainingPreferences, resources, strengthMetrics, weightLogs) and returns `{ profile, failedSteps }`; a failed step does not block the rest.
- **FR-005** `updateProfile(input)` merges the result into the current state (`{ ...current, ...result }`).
- **FR-006** `DistributionDays` (`week_log`/`day_log`) is exposed; `distributionToLogMode` maps it to `LogMode` (`week`/`day`) — see day-log BR-010 (default only, not a lock).
- **FR-007** Clearing the user (`logout`) resets the profile state to `null`.
- **FR-008** Profile data is reused by Coach (`FormUserProfile`/`ShowUserProfileData` widgets) and weekly stats (weight in kg).

### BR

- `BR-010` (DistributionDays default, not a lock) is owned here.
- `BR-003` (`birthDate` is `LocalDate`) applies.

### NFR

- **NFR-001** Profile loads once per session via state cache (`BehaviorSubject`).
- **NFR-002** Partial updates keep previously-failed steps retryable without blocking valid ones.

## Constraints

- `UserService` does **not** exist — this service replaced it.
- State is a plain `BehaviorSubject<ProfileUser | null>` (`UserProfileStateService`), not a signal store.
- Types live in `shared/utils/profile.types.ts` (not `user-profile.interface.ts`, which is intentionally empty).
- `birthDate` is a `LocalDate` string.

## Architecture

```
UserProfileService (core/services/user/user-profile.service.ts)          — facade
├── UserProfileDomainService (user-profile.domain.ts)                    — business logic
│     └── UserProfileApiService (api/user-profile-api.service.ts)        — GraphQL orchestration
│           ├── user-profile-api.get.service.ts   (getUserProfileContext)
│           └── user-profile-api.set.service.ts   (upsert/update per sub-record)
└── UserProfileStateService (user-profile.state.ts)                      — BehaviorSubject cache
```

Widgets: `shared/components/widgets/users/profile/user-profile`, `shared/components/widgets/users/profile/strength-table`, `shared/components/widgets/users/profile/weight-table`, plus coach `form-user-profile` / `show-user-profile-data`.

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
    goal?: Goal | null; // PrimaryGoal etc.
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
src/app/core/services/user/user-profile.service.ts   (+ spec)
src/app/core/services/user/user-profile.domain.ts
src/app/core/services/user/user-profile.state.ts
src/app/core/services/user/api/user-profile-api.service.ts
src/app/core/services/user/api/user-profile-api.get.service.ts
src/app/core/services/user/api/user-profile-api.set.service.ts
src/app/core/apollo/user-profile.queries.ts
src/app/shared/utils/profile.types.ts
src/app/shared/wrappers/profile.wrapper.ts
src/app/pages/user/  (user, profile/)
src/app/shared/components/widgets/users/profile/  (+ strength-table, weight-table)
src/app/shared/components/widgets/coach/form-user-profile/ | show-user-profile-data/
src/app/pages/plans/plans.ts                      (reads distributionDays default)
```

## Tests

- **TEST-001** `initUserProfile` maps `UserProfileContextAPI` → `ProfileUser`.
- **TEST-002** `updateUserProfile` splits into sub-record calls and aggregates `failedSteps`.
- **TEST-003** `updateProfile` merges the result into state.
- **TEST-004** `distributionToLogMode` maps WEEK→`week`, DAY→`day`.
- **TEST-005** Logout clears the profile state.

## Acceptance Criteria

- **AC-001** The user can see/edit their profile on `/user/profile`.
- **AC-002** `DistributionDays` sets the default mode in `/my-week` unless a tracking container is active (BR-010).
- **AC-003** A failing sub-record update reports which steps failed without blocking the rest.
