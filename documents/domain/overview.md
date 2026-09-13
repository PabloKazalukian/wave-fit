# WaveFit — Domain Overview

This document describes the WaveFit domain at a **stable conceptual level**. It is not a feature specification; feature contracts live in the [Specs](../specs/README.md). The canonical vocabulary lives in the [Glossary](glossary.md).

---

## 1. The Product

WaveFit is a personal fitness companion. A user:

1. maintains a **library of exercises** (name, category, whether it uses weight, favorite flag);
2. builds **routines** — daily routine days (`RoutineDay`) grouped into weekly **plans** (`RoutinePlan`) — the _template_;
3. registers real training sessions — **week-log** (`TrackingVM`) or **day-log** (`DayLogVM`) — the _tracking_;
4. logs **extra sessions** (cardio, strength, sport, mind-body) beyond the planned workout;
5. tracks **progress over time** (histories, weekly stats, volume, performance);
6. optionally uses a **Coach AI** to generate personalized training plans;
7. configures a **user profile** (goals, schedule, health constraints, training preferences, metrics) that informs plan generation and defaults.

---

## 2. Two Branches of the Data Model

The domain is organized around two complementary branches:

| Branch       | Container                              | Element (active state) | What it represents                    |
| ------------ | -------------------------------------- | ---------------------- | ------------------------------------- |
| **TEMPLATE** | `RoutinePlan`                          | `RoutineDay`           | Training _planned_ on paper           |
| **TRACKING** | `TrackingVM` (week) / `DayLogVM` (day) | `WorkoutSession`       | Training _executed_ in the real world |

- The **template** describes what a training week should look like (days with exercises, REST/WORKOUT kind).
- The **tracking** records what was actually done: exercises, sets, reps, weights, rest days, and extra sessions.
- A tracking container may be created standalone or seeded from a plan/routine day.

---

## 3. Active Container

Exactly **one** tracking container can be active per user at a time.

`ActiveTracking { hasActive, type: 'WEEK_LOG' | 'DAY_LOG', week?, day? }` is the **single source of truth** at startup:

- If a week-log is active → the user trains on `/my-week`.
- If a day-log is active → the user trains on `/my-day`.
- If none is active → the user chooses a mode (week or day); the `DistributionDays` profile preference only sets the **initial default**, never blocks the choice.

---

## 4. Core Flow

```text
Template
  RoutinePlan ──┐ 1..7 days
  RoutineDay ───┼──┐ exercise library
                │  │
                ▼  ▼
Tracking (execution)
  TrackingVM (week) or DayLogVM (day)
    └─ WorkoutSession (the active day)
          ├─ ExercisePerformance (series → sets of reps/weights)
          └─ ExtraSession (additional activity, belongs to a WorkoutSession)
```

---

## 5. Domain Data Conventions

- **`LocalDate`**: all calendar dates in VMs are `"yyyy-MM-dd"` strings (never JS `Date`).
- **Time zone**: local dates are computed with the user's timezone (e.g., `America/Argentina/Buenos_Aires`) when going to/from the API.
- **Exercise category**: the API returns categories in UPPERCASE (`CHEST`); the domain enum is lowercase (`chest`) — normalize on consumption.
- **Favorites**: exercises, routines, and routine days can be flagged as favorites (local toggle, synced to the API).

---

## 6. Users, Auth and Roles

- Authentication via **Google OAuth (PKCE)** or **email/password**; JWT delivered in an HttpOnly cookie.
- Every domain service that needs the current user reacts to `AuthService.user$`.
- A `UserProfile` exists per user (body metrics, goal, schedule, health constraints, training preferences, resources, strength metrics, weight logs). "UserService" no longer exists — profile handling lives in `UserProfileService`.

---

## 7. Offline Semantics

- The application is **PWA-first**: reads fall back to cache, writes are optimistic into IndexedDB and are queued (`SyncQueueService`) when offline, then replayed when connectivity returns.
- Backend is the eventual source of truth; local IndexedDB is the local source of truth.

See the [Business Rules](business-rules.md) for the enforceable cross-feature rules, and the [Glossary](glossary.md) for canonical terms.
