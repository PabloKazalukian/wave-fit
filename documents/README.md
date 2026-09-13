# WaveFit — Documentation (docs/)

Source-of-truth documentation for the WaveFit frontend. Written in English and **spec-anchored**: the current Spec + current Code are authoritative for implemented behavior.

> This tree (English, continuously updated) replaces the former `documents/` tree. The old docs are archived, for historical reference only, in [legacy/](legacy/README.md).

## Reading order

1. [Engineering Charter](engineering/charter.md) — methodology and source-of-truth rules.
2. [Engineering Architecture](engineering/architecture.md) — layers, folders, services, `WorkoutStore`, PWA.
3. [Specs](specs/README.md) — the **feature contract** for whatever you touch.
4. [Domain](domain/README.md) — glossary and cross-feature business rules.
5. [UI Conventions](design/ui-conventions.md) — before any template/UI change.

## Structure

| Folder                                | Content                                                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [engineering/](engineering/README.md) | stable engineering rules: charter, architecture, coding standards, testing, git, CI/CD, PWA           |
| [domain/](domain/README.md)           | domain model, canonical glossary, cross-feature business rules                                        |
| [specs/](specs/README.md)             | per-feature contracts (Context/Requirements/Constraints/Architecture/Files/Tests/Acceptance Criteria) |
| [design/](design/ui-conventions.md)   | UI/UX conventions (colors, spacing, typography, buttons)                                              |
| [legacy/](legacy/README.md)           | archived historical documentation (former `documents/` tree)                                          |
