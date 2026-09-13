# WaveFit — Engineering Charter

This document defines the **stable engineering principles and development methodology** of the WaveFit frontend repository.

It is not feature-specific. Feature behavior lives in the relevant [Specs](../specs/README.md). Implementation history lives in [Plans](../plans/README.md). Technical decisions live in [ADRs](../decisions/README.md).

---

## 1. Development Model: Spec-Anchored Development

This project follows a **Spec-Anchored Software Development** model.

> **The current Spec and the current Code are the authoritative sources for the implemented behavior.**

Documentation explains the architecture, the domain, the engineering rules, the decisions, and the validated system state.

Plans are temporary execution artifacts and are **never authoritative**.

### Lifecycle for new features

```text
Spec
  ↓
Clarification
  ↓
Plan
  ↓
Tasks
  ↓
Implementation
  ↓
Validation
  ↓
Documentation Update
  ↓
Completed
```

### Lifecycle for changes to existing functionality

```text
Requested Change
  ↓
Update Spec
  ↓
Clarification
  ↓
Plan
  ↓
Tasks
  ↓
Tests
  ↓
Implementation
  ↓
Validation
  ↓
Documentation Update
```

Never make a behavioral change directly in code while leaving the Spec unchanged.

---

## 2. Source-of-Truth Hierarchy

```text
1. Code + current Spec
2. Stable engineering/domain documentation
3. ADRs
4. Plans
5. Historical artifacts
```

### During implementation

The relevant **Spec + Code** are authoritative.

### Plans

Plans describe **how a change was intended to be implemented**. They are:

- implementation guidance;
- task organization;
- traceability;
- historical review.

Once a plan is completed, it becomes a **historical / non-authoritative** artifact. Never use an old plan to determine the current behavior of the system.

### Documentation

Stable documentation must describe the **current validated state** of the project. Update the relevant stable documentation as the final step after a feature is completed and validated. Do not use documentation to invent behavior unsupported by the Spec and the Code.

---

## 3. Planning Is Always Required

Regardless of how work is requested, planning is mandatory:

```text
Read AGENTS.md
  ↓
Read relevant engineering/domain documentation
  ↓
Read relevant Spec
  ↓
Clarify if necessary
  ↓
Create/revise Plan
  ↓
Create Tasks
  ↓
Implement one task
  ↓
Tests first
  ↓
Validate
  ↓
Next task
```

Do not skip planning merely because the user did not explicitly request a plan.

---

## 4. One Task at a Time

Implementation happens **one task at a time**. Do not implement an entire plan in a single uncontrolled operation.

```text
Task
  ↓
Write/update tests
  ↓
Implement
  ↓
Run relevant validation
  ↓
Confirm task completion
```

---

## 5. Test-First Policy

- Write or update tests **before** implementing each task.
- Unit tests use **Karma + Jasmine** (`*.spec.ts`); run with `npm test` (`ng test`).
- End-to-end tests use **Playwright** (`/e2e`, `playwright.config.ts`).
- A task is only complete when its relevant validation passes.

See [`testing.md`](testing.md) for the full testing strategy.

---

## 6. Task Execution Rules

- One task at a time (see above).
- Validate after each task before proceeding to the next.
- If implementation reveals that the current Spec is wrong or incomplete, do **not** silently modify the code. Follow the change rule below.

---

## 7. Documentation Rules

- Stable documentation must describe the **current validated state**.
- Documentation updates happen **after implementation and validation**, as the final step.
- There is **one canonical location** for each category of knowledge.
- Do not create empty placeholder documents or duplicate documents to preserve old names.

---

## 8. Change Rule

If the current Spec is discovered to be wrong or incomplete:

```text
Identify discrepancy
  ↓
Update Spec
  ↓
Clarify if necessary
  ↓
Update Plan
  ↓
Update Tasks
  ↓
Update Tests
  ↓
Update Code
  ↓
Validate
  ↓
Update stable documentation
```

The Spec must remain aligned with the intended behavior.

---

## 9. Language Conventions

- **All engineering artifacts are written in English**: specs, plans, architecture documentation, testing documentation, ADRs, domain documentation, coding standards, git/CI documentation, source-code identifiers, API contracts, and configuration identifiers.
- Developer-facing AI responses may remain in the language chosen by the developer (e.g., Spanish).
- **User-facing product content** may use the language required by the product. Example: the Spanish exercise catalog keeps its Spanish names/descriptions because it is user-facing domain data.
- Do not translate existing user-facing product data merely to satisfy documentation language rules.

---

## 10. Git Conventions

- Large features: branch `feature/<feature-name>` (e.g., `feature/sdd`).
- Bug fixes: branch `fix/<bug-name>`.
- Keep `main` deployable at all times.
- Full rules in [`git-workflow.md`](git-workflow.md).

---

## 11. General Engineering Principles

- **Architecture by complexity**: dumb components render only; facades coordinate views; domain services hold business logic; API/services call GraphQL; storage services persist locally; state services hold reactive state.
- **Standalone Angular components** (no `NgModules`); signals and `BehaviorSubject` for reactive state.
- **Semantic HTML** in templates (`<section>`, `<header>`, `<nav>`, `<ul>/<li>`, hierarchical headings).
- **Wrappers** transform data between layers (API ↔ VM ↔ Send).
- Follow the project's [coding standards](coding-standards.md) and [UI design guide](../design/UI-Conventions.md).
- Do not introduce gratuitous dependencies or abstractions.

---

## 12. Change Management

- Every behavioral change flows through the Spec first.
- Every completed change ends with a documentation update.
- No behavioral change is shipped with an untouched Spec.
