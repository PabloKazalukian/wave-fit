# WaveFit — Documentation (documents/)

Source-of-truth documentation for the WaveFit frontend. Written in English and **spec-anchored**: the current Spec (in `sdd/`) + current Code are authoritative for implemented behavior.

> The former loose `documents/` tree is archived, for historical reference only, in [legacy/](legacy/README.md).

## Reading order

1. [Engineering Charter](engineering/charter.md) — methodology and source-of-truth rules.
2. [Engineering Architecture](engineering/architecture.md) — layers, folders, services, `WorkoutStore`, PWA.
3. [Specs](../sdd/README.md) — the **feature contract** for whatever you touch.
4. [Domain](domain/README.md) — glossary and cross-feature business rules.
5. [UI Conventions](design/ui-conventions.md) — before any template/UI change.

## Structure

| Folder                                | Content                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| [engineering/](engineering/README.md) | stable engineering rules: charter, architecture, coding standards, testing, git, CI/CD, PWA |
| [domain/](domain/README.md)           | domain model, canonical glossary, cross-feature business rules                              |
| [decisions/](decisions/README.md)     | Architecture Decision Records (ADRs)                                                        |
| [design/](design/ui-conventions.md)   | UI/UX conventions (colors, spacing, typography, buttons)                                    |
| [plans/](plans/README.md)             | implementation plans (historical, non-authoritative)                                        |
| [legacy/](legacy/README.md)           | archived historical documentation (former `documents/` tree)                                |
| [../sdd/](../sdd/README.md)           | **feature Specs** (`sdd/<feature>/spec.md`)                                                 |
