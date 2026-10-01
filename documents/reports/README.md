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

| Feature                 | Report                             | Branch              | Scope                                                                                                                       |
| ----------------------- | ---------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Stats charts (previous) | [stats-charts.md](stats-charts.md) | `feat/stats-charts` | `/stats` dashboard fixes: Highcharts DI bootstrap, chart containment + orientation, routine-name resolution, Spec alignment |

> The `stats-charts.md` name is taken by the **`/stats` dashboard** work above,
> which predates the `/stats/charts` page. The `/stats/charts` date-range page is
> specced in [`sdd/stats-charts/spec.md`](../../sdd/stats-charts/spec.md) and
> planned in
> [`../plans/stats-charts-range/plan.md`](../plans/stats-charts-range/plan.md);
> when it ships, its own report goes in `documents/reports/stats-charts-range.md`
> so the two are not confused.

---

_Historical implementation plans and old documentation are archived in [../legacy/README.md](../legacy/README.md)._
