# WaveFit — Domain Glossary

Canonical vocabulary for the WaveFit domain. All documentation should use these terms consistently to avoid multiple names for the same concept.

---

## Terms

| Term                             | Definition                                                                                                                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | --- | --- | --- | ---------------------------------- |
| **Exercise**                     | A base movement in the library. Fields: `id?`, `name`, `description?`, `category`, `usesWeight`, `isFavorite?`.                                                                                                            |
| **ExerciseCategory**             | Muscle-group classification: `CHEST`, `BACK`, `LEGS`, `LEGS_FRONT`, `LEGS_POSTERIOR`, `BICEPS`, `TRICEPS`, `SHOULDERS`, `CORE`, `CARDIO`. Stored lowercase in the domain enum; the API returns UPPERCASE.                  |
| **RoutineDay**                   | A day of routine (template). Has `title`, `type?` (categories), optional `exercises`, `kind` (`REST` \| `WORKOUT`), plan association, `isFavorite?`.                                                                       |
| **RoutineDayVM**                 | UI variant of `RoutineDay`: adds `expanded` and a `day: DayIndex` (1–7).                                                                                                                                                   |
| **RoutinePlan**                  | Weekly plan (template) composed of routine days. Fields: `name`, `description`, `weekly_distribution`, `routineDays[]`, `createdBy?`, `isAiGenerated?`.                                                                    |
| **DayIndex**                     | `1                                                                                                                                                                                                                         | 2   | 3   | 4   | 5   | 6   | 7`, position of a day in the week. |
| **KindType**                     | `'REST' \| 'WORKOUT'` — whether a routine day is a workout or rest.                                                                                                                                                        |
| **Tracking**                     | The act / record of executing training. Generic term for week-log or day-log.                                                                                                                                              |
| **TrackingVM**                   | Week-log container (TRACKING branch, weekly). Fields: `id`, `userId`, `startDate`/`endDate` (`LocalDate`), `workouts?` (`WorkoutSessionVM[]`), `planId?`, `notes?`, `completed`.                                           |
| **TrackingVMS**                  | Variant of `TrackingVM` that also exposes `days: WeekLogDayVM[]` (WeekLog shape from the API).                                                                                                                             |
| **WeekLogDayVM**                 | A single day inside a week-log: `order`, `date`, `isRest`, `workoutSessionId?`, `exercises[]`, `extraSessionIds[]`, `status`.                                                                                              |
| **DayLogVM**                     | Day-log container (TRACKING branch, single day). **Flat model**: `workoutSessionId?`, `exercises[]`, `extraSessionIds[]`, `status`, `active`, `date`, `completed`, `notes?`.                                               |
| **ActiveTracking**               | Startup truth: `{ hasActive, type: 'WEEK_LOG' \| 'DAY_LOG', week?, day? }`. Determines which container is active.                                                                                                          |
| **WorkoutSession**               | The active training day record. Fields: `id?`, `date`, `exercises[]`, `extras?`, `status`, `notes?`, `planId?`. Belongs to a week-log or a day-log (global WS for day-log).                                                |
| **StatusWorkoutSession**         | `'not_started' \| 'complete' \| 'rest' \| 'edited'` (enum `StatusWorkoutSessionEnum`).                                                                                                                                     |
| **DayStatusVM**                  | `'pending' \| 'complete' \| 'skipped'` — status of a week-log day.                                                                                                                                                         |
| **ExercisePerformance**          | Performance of an exercise inside a workout/day: `exerciseId`, `name`, `series`, `category`, `sets: { reps, weights? }[]`, `usesWeight`, `notes?`.                                                                         |
| **LocalDate**                    | `"yyyy-MM-dd"` string representation of a calendar date. Never a JS `Date`.                                                                                                                                                |
| **ExtraSession**                 | An additional activity beyond the planned workout (CARDIO, STRENGTH, SPORT, MIND_BODY). Fields: `id`, `userId`, `workoutSessionId`, `category`, `discipline`, `date`, `duration`, `intensityLevel`, `calories?`, `notes?`. |
| **ExtraSessionDisciplineConfig** | Catalog entry for an extra-session discipline: `key`, `label`, `category`, `met` (used to estimate calories).                                                                                                              |
| **LogMode**                      | `'week' \| 'day'` — the UI logging mode chosen/active in `/my-week` and `/my-day`.                                                                                                                                         |
| **DistributionDays**             | Profile preference (`'week_log' \| 'day_log'`) used only as the **default** initial mode.                                                                                                                                  |
| **UserProfile / ProfileUser**    | Profile of a user: gender, birth date, height, weight, body fat, `distributionDays`, `unitsPreference`, goal, health constraints, schedule, training preferences, resources, strength metrics, weight logs.                |
| **Goal**                         | Fitness goal of the user (e.g., `fat_loss`, `muscle_gain`, `strength`, `endurance`, `maintenance`, `recomp`).                                                                                                              |
| **TrainingPlan**                 | AI-generated training plan (Coach): title, focus, duration weeks, days-per-week, status, snapshot of AI output.                                                                                                            |
| **AiPlanResponse**               | Raw AI-generated plan payload: `title`, `focus`, `durationWeeks`, `daysPerWeek`, `days[]` (each with `order`, `isRest`, `focus`, `exercises[]`).                                                                           |
| **PlanConfirmationAction**       | Action taken when the user confirms an AI plan: e.g., `CREATE_WEEK_LOG`, `CREATE_ROUTINE_PLAN`, `ADAPT_ACTIVE_WEEK`.                                                                                                       |
| **Token**                        | `{ access_token, userId }` — legacy token shape.                                                                                                                                                                           |
| **User**                         | Authenticated identity: `id`, `name`, `email`, `avatar`, `role`.                                                                                                                                                           |

---

## Terms that are legacy / deprecated

| Term                         | Status     | Replacement                                                                   |
| ---------------------------- | ---------- | ----------------------------------------------------------------------------- |
| **UserService**              | Removed    | `UserProfileService`                                                          |
| **ExtraActivityVM**          | Deprecated | `ExtraSession`                                                                |
| **WorkoutStateService only** | Superseded | `WorkoutStore` contract (week: `WorkoutStateService`, day: `DayWorkoutStore`) |
| **my-day / day-log**         | Both valid | `DayLogVM` container; page `/my-day`                                          |

---

## Naming law (must)

- A **week-log** is the `TrackingVM`/`WeekLog` container. A **day-log** is the `DayLogVM` container.
- "Tracking" alone refers to the generic tracking branch — prefer **week-log** / **day-log** when the container matters.
- Dates are always **LocalDate**; never call them "Date".
- Sessions of a tracking day are **WorkoutSession**; performances within a session are **ExercisePerformance**.
