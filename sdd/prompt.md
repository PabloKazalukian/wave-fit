# SDD Documentation Architecture Migration

You are responsible for migrating the project's existing documentation into a consistent **Spec-Anchored Software Development methodology**.

This is a documentation architecture and governance migration.

Do not implement application features.
Do not modify application behavior.
Do not refactor source code unless strictly necessary to preserve documentation references or metadata.

Your task is to inspect the existing repository, understand the current documentation, identify duplication and contradictions, and reorganize the documentation according to the rules below.

---

# 1. Core Development Model

This project follows a **Spec-Anchored Development** model.

The fundamental principle is:

> **The current Spec and the current Code are the authoritative sources for implemented behavior.**

Documentation explains the architecture, domain, engineering rules, decisions, and completed system state.

Plans are temporary execution artifacts and are never authoritative.

The development lifecycle is:

```text
Engineering Charter
        ↓
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

For changes to existing functionality:

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

# 2. Important Source-of-Truth Rules

Use the following hierarchy:

```text
1. Code + current Spec
2. Stable engineering/domain documentation
3. ADRs
4. Plans
5. Historical artifacts
```

However, this hierarchy must be interpreted carefully.

### During implementation

The relevant:

```text
Spec + Code
```

are authoritative.

### Plans

Plans describe **how a change was intended to be implemented**.

They are not specifications.

They are not architectural documentation.

They are not sources of truth.

They exist primarily for:

- implementation guidance;
- task organization;
- traceability;
- historical review;
- understanding how a feature was implemented.

Once a plan is completed, it becomes a **historical/non-authoritative artifact**.

Never use an old plan to determine the current behavior of the system.

### Documentation

Stable documentation must describe the **current validated state** of the project.

When a feature is completed and validated, update the relevant stable documentation as the final step.

Do not use documentation to invent behavior that is not supported by the Spec and Code.

---

# 3. Language Rules

All project engineering artifacts must use **English**.

This includes:

- Specs
- Plans
- Architecture documentation
- Testing documentation
- Engineering documentation
- ADRs
- Domain documentation
- Coding standards
- Git documentation
- CI/CD documentation
- Technical terminology
- Source code
- Classes
- Interfaces
- Functions
- Variables
- Types
- Database structural identifiers
- API contracts
- Configuration identifiers

Developer-facing AI responses may remain in Spanish.

User-facing application content may use the language required by the product.

For example, if the application contains a Spanish exercise catalog, the exercise names/descriptions may remain Spanish because they are **user-facing domain data**.

Do not translate existing user-facing product data merely to satisfy this documentation rule.

---

# 4. First Step: Repository Inspection

Before modifying anything, inspect the repository thoroughly.

Identify:

- `AGENTS.md`
- `README.md`
- `docs/`
- existing Specs
- existing Plans
- architecture documents
- testing documents
- ADRs
- domain documentation
- development guides
- implementation notes
- feature documentation
- TODO documents
- status documents
- historical documents
- duplicated documentation
- conflicting documentation
- obsolete documentation
- references between documents

Do not assume that filenames correctly describe their purpose.

Determine the actual purpose and authority of each document from its contents.

Create an internal inventory before making changes.

Do not ask the developer to manually classify every document.

You are expected to make the classification decisions based on the rules in this document.

---

# 5. Target Documentation Structure

The target structure is:

```text
/
├── AGENTS.md
│
├── docs/
│   │
│   ├── engineering/
│   │   ├── charter.md
│   │   ├── architecture.md
│   │   ├── testing.md
│   │   ├── coding-standards.md
│   │   ├── git-workflow.md
│   │   └── ci-cd.md
│   │
│   ├── domain/
│   │   ├── overview.md
│   │   ├── glossary.md
│   │   └── business-rules.md
│   │
│   ├── decisions/
│   │   ├── README.md
│   │   └── ADR-*.md
│   │
│   ├── specs/
│   │   ├── README.md
│   │   └── <feature>/
│   │       └── spec.md
│   │
│   └── plans/
│       ├── README.md
│       └── <feature>/
│           └── plan.md
│
└── src/
```

Adapt the exact feature/domain directories to the actual project.

Do not create artificial documentation simply to fill every directory.

If a category genuinely does not exist yet, create the structural document only when it has a meaningful purpose.

---

# 6. Engineering Documentation

## `docs/engineering/charter.md`

This is the project's **Engineering Charter**.

It defines the stable engineering principles and development methodology.

It must include, where applicable:

- Spec-Anchored Development
- source-of-truth rules
- development lifecycle
- test-first policy
- task execution rules
- documentation rules
- change management rules
- language conventions
- branch conventions
- general engineering principles

The Charter must not contain feature-specific implementation details.

---

## `docs/engineering/architecture.md`

Contains the stable high-level architecture.

It should describe:

- architectural style
- major layers
- major modules/bounded contexts
- dependency direction
- frontend/backend boundaries
- infrastructure boundaries
- persistence boundaries
- communication mechanisms
- major architectural constraints

Do not put feature-specific implementation plans here.

Do not duplicate Specs here.

---

## `docs/engineering/testing.md`

Contains the project's stable testing strategy.

Include, where applicable:

- testing philosophy
- unit tests
- integration tests
- E2E tests
- test isolation
- fixtures
- mocks
- test naming
- coverage expectations
- test-first methodology
- CI quality gates
- validation rules

Feature-specific test scenarios belong in the relevant Spec.

---

## `docs/engineering/coding-standards.md`

Contains stable source-code conventions.

Examples:

- naming
- TypeScript conventions
- Angular conventions
- NestJS conventions
- error handling
- dependency injection
- RxJS conventions
- file organization
- imports
- type usage

Only document rules that actually apply to the project.

Do not invent standards merely for completeness.

---

## `docs/engineering/git-workflow.md`

Contains:

- branch strategy
- feature branches
- bug-fix branches
- commits
- pull requests
- merge strategy
- main branch rules

Large features should use:

```text
feature/<feature-name>
```

Bug fixes should use:

```text
fix/<bug-name>
```

Do not introduce another branching convention unless existing project requirements clearly require it.

---

## `docs/engineering/ci-cd.md`

Contains the stable CI/CD strategy and quality gates.

Where applicable, document:

```text
Lint
  ↓
Type Check
  ↓
Unit Tests
  ↓
Integration Tests
  ↓
E2E
  ↓
Build
  ↓
Deploy
```

Only document checks that actually exist or are explicitly established as project requirements.

Do not claim that CI/CD functionality exists if it does not.

---

# 7. Domain Documentation

## `docs/domain/overview.md`

Describe the domain at a stable conceptual level.

Do not turn this into a feature specification.

---

## `docs/domain/glossary.md`

Create a canonical vocabulary for important domain concepts.

Use a structure such as:

```md
| Term     | Definition |
| -------- | ---------- |
| Exercise | ...        |
| Workout  | ...        |
| Routine  | ...        |
```

Resolve inconsistent terminology where possible.

The glossary should prevent different documents from using multiple names for the same domain concept.

---

## `docs/domain/business-rules.md`

Contains stable domain/business rules that apply across multiple features.

Do not duplicate feature-specific requirements that belong inside Specs.

If a rule is only relevant to one feature, keep it in that feature's Spec.

---

# 8. Architecture Decision Records

Use:

```text
docs/decisions/
```

for important architectural or technical decisions.

An ADR should answer:

> **Why did we choose this?**

Examples:

- database selection
- authentication strategy
- GraphQL vs REST
- PWA strategy
- offline strategy
- architectural pattern
- infrastructure decision

Do not create ADRs for trivial implementation decisions.

Existing ADRs should be preserved when still relevant.

If an existing document contains decision history, migrate it into an ADR when appropriate rather than losing the historical reasoning.

---

# 9. Specs

Specs are feature-level contracts.

Each Spec must use this exact top-level structure:

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

The Spec should describe **what the feature must do**, not merely provide implementation notes.

Use explicit identifiers where useful:

```text
FR-001
BR-001
NFR-001
TEST-001
AC-001
```

Specs may contain implementation-relevant architecture and file information when necessary, but they must remain focused on the feature.

Do not duplicate the entire project architecture inside every Spec.

Reference stable architecture documentation instead.

---

# 10. Plans

Create:

```text
docs/plans/
```

for implementation plans.

Each plan belongs to a feature/change:

```text
docs/plans/
└── <feature>/
    └── plan.md
```

A Plan should describe:

- implementation strategy
- sequence of work
- dependencies
- tasks
- expected files
- testing strategy
- migration steps
- validation steps

The Plan must explicitly state that it is:

```text
Status: Historical / Non-Authoritative
```

after completion.

Plans are temporary execution artifacts.

They must never become the source of truth.

A completed plan must remain useful for retrospective analysis but must not be consulted as the current behavioral contract.

---

# 11. Planning Is Always Required

Regardless of how the developer invokes the AI, **planning is mandatory**.

If the developer asks:

> "Implement X"

the workflow must still be:

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

The AI must not skip planning merely because the user did not explicitly request "plan mode".

---

# 12. One Task at a Time

Implementation must happen one task at a time.

Do not implement an entire plan in one uncontrolled operation.

For each task:

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

Then proceed to the next task.

---

# 13. Documentation Update Rule

Documentation updates happen **after implementation and validation** for completed features.

The order is:

```text
Spec
 ↓
Plan
 ↓
Tasks
 ↓
Tests
 ↓
Code
 ↓
Validation
 ↓
Stable Documentation Update
```

The final documentation update must describe the validated current state.

Do not update stable architecture/domain/testing documentation prematurely based only on an unfinished plan.

---

# 14. Change Rule

If implementation reveals that the current Spec is wrong or incomplete:

DO NOT silently modify the code to accommodate an undocumented requirement.

Instead:

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

# 15. Documentation Consolidation Rules

During migration, actively search for:

- duplicated information
- contradictory information
- obsolete information
- status documents that are no longer reliable
- multiple architecture documents
- multiple testing documents
- duplicated feature descriptions
- implementation notes pretending to be specifications
- plans being used as specifications
- README content that belongs in engineering documentation
- temporary TODO files
- completed task lists being treated as current state
- documents describing historical architecture as if it were current architecture

For each document, decide whether to:

```text
KEEP
MOVE
MERGE
REWRITE
RENAME
ARCHIVE
DELETE
```

Do not preserve duplication merely because the information already exists in multiple files.

There should be one clear canonical location for each category of knowledge.

---

# 16. Handling Contradictions

When two documents disagree:

1. Inspect the current code.
2. Inspect the relevant Spec.
3. Determine which behavior is actually current.
4. Preserve important historical context where appropriate.
5. Consolidate the current truth into the correct canonical document.
6. Remove or rewrite contradictory documentation.

Do not blindly choose the newest filename.

Do not blindly choose the newest modification date.

Do not assume a document named `final`, `latest`, `current`, or `updated` is authoritative.

---

# 17. Do Not Lose Historical Information

When consolidating documentation, do not destroy meaningful historical decisions.

For example:

```text
Old architecture document
        ↓
Current architecture
        +
Historical decision
        ↓
architecture.md
+
ADR
```

Use ADRs for historical reasoning that remains valuable.

Use Plans for implementation history.

Use Specs for feature contracts.

Use engineering documentation for stable engineering rules.

Each piece of information should have one appropriate home.

---

# 18. AGENTS.md

Rewrite or update the root `AGENTS.md`.

It must act as the AI's entry point into the project.

It should tell the AI:

1. Read the Engineering Charter.
2. Read relevant engineering documentation.
3. Read relevant domain documentation.
4. Read relevant ADRs.
5. Identify the relevant Spec.
6. Always create/review a Plan before implementation.
7. Execute one task at a time.
8. Write tests before implementation.
9. Validate after each task.
10. Update stable documentation only after validation.
11. Never treat Plans as authoritative.
12. Treat Spec + Code as the authoritative implementation state.
13. Update the Spec before changing behavior when requirements change.
14. Follow English language rules for code and technical documentation.
15. Keep developer-facing communication in the language requested by the developer.

The AGENTS.md file should provide **navigation and rules**, not duplicate the entire project's documentation.

Reference the canonical documents instead.

---

# 19. README.md

Do not unnecessarily turn the root README into a documentation encyclopedia.

Keep it focused on:

- project purpose
- setup
- development
- basic usage
- links to important documentation

If the existing README contains extensive engineering rules that now belong in `docs/`, move those rules and leave references to the canonical documentation.

---

# 20. Migration Safety

Before deleting anything:

- inspect its contents;
- determine whether its information exists elsewhere;
- determine whether the information is obsolete;
- migrate valuable information to the appropriate canonical document;
- update references;
- verify no important information is lost.

Do not delete information simply because the filename looks old.

Do not create empty placeholder documents.

Do not create duplicate documents just to preserve old names.

---

# 21. Do Not Modify Application Behavior

This migration is primarily about documentation architecture.

Do not:

- change business logic;
- change APIs;
- change database schemas;
- rename source-code identifiers;
- refactor application architecture;
- change tests;
- change dependencies;
- change deployment configuration;

unless an existing documentation reference absolutely requires a non-functional correction.

If the existing code contradicts the documentation, document the discrepancy and resolve the documentation architecture without silently changing application behavior.

---

# 22. Final Validation

After the migration:

1. Verify the target documentation structure.
2. Verify `AGENTS.md`.
3. Verify that every retained document has a clear purpose.
4. Verify there are no obvious duplicate canonical documents.
5. Verify internal documentation links.
6. Verify Specs use the required structure.
7. Verify Plans are clearly non-authoritative.
8. Verify stable documentation reflects the current validated system where known.
9. Verify ADRs contain decisions rather than feature specifications.
10. Verify domain documentation does not duplicate Specs.
11. Verify engineering documentation does not duplicate feature documentation.
12. Verify no meaningful existing information was lost.
13. Verify the application source code was not behaviorally modified.
14. Provide a concise migration report.

The final report must include:

```text
## Documentation Migration Summary

### Created
- ...

### Moved
- ...

### Merged
- ...

### Rewritten
- ...

### Archived
- ...

### Deleted
- ...

### Important Decisions
- ...

### Remaining Ambiguities
- ...

### Source-of-Truth Model
- Spec + Code: authoritative current implementation state
- Stable documentation: current architectural/domain/engineering reference
- Plans: historical/non-authoritative
- ADRs: historical decision rationale
```

Do not claim that a document was deleted, migrated, or validated unless you actually performed and verified the operation.

---

# Final Principle

The goal is not to have more documentation.

The goal is to have **less ambiguity**.

Every important piece of project knowledge should have:

- one clear purpose;
- one canonical location;
- one defined authority level;
- a predictable relationship with Specs and Code.

The resulting system should make it possible for a new AI session to understand:

```text
What rules govern this project?
        ↓
Where is the architecture?
        ↓
Where is the domain vocabulary?
        ↓
Why were important decisions made?
        ↓
What does this feature require?
        ↓
How should it be implemented?
        ↓
What has already been implemented?
        ↓
What is historical and should NOT be treated as current truth?
```

Optimize for **clarity, traceability, low duplication, and predictable AI navigation**, not for the number of documents created.
