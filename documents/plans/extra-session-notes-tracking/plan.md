# Plan: Extra-session notes in the tracking widgets

## Context

The extra-session feature (spec `sdd/extra-session/spec.md`) already collects a
`notes` field in the shared `extraSessionForm` and in the `CreateExtraSessionForm`
payload contract, but the widgets never surfaced it:

- `extra-session-form.save()` hardcoded `notes: ''`, so nothing entered was ever
  sent, even though the form owns a `notes` control.
- `extra-session-create` rendered no notes field at all.
- `extra-session-card` (the editable card used by `extra-session-content` inside
  `tracking-workout`) displayed duration/intensity/calories but neither showed
  nor edited `notes`, and `extra-session-content.updateExtraSession()` dropped
  notes from the `UpdateExtraSessionInput`.

The read-only `extra-session-show` widget (training-history preview) already
renders notes, so the editable card is inconsistent with it.

## Decision

- **`extra-session-card`** shows `session().notes` when present in read mode and
  adds a notes field in edit mode; the `save` output gains `notes`; the edit
  form prefills notes from the session.
- **`extra-session-content`** forwards `data.notes` to
  `ExtraSessionService.update` → `UpdateExtraSessionInput.notes`.
- **`extra-session-create`** renders a notes textarea bound to the shared form's
  `notes` control (matching the existing `app-input` visual style).
- **`extra-session-form.save()`** sends the real `notesControl.value` instead of
  the hardcoded `''`.

Out of scope (per clarification): category badge on the card, and the cosmetic
`tap(() => loading.set(true))` line in `extra-session-form.ts` — the latter is
left untouched (existing behavior, not part of notes).

## Changes

### Spec (done)

- `sdd/extra-session/spec.md`: FR-002 (notes field exposed by create widget +
  real value in `save`), new FR-008 (card shows/edits notes, forwarded to
  update), TEST-006/007/008, AC-004, widgets architecture line.

### Code

- `shared/components/widgets/extra-session/extra-session-card/*`: show notes in
  read mode; add notes control to the edit form (prefilled); include `notes` in
  the `save` output.
- `shared/components/widgets/extra-session/extra-session-content/*`:
  `updateExtraSession(data)` passes `notes: data.notes` to `service.update`.
- `shared/components/widgets/extra-session/extra-session-create/*`: add a notes
  textarea bound to the shared form control.
- `shared/components/widgets/extra-session/extra-session-form/extra-session-form.ts`:
  `save()` sends `notes: this.notesControl.value`.

### Tests (tests first)

- `extra-session-card.spec.ts`: notes shown in read mode; notes editable and
  prefilled in edit mode; `save` emits `notes`.
- `extra-session-content.spec.ts`: `updateExtraSession` forwards `notes`.
- `extra-session-create.spec.ts`: notes field rendered and bound to the form
  control.
- `extra-session-form.spec.ts`: `save()` calls `service.create` with the
  control's notes value (not `''`).

## Validation

`npm run lint`, `npm test`, `npm run build`, `npx prettier --check` on touched
files only.

## Status

Done — implemented and validated: `npm run lint` (pass), `npm test` 413 pass
(17 extra-session green), `npm run build` (OK), `npx prettier --check` on
touched files (clean).

## Notes

- The card "Guardar" button is `type=submit` inside the edit `<form>`, so the
  spec invokes `onSave()` directly instead of clicking it (clicking would submit
  the form and reload the page in the test runner); no production behavior
  changed.
