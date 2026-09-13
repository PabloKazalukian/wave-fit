# Legacy Archive

Archived documentation from the former `documents/` tree. These files are **historical**: they were superseded by the English docs in [../README.md](../README.md) and are kept only for reference/traceability. Do not use them as the current source of truth.

## Archive map

| Legacy path                | Superseded by                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `components/`              | [Specs](../../sdd/README.md) + [architecture.md](../engineering/architecture.md) + `shared/components/widgets` |
| `services/`                | [Specs](../../sdd/README.md) + [architecture.md](../engineering/architecture.md) (services/index.md mapping)   |
| `workflows/`               | Domain rules [business-rules.md](../domain/business-rules.md) + tracking/day-log specs                         |
| `pwa/`                     | [pwa.md](../engineering/pwa.md) + [pwa-offline spec](../../sdd/pwa-offline/spec.md)                            |
| `plans/`                   | Spec history (`implementation-plan-day.md` → [day-log spec](../../sdd/day-log/spec.md))                        |
| `design/UI-Conventions.md` | [../design/ui-conventions.md](../design/ui-conventions.md) (translated, live)                                  |

> Removed during migration: `documents/workflows/readm.md` (a personal GitHub profile, unrelated to the project) and root `CONTRACT.md` (content fully distributed into the specs and `coding-standards.md`).

## Contents by folder

- **components/** — old component documentation (Coach, MyWeek, RoutinePlan, TrainingHistory) and their index.
- **services/** — old service documentation (AuthenticationAndApollo, Coach, Exercises, ExtraSession, PlanTracking, Routines, UserProfile, WorkoutState) and their index.
- **workflows/** — flow diagrams (routines/tracking), resume-week workflow, issue/service-thread notes, semantic-HTML note (now §6.1 in AGENTS.md and `coding-standards.md`).
- **pwa/** — offline PWA design plans and documentation.
- **plans/** — historical implementation plans (e.g., `implementation-plan-day.md`, `actualizacion-documentacion.md`).

All legacy content was written in Spanish; the active docs tree ([documents/](../README.md)) is in English.
