# Plan: Code Formatting & Style Gates

> **Status: Historical / Non-Authoritative.** Implemented on
> `feature/formatting-spec` (T0-T12). Spec: `sdd/formatting/spec.md`, which is
> authoritative for the formatting contract alongside the Code. T13 (push and
> PR, TEST-009) was deferred and was not part of this Plan's completion
> (`documents/engineering/git-workflow.md` §6).

## Context

`main` has no authoritative formatting contract. Three defects are measured in
`sdd/formatting/spec.md` (Context): a fresh Windows checkout fails
`prettier --check .` on **604** files because the repository has no
`.gitattributes` while the machine has `core.autocrlf=true`; the committed
`.prettierrc` is dead because the `prettier` key in `package.json` shadows it;
and `format:check` only covers `src/**` plus five root tooling configs, leaving
**25** real violations (23 after the FR-005 exclusions) outside the gate.

This plan implements the Spec. It touches no application source: the remediation
must produce **zero** content changes under `src/` (NFR-002).

## Clarifications applied to the Spec

The Spec was corrected before implementation (Engineering Charter §8). Each item
below resolved a contradiction found while validating the Spec against the
repository:

1. **FR-005 vs FR-006 on `.opencode/` (contradiction).** FR-005 excluded the whole
   `.opencode/` directory while FR-006 listed `.opencode/plans/exercise-favorites.md`
   among the files to format — unreachable under that ignore rule. Resolution:
   FR-005 excludes only the generated `.opencode/package.json` and
   `package-lock.json`; `.opencode/plans/` stays versioned and gated, consistent
   with how `documents/plans/` is treated. The FR-006 list of 23 is unchanged.
2. **`sdd/ci-cd/spec.md` contradiction (omission).** Its Architecture section
   states Prettier is applied "only to the application and tooling sources
   (`src/**` ...) and not to documentation", and its TEST-002 repeats that scope.
   That Spec contradicted this one. Resolution: `sdd/ci-cd/spec.md` is added to
   FR-008 and AC-007 and now defers to `sdd/formatting/spec.md` for the scope.
3. **Missing renormalization step (gap).** The Files table listed `.gitattributes`
   but not the working-tree normalization it requires. Resolution: the Files table
   records `git add --renormalize .` as part of the `.gitattributes` change.
4. **FR-002 incompleteness (gap).** The table claimed to state "every option that
   affects output" but omitted `proseWrap` and `useTabs`. `proseWrap: "preserve"`
   is precisely why declaring `printWidth: 100` does not rewrap Markdown prose, so
   leaving it implicit defeats the purpose of FR-002. Resolution: both options are
   declared, and the remaining options are pinned to Prettier 3.8.3 defaults.
5. **`documents/legacy/` (omission).** `prettier --check .` reaches the 27 tracked
   archived files under `documents/legacy/`, which the Spec never mentioned.
   Resolution: FR-005 excludes `documents/legacy/`; archived documentation must not
   be able to block a merge.
6. **Stale measurements.** The Spec's Context was measured on `1fc4282`; `main` is
   now `468027a`. Resolution: the Context figures were re-measured (604 EOL
   failures, 25 real violations).

## Decisions

1. **Configuration source:** the `prettier` key of `package.json`, and only that.
   `.prettierrc` is deleted rather than reconciled, because a configuration file
   Prettier never reads cannot be corrected into authority.
2. **Behavior preservation:** every option that affects output is pinned to its
   _current effective value_, so FR-002 changes no existing file. Verified
   empirically before planning: a `tabWidth: 4` in `package.json` overrides
   `indent_size = 8` in `.editorconfig`, and `proseWrap: "preserve"` keeps Markdown
   prose unwrapped at `printWidth: 100`.
3. **Scope by directory walk:** `format:check` becomes `prettier --check .`.
   Coverage is then defined by `.prettierignore` plus Prettier's inferred parser,
   and cannot drift from the repository layout.
4. **Exclusions:** generated and tool-owned paths only
   (`package-lock.json`, `.opencode/package.json`, `documents/legacy/`, Playwright
   output). `.vscode/` and `.opencode/plans/` stay gated because they are versioned.
5. **Two commits in one PR.** `chore(formatting):` carries the working-tree-wide
   changes (T1-T6); `docs(formatting):` carries the documentation updates (T9-T10).
   This satisfies NFR-004 (one dedicated change) while respecting Charter §7
   (documentation last, after validation).
6. **No unit tests.** This change has no `src/` behavior, so the test-first
   contract is the Spec's shell-level scenarios TEST-001..TEST-009, not Karma specs.
7. **Branch:** `feature/formatting-spec`, continued from the Spec commit.
8. **CI needs no edit.** `.github/workflows/ci.yml:29` already runs
   `npm run format:check`; changing the script's internals is enough. CI checks out
   LF, so the EOL defect never manifests there.
9. **Fresh-checkout validation stays in-tree.** The clean checkout required by
   TEST-002 is made with `git clone --local . tmp/fresh`, inside the gitignored
   `tmp/` directory. Verification checkouts must not be created outside the
   project (`AGENTS.md` → _Agent Execution Boundaries_).

## Tasks

- **T0** _(done — clarification)_ Correct `sdd/formatting/spec.md` per items 1-6
  above. Validate: the Spec is self-consistent and every figure is re-measurable.
- **T1** Write this Plan.
- **T2** Test-first baseline: record the pre-change state so the remediation can be
  proven not to regress anything — `npx prettier --list-different --end-of-line auto .`,
  `npx prettier --find-config-path src/main.ts`, `git ls-files --eol` counts.
- **T3** Add `.gitattributes` with `* text=auto eol=lf`, then renormalize the
  working tree (`git add --renormalize .`). Validate: `git ls-files --eol` reports
  no `w/crlf` (TEST-004).
- **T4** Expand the `prettier` key in `package.json` per FR-002 (adding
  `arrowParens`, `bracketSameLine`, `endOfLine`, `tabWidth`, `useTabs`,
  `proseWrap`, and the `tabWidth: 2` override for `*.html`/`*.scss`/`*.css`); set
  `format:check` to `prettier --check .`; add `format:write`.
  Validate: the `--list-different --end-of-line auto` set is **unchanged** from T2
  (FR-002 alters no existing file).
- **T5** Delete `.prettierrc`. Validate: `--find-config-path src/main.ts` still
  returns `package.json` and the file is gone (TEST-001).
- **T6** Extend `.prettierignore` per decision 4. Validate: the checked set now
  equals the repository minus those paths (TEST-005).
- **T7** One-time remediation: `npm run format:write`. Validate: `git diff --stat`
  lists only the configuration files and the 23 files of FR-006, with **no**
  `src/` entry (NFR-002, TEST-008).
- **T8** Prove the gate is not vacuous (TEST-006): inject a violation outside the
  old scope (2-space indent in `e2e/auth.setup.ts`, malformed table in an `sdd/`
  spec), confirm `format:check` fails, run `format:write`, confirm it returns to
  `0`, and revert the injection so it is never committed.
- **T9** Full local gates (TEST-007): `npm run lint`, `npm run typecheck`,
  `npm run test:ci`, `npm run build`.
- **T10** Fresh-checkout validation (TEST-002, TEST-003, TEST-005): reproduce a
  clean checkout **inside the project** — `git clone --local . tmp/fresh` — then
  run `npm ci` and `npm run format:check` there. The clone inherits
  `core.autocrlf=true`, so it reproduces the CRLF working tree that makes the
  FR-003 defect observable; after the fix it must exit `0`. `tmp/` is already
  gitignored (`/tmp` in `.gitignore`), so this cannot pollute `git status`, and
  it satisfies the in-tree-only boundary in `AGENTS.md`. Clean up with
  `git worktree`/directory removal inside the project when finished. The
  pre-change defect is only reproducible from a clean checkout, so this task is
  where FR-003 is actually proven.
- **T11** Documentation, after validation (FR-008, Charter §7):
    - `documents/engineering/ci-cd.md` — real scope and `printWidth: 100`; stop
      citing `.prettierrc`.
    - `documents/engineering/coding-standards.md` §8 — single configuration,
      explicit `endOfLine: "lf"`, the `.gitattributes` policy, and the
      `format:check` / `format:write` scripts; drop the "shadowed/ignored"
      description and the claim that no `format` script exists.
    - `AGENTS.md` — list `npm run format:check` as the formatting gate.
    - `sdd/ci-cd/spec.md` — Architecture and TEST-002 defer to
      `sdd/formatting/spec.md` for the gate scope.
- **T12** Index the new Spec in `sdd/README.md`, then mark this Plan as
  Historical / Non-Authoritative.
- **T13** _(deferred until requested)_ Push and open the PR; validate TEST-009
  (the CI `lint` job's `format:check` step) on GitHub.

## Validation

Per task:

- T3 → `git ls-files --eol` shows `i/lf` / `w/lf` and no `w/crlf` (TEST-004).
- T4 → `npx prettier --list-different --end-of-line auto .` returns exactly the T2
  set: proof that declaring the options changed no file's formatting.
- T5 → `npx prettier --find-config-path src/main.ts` → `package.json` (TEST-001).
- T6 → `npm run format:check` and `npx prettier --check .` agree; the FR-005 paths
  are excluded and `e2e/`, `documents/`, `sdd/`, `public/`, `.vscode/`, `.github/`
  and `tsconfig.json` are included (TEST-005).
- T7 → `git diff --stat` contains no `src/` path (NFR-002, TEST-008).
- T8 → the gate fails on an injected violation and returns to `0` after
  `format:write` (TEST-006).
- T9 → `lint`, `typecheck`, `test:ci`, `build` all exit `0` (TEST-007).
- T10 → `npm run format:check` exits `0` in `tmp/fresh` (TEST-002, TEST-003).
- T13 → CI `lint` job green on the PR (TEST-009).

## Risks

- **Markdown table reflow.** 11 Markdown files (including this Spec's siblings)
  get their tables re-aligned, producing a large, conflict-prone diff. Mitigated
  by NFR-004: it lands as a dedicated change, not mixed with feature work.
- **Working-tree-wide renormalization.** T3 touches every tracked file locally.
  It must be committed alone so the diff stays reviewable, and developers pulling
  it with `core.autocrlf=true` will see a mass re-checkout — noted in the PR body.
- **CI gate surface grows.** The `lint` job goes from ~30 to ~600 checked files
  and any unformatted file blocks the merge. That is the intent (FR-004), but it
  makes the gate strict from the moment it lands.
- **Future Prettier minors.** A minor bump may reformat Markdown tables again.
  NFR-003 pins the lockfile as the reference so this is a deliberate, visible
  change rather than a surprise.

## Out of scope

- Adopting the dead `.prettierrc` intent (`printWidth: 200`,
  `htmlWhitespaceSensitivity: "ignore"`) — it would rewrite 103 HTML files.
- Reformatting `src/` — it is already compliant.
- E2E (Playwright) in CI; deployment; Vercel configuration.
- Branch-protection configuration (manual in GitHub Settings).
