# UI Components — Preferred Shared Components

Reference guide for the established shared UI components. **Prefer these components over
hand-rolled native elements** when creating or editing templates. Colors reference
[ui-conventions.md §1](ui-conventions.md); spacing/typography reference §2/§3.

> Status: **active/live** reference.

## General rules

- These components are the standard. Do **not** invent new ones or write loose `<input>`,
  `<select>`, `<button>`, `<a>`, checkbox markup for the same purpose.
- Legacy widget templates still containing raw elements from before this rule are left
  as-is unless the widget is being migrated; route **new or edited** markup through these
  components.
- Form components bind a `FormControl` (ReactiveFormsModule). They render their own labels,
  error messages and validation styling.

---

## 1. Loading states

Two preferred patterns. Choose by the **size of the element being loaded**:

| Need                                                                                | Use                                     |
| ----------------------------------------------------------------------------------- | --------------------------------------- |
| Small/child elements, inline feedback, in-flight operations (save, delete, refresh) | `app-loading` (spinner)                 |
| Whole sections, cards, pages (divs/blocks that occupy layout space)                 | Skeleton placeholders (`animate-pulse`) |

### `app-loading`

Spinner loader for **small or child elements / inline feedback**.

| Input   | Values                        | Default   |
| ------- | ----------------------------- | --------- |
| `color` | tokens from ui-conventions §1 | `primary` |
| `size`  | `sm` / `md` / `lg`            | `md`      |

```html
<app-loading color="primary" size="md" /> <app-loading [color]="'secondary'"></app-loading>
```

Real child-loading usage: `pages/user/history/history.html:51`.

For **button-level** in-progress feedback prefer projecting `app-spinner` through `app-icon`
(see `pages/my-week/my-week.html:87-93`).

### Skeleton (sections)

Skeleton placeholders are plain layout blocks with `animate-pulse`. They **must mirror the
shape and radius** of the content they replace: the same card shell
(`bg-background2 rounded-2xl`) with inner blocks in `bg-background3 rounded-lg/xl`.

Reference implementations:

- `app-tracking-week-skeleton` — whole-week section
  (`widgets/tracking/tracking-week/tracking-week-skeleton.ts`).
- Inline example in `pages/tracking-day/show/show.html:118-124`.

```html
<!-- Skeleton for a section/card in loading state -->
@if (loading()) {
<div class="animate-pulse space-y-4">
    <div class="h-32 bg-background2 rounded-2xl"></div>
    <div class="h-48 bg-background2 rounded-2xl"></div>
</div>
}
```

> **Decision rule:** section/div/card-level loading → **skeleton**; small/child/inline
> loading → **`app-loading`**.

---

## 2. Text links

### `app-text-link`

Inline text link (renders an `<a>` via `routerLink`). **Prefer it instead of raw `<a>`** for
in-text navigation.

| Input        | Values                               | Default   |
| ------------ | ------------------------------------ | --------- |
| `text`       | link label                           | `''`      |
| `routerLink` | internal route path or external URL  | `''`      |
| `color`      | tokens from ui-conventions §1        | `primary` |
| `isExternal` | `true` when pointing outside the app | `false`   |

```html
<app-text-link
    [text]="'Volver al historial'"
    [routerLink]="'/user'"
    [color]="'primary'"
></app-text-link>
```

---

## 3. Form controls

All form components require a `FormControl` from ReactiveFormsModule; register them inside an
existing `FormGroup`.

> **Forbidden:** hand-rolled native `<input>`, `<select>`/`<option>` and checkboxes for these
> cases. Route new/edited forms through the shared components.

### `app-input`

Single-line text input.

| Input                | Values                                   | Default |
| -------------------- | ---------------------------------------- | ------- |
| `control`            | `FormControl<string \| null>` (required) | —       |
| `label`              | field label                              | —       |
| `type`               | `text` / `email` / `password` / `date`   | `text`  |
| `placeholder`        | placeholder text                         | `''`    |
| `showTogglePassword` | `true` → show/hide password toggle       | `false` |

```html
<app-input [label]="'Email'" [type]="'email'" [control]="emailControl"></app-input>
```

### `app-input-number`

Numeric stepper.

| Input         | Values                                   | Default   |
| ------------- | ---------------------------------------- | --------- |
| `control`     | `FormControl<number \| null>` (required) | —         |
| `label`       | field label                              | `''`      |
| `step`        | increment/decrement step                 | `1`       |
| `min` / `max` | numeric bounds                           | `null`    |
| `variant`     | `buttons` / `arrows` / `none`            | `buttons` |

```html
<app-input-number [label]="'Peso kg'" [control]="weightKgControl"></app-input-number>
```

### `app-input-search` (pending)

Preferred component for search fields. **Currently a stub — not implemented and not used.**
Do not depend on it until it is implemented and validated.

### `app-select`

Single-choice select.

| Input         | Values                                      | Default           |
| ------------- | ------------------------------------------- | ----------------- |
| `text`        | placeholder option label (shown when empty) | `''`              |
| `label`       | field label                                 | —                 |
| `color`       | border/active color, tokens §1              | `primary`         |
| `placeholder` | placeholder text                            | `''`              |
| `control`     | `FormControl<string \| null>`               | new empty control |
| `options`     | `SelectType[]` (`{ name, value }`)          | `[]`              |
| `showClear`   | `true` → show clear (✕) when a value is set | `false`           |
| `clearValue`  | output emitting `''` when cleared           | —                 |

```html
<app-select
    [label]="'Intensidad'"
    [options]="intensityOptions"
    [control]="intensityPreferenceControl"
></app-select>
```

### `app-multi-select`

Multi-choice dropdown with checkmark list and optional max selection.

| Input     | Values                                      | Default          |
| --------- | ------------------------------------------- | ---------------- |
| `text`    | trigger text when nothing is selected       | `''`             |
| `label`   | field label                                 | derived fallback |
| `color`   | border/active color, tokens §1              | `primary`        |
| `options` | `SelectType[]` (`{ name, value }`)          | `[]`             |
| `control` | `FormControl<(string \| number)[] \| null>` | new empty array  |
| `max`     | max selectable items (`0` = unlimited)      | `0`              |
| `btnText` | confirm button label in the dropdown        | `'enviar'`       |
| `send`    | output emitted on confirm                   | —                |

```html
<app-multi-select
    [label]="'Estilos preferidos'"
    [text]="'Selecciona estilos'"
    [options]="preferredStylesOptions"
    [control]="preferredStylesControl"
    [max]="3"
></app-multi-select>
```

### `app-checkbox`

Single checkbox.

| Input           | Values                           | Default |
| --------------- | -------------------------------- | ------- |
| `control`       | `FormControl<boolean>`           | —       |
| `text`          | label next to the box            | `''`    |
| `indeterminate` | `true` → indeterminate state (−) | `false` |

```html
<app-checkbox [control]="rememberControl" text="Recordarme"></app-checkbox>
```

---

## Related references

- [ui-conventions.md](ui-conventions.md) — colors/action roles (§1), spacing (§2),
  typography (§3), buttons and notifications (§4: `app-btn`, `app-notification`).
- [AGENTS.md](../../AGENTS.md) — development workflow and mandatory read order.
