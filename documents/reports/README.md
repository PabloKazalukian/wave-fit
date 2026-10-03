# Reports — Index

Post-delivery records per feature: what was implemented, what was validated and
what was deliberately left open.

Reports are **historical / non-authoritative** once written; they never define
current behavior. Per the [Engineering Charter](../engineering/charter.md) §2,
the source-of-truth order is:

1. Code + current Spec
2. Stable engineering/domain documentation
3. ADRs
4. Plans
5. Historical artifacts (this folder)

A report records one unit of delivered work on one branch. It is **not** a plan:
plans are written _before_ implementation and live in
[../plans/](../plans/README.md); reports are written _after_ validation and live
here.

New reports go in `documents/reports/<feature>.md`.

## Reports

| Feature                        | Report                                                       | Branch              | Scope                                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stats charts — chained flow    | [stats-charts-interactions.md](stats-charts-interactions.md) | `feat/stats-charts` | `/stats/insights`: metric → range → "Ver gráficas", one query per run, `app-stats-insights-controls` + `app-stats-insights-card`, calendar day hover |
| Stats charts — date-range page | [stats-charts-range.md](stats-charts-range.md)               | `feat/stats-charts` | `/stats/insights`: range widget, six on-demand chart sections, routing, `DateService` calendar math, `date-handling.md`                              |
| Stats charts (previous)        | [stats-charts.md](stats-charts.md)                           | `feat/stats-charts` | `/stats` dashboard fixes: Highcharts DI bootstrap, chart containment + orientation, routine-name resolution, Spec alignment                          |

> **Naming note.** The `/stats/insights` page was specced as `stats-charts` and
> renamed to `stats-insights` (`sdd/stats-insights/spec.md`, Correction 11), the
> same way `/stats/charts` became `/stats/insights`. **The file names in this
> table, the branch `feat/stats-charts`, and the `stats-charts` GraphQL namespace
> all keep the old name on purpose:** the reports are historical artifacts, the
> branch is unpushed history, and the namespace is the deployed `wave-fit-api`
> contract. Grepping `stats-charts` will hit those three and nothing else.
>
> The `stats-charts.md` name is taken by the **`/stats` dashboard** work above,
> which predates the `/stats/insights` page. The `/stats/insights` date-range page is
> specced in [`sdd/stats-insights/spec.md`](../../sdd/stats-insights/spec.md) and
> planned in
> [`../plans/stats-charts-range/plan.md`](../plans/stats-charts-range/plan.md);
> its report is [`stats-charts-range.md`](stats-charts-range.md) so the two are
> not confused. All live on the same branch.
>
> `stats-charts-interactions.md` supersedes the **flow** described by
> `stats-charts-range.md` — that report documents six sections queried on entry;
> the current page queries one section per explicit "Ver gráficas". Its range
> widget, routing and date math are unchanged.

---

_Historical implementation plans and old documentation are archived in [../legacy/README.md](../legacy/README.md)._
