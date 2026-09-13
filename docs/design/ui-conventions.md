# UI Conventions — Colors, Spacing and Visual Patterns

Reference guide for creating or modifying interfaces in the frontend. **Before touching any template, consult this documentation and AGENTS.md §6.**

All values were surveyed from the real repository code (Tailwind config + templates), not invented.

> Status: **active/live** reference. This file was migrated (translated and kept current) from the former `documents/design/UI-Conventions.md`; the full old-doc archive is in [../legacy/README.md](../legacy/README.md).

---

## 1. Palette and Color Semantics

Original hex values from `tailwind.config.js`. Each color has a defined **action role**. Using them outside that role is considered a bug.

| Color                | Hex                               | Action role                                                                              | Real repo examples                                                           |
| -------------------- | --------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **primary**          | `#50C878`                         | Main CTA / brand / "move forward" action / loadings                                      | "Explore plans", "Continue", "Save" (step), global focus ring (`styles.css`) |
| **primaryDark**      | `#2B6D41`                         | Definite finalize of a flow                                                              | "Save" in `workout-edition`, `routine-exercise-form`                         |
| **primary2/3/Light** | `#66D18A` / `#3CA15E` / `#A1E6BE` | Soft text/background brand variants                                                      | titles `text-primary2/3`, backgrounds `bg-primary/10`                        |
| **secondary**        | `#4472B4`                         | Secondary/informative actions, supporting navigation, "secondary" loadings               | support buttons in `plans.html`, `tracking-workout`                          |
| **accent**           | `#F5C623`                         | **Highlight a new, alternative or "free/extra" feature**                                 | Coach AI card, "Start workout" (free), set-edit buttons                      |
| **confirm**          | `#C83A6E`                         | Confirm an important decision / success screen                                           | "Confirm plan" (`coach-manage-with-plan`), `success.html`                    |
| **error**            | `#ba1a1a`                         | **Only destructive or lossy actions** (delete, clear, discard changes) or error messages | "Delete plan", "Cancel" in forms, error messages                             |
| **success**          | `#4CAF50`                         | Confirmed positive result (after successful save)                                        | success states                                                               |
| **warning**          | `#D66F6F`                         | Non-blocking warnings                                                                    | notices                                                                      |
| **text**             | `#2F2F2F`                         | Neutral: use with `variant="ghost"` for hierarchy-free "Cancel"                          | secondary "Close" / "Cancel"                                                 |

### Background / container colors

| Class            | Hex       | Use                                                              |
| ---------------- | --------- | ---------------------------------------------------------------- |
| `bg-background`  | `#121212` | Global app background                                            |
| `bg-background2` | `#151C17` | **Card/block background (most used)**                            |
| `bg-background3` | `#1C2F22` | Inner background (notification headers, etc.)                    |
| `bg-background4` | `#295538` | Secondary card border/background (`border-2 border-background4`) |
| `bg-surface`     | `#2b322c` | Neutral surfaces                                                 |
| `text-text2`     | `#adadad` | **Standard paragraph text (most used)**                          |
| `text-white`     | `#ffffff` | Text on colored backgrounds                                      |

### Hard color rules

- Do **NOT** use `error` for a non-destructive action (nor `primary` for destructive ones).
- Do **NOT** use `accent` as a page's main CTA; it is reserved to highlight new/alternative features.
- Do **NOT** invent colors: only the tokens from `tailwind.config.js` + `white`.
- Keep a single dominant action color per view (the "current primary").

---

## 2. Spacing (margins and paddings)

Most frequent values **measured** across all templates. Respect these scales; avoid arbitrary values (`p-7`, pattern-less `mx-auto`, `mt-9`, etc.) unless genuinely needed.

### Container and page hero (standard pattern)

```html
<section class="container px-4 py-4 max-w-lg mx-auto mt-8">
    <!-- page -->
    <div class="text-primary bg-background2 py-8 rounded-2xl px-4 flex flex-col gap-2">
        <!-- hero -->
        <h1 class="text-5xl font-bold text-center">...</h1>
    </div>
</section>
```

| Element         | Standard class                                             |
| --------------- | ---------------------------------------------------------- |
| Page container  | `container px-4 py-4 max-w-lg mx-auto mt-8`                |
| Hero / main box | `bg-background2 py-8 rounded-2xl px-4 flex flex-col gap-2` |
| Page width      | `max-w-lg` (mobile-first)                                  |

### Allowed padding scale

`p-1` to `p-8`. Measured usage:

| Value         | Use                                    |
| ------------- | -------------------------------------- |
| `p-1` / `p-2` | compact elements (chips, cells, icons) |
| `p-3`         | inputs / inner rows                    |
| `p-4`         | small standard card                    |
| `p-5`         | **standard content card**              |
| `p-6`         | medium card / blocks                   |
| `p-8`         | **featured cards / CTA hero**          |

Directional: `px-3/4/5/6/8`, `py-2/3/4/8`, `pb-2`, `pt-4` (most common).

### Margin scale

| Value           | Use                             |
| --------------- | ------------------------------- |
| `mt-8`          | separation from page top        |
| `mt-4` / `mt-6` | separate blocks from each other |
| `mb-1` / `mb-2` | title with short text           |
| `mb-4` / `mb-6` | below titles/block headers      |
| `mb-8`          | between large sections          |
| `m-2`           | floating notifications          |

Rule of thumb: use a **consistent edge** (top or bottom) to separate hierarchical blocks, and `gap` to space siblings inside a flex container.

### Gaps and groupings

| Value         | Use                           |
| ------------- | ----------------------------- |
| `gap-1/2`     | compact rows (icon + text)    |
| `gap-3/4`     | form columns / lists          |
| `gap-6`       | **stacked cards**             |
| `space-y-3/4` | vertical separation in blocks |

### Border radius

| Class          | Use                             |
| -------------- | ------------------------------- |
| `rounded-full` | badges, circular icons, avatars |
| `rounded-2xl`  | **cards** and main boxes        |
| `rounded-xl`   | smaller cards, calendar cells   |
| `rounded-lg`   | inputs / small buttons          |
| `rounded-md`   | mini-elements                   |

### Widths (max-width)

- `max-w-lg` → page.
- `max-w-sm` → **featured cards** (with `mx-auto` if the parent is not a centered flex).
- `max-w-md` → success screens / centered content.

### Hard consistency rule

> **Sibling cards inside the same block/page MUST share padding and max-width.**
> Example of the fixed bug: the "Coach AI" banner in `my-week` used full-width `p-6` while the neighbor "Explore plans" card uses `p-8 max-w-sm`. It was aligned to `p-8 max-w-sm mx-auto`.

---

## 3. Typography

Measured usage (hierarchy within a page):

| Element                 | Classes                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| Page H1 hero            | `text-5xl font-bold text-center` (`text-primary` or `text-white`) |
| Section/card title      | `text-2xl` / `text-xl` + `font-bold` in `text-primary`            |
| Smaller widget title    | `text-lg font-semibold`                                           |
| Paragraph text          | `text-sm` or `text-base` in `text-text2`, `leading-relaxed`       |
| Auxiliary text / labels | `text-xs` in `text-text2`                                         |
| Badge / mini-label      | `text-xs font-bold uppercase tracking-widest`                     |
| Weights                 | `font-bold`, `font-semibold`, `font-medium`                       |

Global fonts: `Lato` (sans, body) and `Work Sans` (heading).

---

## 4. Buttons and Notifications

### Buttons: always `app-btn`

**Forbidden** to create buttons with loose classes (`<button class="bg-...">`). Use `app-btn` (renders an `<a>` when there is a `routerLink`, a `<button>` otherwise).

| Prop              | Values                                                                                    | Use                                        |
| ----------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------ |
| `variant`         | `raised` (solid=CTA) / `outline` (border=contextual) / `ghost` (cancel) / `flat` (subtle) | by button hierarchy                        |
| `size`            | `sm` / `md`                                                                               | `md` for featured CTAs                     |
| `color`           | tokens from the §1 table                                                                  | by action role                             |
| `showIcon`        | `true` → arrow (or projected `<app-icon>`)                                                | CTAs                                       |
| `descriptionText` | secondary text under the label                                                            | make the action explicit                   |
| `routerLink`      | destination route                                                                         | navigation (renders `<a>`)                 |
| `isDisabled`      | `true`                                                                                    | in-progress processes (`deleting()`, etc.) |
| `buttonType`      | `button` / `submit`                                                                       | forms                                      |

Pattern examples:

```html
<!-- Main CTA -->
<app-btn
    [text]="'Coach AI'"
    [descriptionText]="'Generate my weekly plan'"
    [variant]="'raised'"
    [size]="'md'"
    [showIcon]="true"
    [color]="'accent'"
    [routerLink]="'/coach'"
></app-btn>

<!-- Destructive -->
<app-btn
    [text]="'Delete plan'"
    [color]="'error'"
    [variant]="'outline'"
    [size]="'sm'"
    [isDisabled]="deleting()"
    (click)="onDeletePlan()"
></app-btn>

<!-- Neutral cancel -->
<app-btn [text]="'Cancel'" [variant]="'ghost'" [color]="'text'" (click)="onClose()"></app-btn>
```

### Notifications: `app-notification`

| Prop         | Values                                   |
| ------------ | ---------------------------------------- |
| `type`       | `success` / `error` / `warning` / `info` |
| `message`    | text to show                             |
| `duration`   | ms until auto-close (default `5000`)     |
| `closeOuput` | close event                              |

Visual: 4px bottom border in the signal color (`border-green-500` / `red` / `yellow` / `blue`), circular icon with `✓ ✕ ! i`, background `bg-background3`. Floating margin `m-2`.

---

## 5. Semantic HTML

Repo goal (AGENTS §6.1): `<section>`/`<article>` per block, `<header>`/`<footer>` per block, `<ul>/<li>` for lists, `<nav>` for navigation, **`<div>` only for pure layout**. Reference: `src/app/pages/auth/callback/callback.html`.

---

## 6. Review Checklist (before editing or approving a UI change)

- [ ] Is `app-btn` used instead of custom buttons?
- [ ] Does the `color` match the action role (§1 table)? Destructive→`error`, CTA→`primary/accent/confirm`, success→`success`.
- [ ] Is padding within the standard scale (`p-1..8`) with no weird values?
- [ ] Do sibling cards share **padding + max-width + radius**?
- [ ] Do margins use scale values (`mt-2/4/6/8`, `mb-2/4/6/8`)?
- [ ] Is block separation consistent (same `gap`/`space-y`/`mt-*` as the rest)?
- [ ] Does typographic hierarchy respect §3 (no h2→h4 jumps, scale sizes)?
- [ ] Is HTML semantic (§5) with `aria-label` on sections/controls without visible text?
- [ ] Did no neighbor page/component convention break (same data pattern)?
