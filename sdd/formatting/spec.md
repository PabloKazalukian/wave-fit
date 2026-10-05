# Code Formatting & Style Gates

## Context

The WaveFit frontend formats its code with Prettier 3, but the repository has no
authoritative, portable definition of what "formatted" means, and the formatting
gate does not cover the whole repository. Three concrete defects were measured on
`main` (commit `468027a`):

**1. The line-ending policy is undefined, so a fresh Windows checkout fails the
check on essentially every file.**

The repository has no `.gitattributes` and the local Git configuration sets
`core.autocrlf=true`. Git therefore stores LF in every blob but checks files out
with CRLF on Windows, while Prettier 3 defaults to `endOfLine: "lf"`. Measured on
a fresh clone of `main` in a clean directory: `git ls-files --eol` reports **619**
tracked files checked out as CRLF, and `npx prettier --check .` reports **604**
failing files — the remainder have no Prettier parser. The same tree passes on
Linux and in CI, which checks out LF. The gate is therefore not reproducible: it
is green on CI and universally red on a developer's Windows machine, for a reason
that has nothing to do with the code.

**2. Two Prettier configurations exist and the one that is written down is dead.**

The repository contains a `.prettierrc` declaring `printWidth: 140`,
`tabWidth: 4`, `htmlWhitespaceSensitivity: "ignore"`, and an HTML override with
`printWidth: 200`. The `prettier` key in `package.json` shadows it, because
Prettier resolves `package.json` first. Verified with
`npx prettier --find-config-path src/main.ts`, which returns `package.json`.
The effective configuration is `printWidth: 100`, `singleQuote: true`, and an
Angular parser override for HTML.

Worse, the effective indentation is **not** declared in either Prettier
configuration: `tabWidth: 4` for TypeScript/JSON/Markdown and `2` for
HTML/SCSS/CSS is supplied implicitly by `.editorconfig`, which Prettier 3 always
honours. Formatting therefore depends on a file that no Prettier configuration
mentions, and editing `.editorconfig` would silently reformat the repository.
The `printWidth: 200` and `htmlWhitespaceSensitivity: "ignore"` intent in
`.prettierrc` is not in effect, and adopting it is **not** part of this change:
it would rewrite 103 HTML files for no functional gain.

**3. The formatting gate covers a small fraction of the repository.**

`format:check` matches `src/**/*.{ts,js,html,scss,css}` plus five root tooling
configurations. It does not cover `e2e/`, `documents/`, `sdd/`, `public/`,
`.vscode/`, `.github/`, `.opencode/`, or the `tsconfig*.json` files. Measured with
`--end-of-line auto` to exclude the line-ending noise, the real formatting debt
on `main` is **25 files**:

| Category                   | Count | Cause                                                            |
| -------------------------- | ----: | ---------------------------------------------------------------- |
| Markdown                   |    11 | table column widths not normalized                               |
| JSON                       |     6 | 2-space indentation against the 4-space policy (`.vscode/`, `tsconfig*.json`) |
| JSON (`.opencode/`)        |     2 | 2-space indentation; excluded by FR-005                          |
| TypeScript (`e2e/`)        |     3 | 2-space indentation; `e2e/` was never formatted                  |
| YAML (`.github/workflows`) |     1 | not covered by the gate                                          |
| Web manifest               |     1 | not covered by the gate                                          |
| `.prettierrc`              |     1 | its own indentation                                              |

**Zero** of these are under `src/`: the application sources are already compliant
with the effective configuration. `AGENTS.md` nevertheless advertises
`npx prettier --check .` as a quality gate, and
`documents/engineering/ci-cd.md` documents the gate as
`printWidth: 140` scoped to `src/**` via `.prettierrc`. Both statements are false.
`sdd/ci-cd/spec.md` additionally states that Prettier is applied "only to the
application and tooling sources" and "not to documentation", which this Spec
supersedes (see FR-008).

This Spec defines the repository-wide formatting contract: one authoritative
configuration, an enforced line-ending policy, a gate that covers the whole
repository, and documentation that describes the effective behavior.

## Requirements

### FR-001 — Single authoritative Prettier configuration

The Prettier configuration is declared **exactly once**, in the `prettier` key of
`package.json`. The `.prettierrc` file is **deleted**, because a second
configuration file that Prettier never reads is misleading: it is what produced
the `printWidth: 140` claim in `documents/engineering/ci-cd.md`.

### FR-002 — Explicit and self-contained style options

The configuration states every option that affects output, so formatting no longer
depends on `.editorconfig` being interpreted by Prettier:

| Option            | Value        | Applies to                  |
| ----------------- | ------------ | --------------------------- |
| `printWidth`      | `100`        | all                         |
| `singleQuote`     | `true`       | all                         |
| `arrowParens`     | `"always"`   | all                         |
| `bracketSameLine` | `false`      | all                         |
| `endOfLine`       | `"lf"`       | all                         |
| `tabWidth`        | `4`          | all (default)               |
| `useTabs`         | `false`      | all                         |
| `proseWrap`       | `"preserve"` | all (Markdown)              |
| `parser`          | `"angular"`  | `*.html`                    |
| `tabWidth`        | `2`          | `*.html`, `*.scss`, `*.css` |

`tabWidth: 2` for HTML/SCSS/CSS reproduces the current behavior from
`.editorconfig` (`[*] indent_size = 4` plus the per-extension overrides) exactly.
`proseWrap: "preserve"` is declared explicitly because it is what keeps Markdown
prose unwrapped at `printWidth: 100`; relying on it implicitly would reintroduce
exactly the hidden dependency FR-002 removes.

Every remaining option (`semi`, `trailingComma`, `quoteProps`, `bracketSpacing`,
`jsxSingleQuote`, `htmlWhitespaceSensitivity`, `vueIndentScriptAndStyle`,
`singleAttributePerLine`, `embeddedLanguageFormatting`) keeps its **Prettier
3.8.3 default** and is not restated here. NFR-003 pins that version through
`package-lock.json`, so the effective configuration is reproducible.

The resulting formatting of every existing file is unchanged, except for the line
endings addressed by FR-003 and the 23 files addressed by FR-006.

### FR-003 — Enforced line-ending policy

Line endings are a **repository property**, not a platform accident:

- `.gitattributes` declares `* text=auto eol=lf`, so LF is checked out on every
  platform, including Windows.
- `endOfLine: "lf"` is declared explicitly in the Prettier configuration
  (FR-002), so the formatting gate and the repository agree.

Because the blobs already store LF, normalizing the working tree produces **no
content change in Git**: the line-ending correction is invisible in the commit.
Declaring `.gitattributes` is therefore only half of the fix — an existing
checkout keeps its CRLF working-tree files until they are renormalized
(`git add --renormalize .`, or a fresh checkout). The change therefore includes
that renormalization step, or the gate would stay red on every existing Windows
clone (AC-001). The repository moves from "green on CI, red everywhere on
Windows" to "green on every platform".

### FR-004 — Repository-wide formatting scope

`npm run format:check` covers the **whole repository**, which is equivalent to
`npx prettier --check .` and no longer a hand-maintained list of globs. It reaches
`e2e/`, `documents/`, `sdd/`, `public/`, `.vscode/`, `.github/`, `.opencode/plans/`,
and the `tsconfig*.json` files, none of which were previously checked. Paths
excluded by FR-005 are out of that scope.

### FR-005 — Generated, archived, and tool-managed files are excluded

`.prettierignore` excludes files that must not be reformatted because they are
generated, archived, or owned by a tool, so that neither a tool rewrite nor an
archived document can fail the gate:

- `package-lock.json` — generated by npm (matches at any level, which also covers
  `.opencode/package-lock.json`).
- `.opencode/package.json` — tool-managed agent package manifest.
- `documents/legacy/` — archived documentation; it must not be able to block a
  merge.
- `e2e/.auth/`, `playwright-report/`, `test-results/` — Playwright output.

`node_modules`, `dist`, and `coverage` remain ignored. Tracked editor
configuration under `.vscode/` and tracked agent plans under `.opencode/plans/`
are **not** excluded: both are versioned by the repository and must comply with
FR-002, exactly as `documents/plans/` does. Excluding the whole `.opencode/`
directory would leave a versioned Markdown file outside the gate and would make
the remediation in FR-006 unreachable.

### FR-006 — One-time debt remediation

The 23 files listed under Files are formatted as a single, dedicated change. That
count is the 25 measured violations minus the two `.opencode/package*.json` files
that FR-005 excludes, and `.prettierrc` is deleted rather than formatted. The
remediation is scoped to formatting only: no behavioral edit, no refactor, and no
content change under `src/` (which has zero real violations).

### FR-007 — The gate is not vacuous

`format:check` must be able to fail. A deliberately mis-formatted file must be
reported by the gate, proving the scope in FR-004 is real and the gate is not
silently checking nothing (see TEST-006).

### FR-008 — Documentation describes the effective configuration

Stable documentation must match the configuration resolved by Prettier:

- `documents/engineering/ci-cd.md` must state the real scope (whole repository
  minus FR-005) and the real `printWidth` (`100`), and must stop citing
  `.prettierrc`.
- `documents/engineering/coding-standards.md` must record the single
  configuration, the explicit `endOfLine: "lf"`, the `.gitattributes` line-ending
  policy, and the `format:check` / `format:write` scripts, replacing the current
  description of `.prettierrc` as "shadowed/ignored" and the claim that no
  `format` script exists.
- `AGENTS.md` must list `npm run format:check` as the formatting gate, consistent
  with the other gates it already documents.
- `sdd/ci-cd/spec.md` must stop asserting that Prettier is applied "only to the
  application and tooling sources" and "not to documentation": its Architecture
  section and its TEST-002 scope must defer to this Spec, which is authoritative
  for the formatting contract. Leaving it untouched would create a contradiction
  between two Specs (Engineering Charter §2).

Documentation is updated in the final step, after validation (Engineering
Charter §7).

## Constraints

- **NFR-001 — No behavioral change.** Prettier is a formatter, not a transpiler.
  No change may alter runtime behavior, and the production build output must be
  unaffected.
- **NFR-002 — Application sources are already compliant.** The remediation must
  produce **zero** content changes under `src/`; if a future run reports
  violations there, the configuration is wrong (FR-002), not the source.
- **NFR-003 — Pinned tool version.** Prettier is resolved from the committed
  `package-lock.json` (currently `3.8.3`, satisfying `^3.6.2`). Formatting output
  may change across Prettier minors, so the lockfile is the reference and the
  version is never floated ad hoc.
- **NFR-004 — One change, no mixing.** The line-ending normalization, the
  configuration consolidation, and the 23-file remediation land as a dedicated
  change, separate from feature work, so the diff stays reviewable.
- **NFR-005 — `.editorconfig` is retained.** It keeps serving editors
  (`insert_final_newline`, `trim_trailing_whitespace`, `quote_type`), but is no
  longer a formatting authority after FR-002.
- **NFR-006 — Editor and IDE configuration stays versioned.** `.gitignore`
  already re-includes `.vscode/{settings,tasks,launch,extensions}.json`; this
  change does not alter that.

## Architecture

Formatting is a repository-level contract with four moving parts, all declarative:

```text
.gitattributes   ── declares eol=lf ──┐
                                     ├──► working tree is LF on every platform
Prettier config (package.json) ──────┘         │
                                               ▼
                                     prettier --check .   (local + CI)
                                               │
                                               ▼
                                   format:check gate
```

There is no build step, plugin, or runtime dependency: Prettier is a standalone
formatter invoked on files. Its configuration resolution is the critical detail —
Prettier stops at the **first** configuration it finds while walking up from each
file, and within a directory `package.json` precedes `.prettierrc`. That ordering
is what made the committed `.prettierrc` inert and is why FR-001 removes it rather
than reconciling it.

Coverage of the gate is defined by `.prettierignore` plus Prettier's own
inferred parser per extension, not by a glob list. Replacing the five hard-coded
globs of `format:check` with `prettier --check .` means new directories are
covered automatically and the script cannot drift out of sync with the
repository layout.

Line endings cross two layers. Git normalizes on checkout according to
`.gitattributes`; Prettier normalizes on write according to `endOfLine`. Both must
be set to `lf` for the gate to be platform-independent — setting only one leaves
the defect in place.

## Files

| File                                        | Change                                                                                          |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `.gitattributes`                            | **new** — `* text=auto eol=lf`, followed by `git add --renormalize .` (FR-003)                 |
| `package.json`                              | `prettier` key expanded per FR-002; `format:check` → `prettier --check .`; `format:write` added |
| `.prettierrc`                               | **deleted** (FR-001)                                                                            |
| `.prettierignore`                           | adds `package-lock.json`, `.opencode/package.json`, `documents/legacy/`, Playwright output   |
| 23 files listed below                       | 22 formatted + `.prettierrc` deleted (FR-006)                                                  |
| `documents/engineering/ci-cd.md`            | real scope and `printWidth` (FR-008)                                                            |
| `documents/engineering/coding-standards.md` | single config, EOL policy, scripts (FR-008)                                                     |
| `AGENTS.md`                                 | `npm run format:check` as the formatting gate (FR-008)                                          |
| `sdd/ci-cd/spec.md`                         | Architecture and TEST-002 defer to this Spec (FR-008)                                           |
| `sdd/README.md`                             | index this Spec (Charter §2)                                                                    |

The 23 remediated files, for review completeness:

```text
.github/workflows/ci.yml
.opencode/plans/exercise-favorites.md
.prettierrc                        (deleted instead of formatted)
.vscode/extensions.json
.vscode/launch.json
.vscode/settings.json
.vscode/tasks.json
documents/engineering/architecture.md
documents/engineering/ci-cd.md
documents/engineering/pwa.md
documents/plans/ci-cd/plan.md
documents/plans/ci-cd/report.md
documents/plans/test-coverage/plan.md
e2e/auth.setup.ts
e2e/cache-validation.spec.ts
e2e/tracking-flow.spec.ts
public/manifest.webmanifest
sdd/ci-cd/spec.md
sdd/pwa-offline/spec.md
sdd/routines/spec.md
sdd/user-profile/spec.md
tsconfig.json
tsconfig.spec.json
```

## Tests

Test-first contract. Commands are run in a **fresh checkout**, not in a working
tree that previous formatter runs have already normalized, because the defect
under FR-003 is only reproducible from a clean checkout.

- **TEST-001** — Configuration resolution:
  `npx prettier --find-config-path src/main.ts` returns `package.json`, and
  `.prettierrc` does not exist.
- **TEST-002** — Gate passes on Windows: in a fresh checkout,
  `npm run format:check` exits `0` and reports
  `All matched files use Prettier code style!`. This is the regression test for
  FR-003; before the change it reports 604 failing files.
- **TEST-003** — Gate passes on Linux/CI: the same command exits `0` with an LF
  checkout. No CRLF/LF conditional remains.
- **TEST-004** — Line endings are normalized:
  `git ls-files --eol` reports `i/lf` and `w/lf` for every tracked,
  non-excluded file, with no `w/crlf` entry.
- **TEST-005** — Gate scope equals the repository: `npm run format:check` and
  `npx prettier --check .` agree on the result, and the checked set includes
  `e2e/`, `documents/`, `sdd/`, `public/`, `.vscode/`, `.github/`,
  `.opencode/plans/` and `tsconfig.json` (FR-004), while excluding the FR-005
  paths (`package-lock.json`, `.opencode/package.json`, `documents/legacy/`,
  `playwright-report/`, `test-results/`).
- **TEST-006** — The gate is not vacuous: introducing a formatting violation in a
  file outside the previous scope (e.g. a 2-space indent in
  `e2e/auth.setup.ts`, or a malformed table in an `sdd/` spec) makes
  `format:check` fail; `npm run format:write` repairs it and the gate returns to
  `0` (FR-007).
- **TEST-007** — No collateral change: `npm run lint`, `npm run typecheck`,
  `npm run test:ci`, and `npm run build` all pass after the remediation, and
  `git diff --stat` for the remediation shows no content change under `src/`
  (NFR-001, NFR-002).
- **TEST-008** — Diff containment: the remediation change touches only the
  configuration files and the 23 files of FR-006; the line-ending normalization
  contributes no content diff because the blobs already store LF (FR-003, NFR-004).
- **TEST-009** — _Deferred (runs only on GitHub):_ the `lint` job of
  `.github/workflows/ci.yml` passes its `format:check` step.

## Acceptance Criteria

- **AC-001** — `npm run format:check` exits `0` on a fresh Windows checkout and on
  Linux, with no platform-conditional failures (FR-003, TEST-002, TEST-003).
- **AC-002** — `npx prettier --find-config-path src/main.ts` returns
  `package.json`, and no `.prettierrc` exists in the repository (FR-001,
  TEST-001).
- **AC-003** — Every option that affects output is declared in the Prettier
  configuration, including `proseWrap` and `useTabs`, or is pinned to the
  Prettier 3.8.3 default; formatting no longer depends on `.editorconfig`
  (FR-002).
- **AC-004** — `format:check` covers the whole repository except the FR-005
  exclusions, and it detects a deliberately introduced violation outside the
  previous scope (FR-004, FR-007, TEST-005, TEST-006).
- **AC-005** — `git ls-files --eol` reports no `w/crlf` for tracked files
  (FR-003, TEST-004).
- **AC-006** — The remediation produced no content change under `src/`, and
  `lint`, `typecheck`, `test:ci`, and `build` all pass (NFR-001, NFR-002,
  TEST-007).
- **AC-007** — `documents/engineering/ci-cd.md`,
  `documents/engineering/coding-standards.md`, `AGENTS.md`, and
  `sdd/ci-cd/spec.md` describe the effective scope, the effective
  `printWidth: 100`, the `.gitattributes` policy, and the
  `format:check` / `format:write` scripts, with no remaining reference to
  `.prettierrc`, to `printWidth: 140`, or to a `src/**`-only Prettier scope
  (FR-008).
- **AC-008** — The CI `lint` job's `format:check` step is green on a pull request
  to `main` (TEST-009).
