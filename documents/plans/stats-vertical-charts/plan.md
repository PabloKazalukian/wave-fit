# Plan: Stats charts vertical + containment

## Context

Two visual defects reported on `/stats`:

1. The charts look "horizontal" and their content is **not** contained inside the
   section cards — it spills out past the rounded edges.
2. The charts should be vertical.

Defect 1 is the real one. Defect 2 is a misreading of defect 1 plus exactly one
genuinely horizontal chart. An earlier draft of this plan took the report at
face value and proposed converting **all four** sections to `column`; the
diagnosis below disproved that, and the delivered code follows the diagnosis
instead of the report. See Decisions.

## Diagnosis

### Defect 1 — overflow: `highcharts-chart` is an inline element

`highcharts-chart` is an unknown element emitted by `highcharts-angular`. No CSS
rule targets it, so it computes to `display: inline`. On first render it holds no
content, so `offsetWidth` is `0` and Highcharts falls back to its hardcoded
default width:

```js
// node_modules/highcharts/esm/highcharts.src.js:38042
chart.chartWidth = Math.max(0, widthOption || containerBox.width || 600); // → 600
```

The chart therefore renders **600px** wide inside a card whose content box is
**440px** (`max-w-lg` 512 − page `px-4` 32 − card `p-5` 40).

Highcharts also applies `css(renderTo, { overflow: 'hidden' })`
(`highcharts.src.js:38172`), but `overflow` has no effect on a non-replaced
inline box, so nothing clips the chart. This single defect is what made _every_
chart read as "too wide / horizontal".

### Defect 2 — orientation

`stats-chart.mapper.ts` declared:

| Section               | `chart.type` | Actual orientation | After this plan    |
| --------------------- | ------------ | ------------------ | ------------------ |
| Ejercicios destacados | `bar`        | horizontal         | `column`           |
| Rutinas destacadas    | `column`     | vertical           | `column`           |
| Récords personales    | `column`     | vertical           | `column`           |
| Adherencia semanal    | `line`       | line               | `line` (unchanged) |

Only the first was genuinely horizontal, and the Spec (`FR-005`) mandated it
that way. The perception of "most of them horizontal" came from defect 1, not
from the series types. `FR-005` is therefore the **only** chart-type change in
this plan.

## Status

> Historical (implementation artifact — not authoritative for current behavior).

## Decisions

- **Three columns, one line — Adherencia stays a `line` chart.** The three
  ranking/metric sections are `column`. `FR-005` (`bar` → `column`) is the only
  chart-type change; `FR-006` and `FR-007` are re-worded to say "vertical
  `column`" for consistency with the delivered options, but their type does not
  change. `FR-008` (Adherencia) is **not** touched: a weekly adherence series is
  a trend over time, and reading the trend is the entire point of the section —
  columns would replace a direction with ten disconnected bars, and would leave
  `plotOptions.line.marker` meaningless. The report's "the charts should be
  vertical" is a symptom of defect 1, and defect 1 is fixed on its own.
- **`lineSeries` loses its `name`, `columnSeries` keeps its parameter.** An
  earlier draft consolidated all four charts onto one `columnSeries(name, data)`
  helper, which is why the `name: 'Adherencia'` literal was stripped from
  `lineSeries` while the three column calls still pass a name. That draft was
  rejected, so the asymmetry is a leftover of it. It is inert: the base theme
  sets `legend.enabled: false` and every section uses a custom
  `tooltip.formatter` that builds its own header from the point name, so no code
  path reads a series `name`. Accepted as-is to keep the diff scoped; the tidy-up
  is to drop the parameter from `columnSeries` too, or restore it on
  `lineSeries`, in whichever change next touches these helpers.
- **X-axis category labels rotate −45°.** The app-wide convention lives in the
  shared theme (`statsChartBaseOptions.xAxis.labels.rotation`), not repeated in
  each builder. Adherencia overrides it back to `0` because its categories are
  `dd/MM` (5 characters) and rotating them only wastes space.
- **Fixed heights replace the per-row formula.** `Math.max(42 * n, …)` was sized
  for horizontal bars, where each category is a row. Vertical columns get fixed
  `height` plus an explicit `marginBottom` that reserves room for the rotated
  labels.
- **Containment fixed with a global rule in `src/styles.css`**, inside the
  existing `@layer base` block. `highcharts-chart` belongs to the library, not
  to `StatsChart`, and a global rule covers any future use of the component
  instead of needing `:host ::ng-deep` in a single call site.
- **Residual label overlap accepted for now.** With top 10 long names in ~440px,
  a ~75px label rotated 45° projects ~53px against a ~44px category slot.
  Rotation was chosen over ellipsis truncation; if the visual check still shows
  overlap, the follow-up is `labels.style.textOverflow: 'ellipsis'` +
  `labels.maxLength`, or dropping to top 5.
- **No automated gate for the CSS.** `TestBed` does not load global styles, and
  the e2e suite cannot reach `/stats`: `e2e/auth.setup.ts` logs in with
  placeholder credentials (`admin@test.com` / `password123`). Containment is
  therefore validated by visual inspection only — recorded as a known gap.

## Tasks (test-first, one at a time)

1. **Plan doc** — this file.
2. **Spec** — `sdd/stats/spec.md`: `FR-005` `bar` → `column`, `FR-006` re-worded
   to `column` (type unchanged), `FR-007` already correct, `FR-008` **not
   touched**. Add `NFR-004` (containment + container width) and `NFR-005`
   (label rotation).
3. **Tests** — `stats-chart.mapper.spec.ts`: all four `chart.type` asserts become
   `'column'`; add `series[0].type === 'column'`, the per-chart
   `xAxis.labels.rotation` (and the Adherencia `0` override), and a
   `chart.marginBottom` assertion. `stats-chart.theme.spec.ts`: assert the base
   theme declares the −45° rotation.
4. **Theme** — `stats-chart.theme.ts`: add
   `xAxis.labels.rotation: -45` to `statsChartBaseOptions` (propagated by the
   existing deep merge in `withStatsTheme`).
5. **Mapper** — `stats-chart.mapper.ts`: delete the `barSeries` helper and the
   `SeriesBarOptions` import (ESLint `no-unused-vars` flags them; `noUnusedLocals`
   is absent from `tsconfig.json` but lint is a gate). `lineSeries` and
   `SeriesLineOptions` **stay** — Adherencia is still a `line` chart. Apply
   fixed `height` + `marginBottom` to the three column builders; leave Adherencia
   on its own height with `marginBottom: 0` and `labels.rotation: 0`.
6. **Containment** — `src/styles.css`, in `@layer base`:
   `highcharts-chart { display: block; width: 100% }`.

## Validation

- `npm run lint`
- `npx prettier --check <touched files>` — **not** `npx prettier --check .`:
  the repo has ~225 pre-existing Prettier violations on `main`, so the
  repo-wide form of this gate cannot pass and would report nothing about this
  change. The touched files are individually Prettier-clean.
- `npm test` — full suite green.
- `npm run build` — production build.
- Visual check on `/stats` (authenticated, `npm start`): chart SVG measures
  ~440–640px (not 600px by Highcharts' default), nothing spills past the rounded
  card, three vertical column charts plus the Adherencia line chart, rotated
  x-axis labels on the column charts and horizontal `dd/MM` labels on Adherencia,
  clean console.

## Non-goals

- `StatsPage`, `StatsChart`, `StatsSection`, `app.config.ts` and `main.ts` are
  untouched by this plan.
- **`FR-008` (Adherencia) keeps its `line` type, its `plotOptions.line.marker`
  config and its `lineSeries` helper.** No spec change, no test change beyond
  the height/rotation/margin asserts.
- `documents/plans/stats-page/plan.md` is historical and is **not** updated; its
  "Chart types" decision is superseded by this plan and by the Spec change.
- Tooltip content per `FR-005`–`FR-008` is unchanged.
