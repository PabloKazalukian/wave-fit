# Report — `/stats/insights`: chained flow and per-card unit

Branch: `feat/stats-charts`
Spec: [`sdd/stats-insights/spec.md`](../../sdd/stats-insights/spec.md) (Correction 9, Correction 10, FR-022..FR-025, NFR-011)
Plan: [`../plans/stats-charts-interactions/plan.md`](../plans/stats-charts-interactions/plan.md)
Predecessor report: [`stats-charts-range.md`](stats-charts-range.md)

> This report is **historical and non-authoritative**. Current behavior is defined
> by the code and the Spec, per the
> [Engineering Charter](../engineering/charter.md) §2.

## What changed

The page went from **six sections queried on entry** to a **chained, user-initiated
flow**: pick one metric → adjust the range → press "Ver gráficas". Exactly one
section is queried and one card renders.

| Area                       | Before                                                  | After                                   |
| -------------------------- | ------------------------------------------------------- | --------------------------------------- |
| Entry to `/stats/insights` | 6 queries fire (`load()` in the page constructor)       | **0** queries                           |
| Trigger                    | any date or preset change re-ran all six (`applyRange`) | only the button (`run(section, range)`) |
| Cards                      | 6 always rendered                                       | 0 or 1, filtered on the selected metric |
| Card unit                  | a block repeated in the page template                   | `app-stats-insights-card` (FR-024)      |
| Input chain                | a bare `app-stats-date-range`                           | `app-stats-insights-controls` (FR-022)  |
| Day hover in the calendar  | `accent/25`                                             | `accent/70` (FR-025)                    |

New files:

- `shared/components/widgets/stats/stats-insights-controls/` (FR-022)
- `shared/components/widgets/stats/stats-insights-card/` (FR-024)

`StatsInsightsMetricOption` was added to `shared/interfaces/stats-insights.interface.ts`.

## Two decisions worth keeping

**The applied range is per section, not global.** `StatsInsightsState` keeps
`appliedRange(section)` next to each section's data. With a single-select flow a
global range is tempting — one card is on screen at a time — but it is wrong the
moment the user runs `volume` for July, switches to `calories` for May, and comes
back to `volume`: the subtitle and `retry()` would describe May over a July
chart. The seed range (`range()`, the last 30 days) stays separate from it and is
never moved by `run()`.

**"Zero requests on entry" is structural, not a check.** The six per-section
`BehaviorSubject`s are still built in the state constructor, each seeded with
`null`, and `switchMap` maps `null` to `EMPTY`. Nothing special-cases the initial
state, so there is no code path where constructing the state queries.

## Validation

| Gate                                    | Result                                                                                                         |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                          | clean                                                                                                          |
| `npm run typecheck`                     | clean                                                                                                          |
| `npm run test:ci`                       | **734 SUCCESS**, 0 failures                                                                                    |
| `npm run build`                         | exit 0, pre-existing budget **warning** (856.63 kB vs `maximumWarning: 500kB`, under the 1 MB error threshold) |
| `npx prettier --check` on touched files | clean                                                                                                          |

Per-file runs (Karma takes one `--include`; a comma-separated list does not work,
and two `ng test` processes cannot share the fixed port):

| Spec file                                           | Tests                           |
| --------------------------------------------------- | ------------------------------- |
| `stats-insights-controls.spec.ts`                   | 12 SUCCESS (TEST-023)           |
| `stats-insights-card.spec.ts`                       | 18 SUCCESS (TEST-024)           |
| `stats-insights.state.spec.ts`                      | 26 SUCCESS (TEST-018, TEST-019) |
| `pages/stats/stats-insights/stats-insights.spec.ts` | 25 SUCCESS (TEST-021)           |
| `input-date.spec.ts`                                | 31 SUCCESS (TEST-025 + prior)   |

`highcharts` is still its own lazy chunk (275.49 kB raw / 89.03 kB transferred).

## Defects found during validation

Three were real and are fixed; they are recorded because each one is a trap the
obvious implementation walks into.

**1. A `computed` over a `FormControl.value` never recomputes.**
`app-stats-insights-controls` read `metricControl.value` inside a `computed` to
decide whether the run button is enabled. `FormControl.value` is a plain
property, not a signal, so the `computed` cached on first read and the button
stayed disabled forever. The symptom was misleading: the "nothing queries until
the button" tests passed **for the wrong reason** — the button was disabled, not
because the chain was mute. Fixed by mirroring the control into a signal via
`valueChanges` + `takeUntilDestroyed` (the pattern `StatsDateRange` already uses),
and covered by the `run` tests.

**2. `select="[cardExtras]"` does not match inside a `@switch`.**
Content projection matches the **top-level** nodes of the projected content. A
`@switch` block is one such node, so putting `cardExtras` on the elements _inside_
its `@case` branches made the selector match nothing and the calories note and
the two `<ul>` lists silently disappeared. They rendered in no branch, and the
page's own tests caught it. Fixed by putting `cardExtras` on a wrapper element
that is a direct child of the card.

**3. `disabled:hover:bg-transparent` is load-bearing, not cosmetic.**
Tailwind applies `:hover` to `<button disabled>` in several browsers, so a
disabled day in the calendar tinted on mouseover and looked selectable. FR-025
requires a disabled day to show no hover; the neutralization is what makes that
true, and TEST-025 covers it.

## Not done / deliberately open

- **The chart-type selector.** Out of scope by decision: the user asked for the
  structure that will carry it, not the control. `app-stats-insights-card` is the
  unit that will host it, which is why it was extracted now.
- **Visual pass on an authenticated `/stats/insights`.** Required by the plan and
  still **outstanding**. The AC-005 defect in the previous delivery was found only
  by looking at the page, and e2e cannot produce this evidence
  (`e2e/auth.setup.ts` uses placeholder credentials). Automated evidence for
  AC-005 exists (TEST-021, TEST-024), but the hover, the disabled button and the
  chain order have not been confirmed by eye.
- **Multi-select.** The flow assumes one metric at a time. `isRunning` is a
  `computed` over the visible card, which is correct only while that holds; a
  multi-select would move that flag into the state as a counter.
