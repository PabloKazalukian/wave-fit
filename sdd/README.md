# Specs — Index

This directory contains the **feature-level contracts** of the WaveFit frontend.

## Authority

> **The current Spec and the current Code are the authoritative sources for implemented behavior.**

Specs describe **what a feature must do**, not only implementation notes. They are the first artifact to read before planning, implementing, or changing a feature (see the [Engineering Charter](../documents/engineering/charter.md)).

## Required top-level structure

Every spec uses this exact structure:

```md
# [Feature Name]

## Context

## Requirements

## Constraints

## Architecture

## Files

## Tests

## Acceptance Criteria
```

## Requirement identifiers

Use explicit, stable identifiers:

| Prefix     | Meaning                    |
| ---------- | -------------------------- |
| `FR-xxx`   | Functional requirement     |
| `BR-xxx`   | Business/domain rule       |
| `NFR-xxx`  | Non-functional requirement |
| `TEST-xxx` | Test scenario              |
| `AC-xxx`   | Acceptance criterion       |

- Cross-feature domain rules `BR-0xx` are defined in [Domain Business Rules](../documents/domain/business-rules.md) and referenced (not duplicated).
- Stable engineering rules live in [Engineering Documentation](../documents/engineering/README.md).
- Data contracts shared by more than one feature are embedded in the owning spec and referenced from others.

## Specs

| Feature             | Spec                                         | Routes                                                 |
| ------------------- | -------------------------------------------- | ------------------------------------------------------ |
| Authentication      | [auth](auth/spec.md)                         | `/auth/*`                                              |
| Exercises           | [exercises](exercises/spec.md)               | `/exercises`                                           |
| Routines            | [routines](routines/spec.md)                 | `/routines/show/:id`                                   |
| Plans (template)    | [plans](plans/spec.md)                       | `/plans`, `/plans/create`                              |
| Tracking (week-log) | [tracking](tracking/spec.md)                 | `/my-week`, `/my-week/success`, `/user/trackings*`     |
| Day-log             | [day-log](day-log/spec.md)                   | `/my-day`, `/my-day/success`, `/tracking-day/show/:id` |
| Extra sessions      | [extra-session](extra-session/spec.md)       | (dialogs/widgets)                                      |
| Coach AI            | [coach](coach/spec.md)                       | `/coach`                                               |
| Stats dashboard     | [stats](stats/spec.md)                       | `/stats`                                               |
| User profile        | [user-profile](user-profile/spec.md)         | `/user`, `/user/profile`                               |
| Training history    | [training-history](training-history/spec.md) | `/user/history`                                        |
| PWA / offline       | [pwa-offline](pwa-offline/spec.md)           | (whole app)                                            |

---

_Historical implementation plans and old documentation are archived in [../documents/legacy/README.md](../documents/legacy/README.md). UI design reference: [../documents/design/ui-conventions.md](../documents/design/ui-conventions.md)._
