# Date Handling

Canonical rules for every date that crosses a layer boundary. Read this before
adding a date to a VM, an API input, a chart axis or a calendar UI.

## 1. The two date kinds

| Kind                  | Type                         | Meaning                                       | Where it lives                            |
| --------------------- | ---------------------------- | --------------------------------------------- | ----------------------------------------- |
| **Domain / API date** | `LocalDate` (`"yyyy-MM-dd"`) | A calendar day, no timezone, no clock         | VMs, comparisons, GraphQL inputs, storage |
| **Display-only date** | `Date`                       | A `Date` that is only painted, never compared | Calendar grids, day numbers, week headers |

The rule that makes this work: **a `Date` may be rendered but must never be
compared, emitted or stored.** The moment a value is compared, sorted, validated
or serialized it must be a `LocalDate` string.

`LocalDate` is declared once, in
`shared/interfaces/local-date.interface.ts`. `core/services/date.service.ts` and
`shared/utils/date.utils.ts` both re-export it, so the older `import { LocalDate }
from '.../date.service'` imports keep compiling while new code imports the
canonical file. Do not declare `type LocalDate = string` a sixth time.

`LocalDateRange` (`{ from, to }`) is declared in the same file and is inclusive on
both ends: it covers `daysBetween(from, to) + 1` days.

## 2. Three sanctioned conversions

| Direction                      | Function                            | Notes                                                                                                    |
| ------------------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `LocalDate` → `Date` (UI)      | `DateService.localDateToDisplay`    | Display only. `parseISO` on a bare date yields **local midnight**, which is why day numbers never shift. |
| `LocalDate` → UTC instant      | `date.utils.localDateToUtc`         | Only when the backend needs an instant (`fromZonedTime`, not `new Date`).                                |
| API ISO datetime → `LocalDate` | `date.utils.apiDateTimeToLocalDate` | The API boundary. See the warning below.                                                                 |

### Never do this

```ts
new Date(iso).toISOString().slice(0, 10); // truncates in UTC
```

It crops in UTC, so every user in a negative offset gets the day **one day
early**. Use `apiDateTimeToLocalDate(iso, timezone)`, which formats in the
target zone with `formatInTimeZone`.

Likewise `new Date()` in business logic is wrong: use
`DateService.todayLocalDate(timezone)`, which resolves "today" in the user's
zone rather than the browser's.

## 3. Injectable calendar math vs. pure functions

The split is real and both sides have a reason:

- **`DateService` (`@Injectable`)** — calendar math that components need:
  `todayLocalDate`, `addDaysToLocalDate`, `weekRangeLocalDates`,
  `daysBetween`, `isValidLocalDate`, `lastNDays`, `isoWeekStartLocalDate`.
- **`date.utils.ts` (pure)** — what a mapper or a non-injectable context needs:
  `apiDateTimeToLocalDate`, `localDateToUtc`, `isoWeekStartLocalDateFromKey`.
  `DateService` delegates to the pure one where both exist, so there is a single
  implementation and a single test.

`DateService.isValidLocalDate` rejects calendar impossibilities (`"2026-02-30"`,
`"2026-13-01"`), not just the wrong shape: it re-formats the parsed date and
compares it to the input. Shape-only validation lets impossible dates through to
the API and they come back as a `BadRequest`.

## 4. Validation rules for a date range

A user-supplied range is validated **client-side for feedback and server-side for
correctness**. The frontend is never the only gate. The three rules, mirrored
from the API:

1. both ends are real `LocalDate`s (`isValidLocalDate`);
2. `from <= to`;
3. `daysBetween(from, to) <= maxDays`.

Rule 2 is handled by **correcting** an inverted range, not by rejecting it,
because the intent is unambiguous — see `sdd/stats-insights/spec.md` FR-006/FR-007.
Rule 3 is rejected with a message naming the limit, because an over-long range
has no single correct value.

A `maxDays` cap is always an **exported constant** shared by the widget, the state
and the tests. A literal in a template is how the backend limit and the frontend
limit silently drift apart.

## 5. Weeks are parsed, never derived

ISO week keys (`"2026-W40"`) arrive from the backend. The frontend parses them and
never derives them from a range:

- `isoWeekStartLocalDateFromKey(weekKey)` returns `null` for a malformed key or
  for a week the year does not have (`"2025-W53"`). `null` beats a wrong date: an
  axis label can degrade, a wrong tooltip date cannot.
- A key that does not match `^\d{4}-W\d{1,2}$` is passed through untouched by the
  chart formatters.

## 6. Formatting for display

Display formatters are pure and live next to the code that owns their vocabulary:

| Formatter                                                                      | Home                                | Output                       |
| ------------------------------------------------------------------------------ | ----------------------------------- | ---------------------------- |
| `formatWeekKey`, `formatKcal`, `formatSignedPercent`, `formatLocalDateDisplay` | `shared/utils/stats-chart.theme.ts` | Chart axis, tooltips, badges |
| `DateService.toDisplayString`                                                  | `date.service.ts`                   | `"dd-MM-yyyy"`               |
| `DateService.dateToStringLocalWithDay`                                         | `date.service.ts`                   | `"mié 16"`                   |
| `Intl.NumberFormat('es-ES')`                                                   | wrapper / mapper                    | Numbers, percentages         |

Two things to know:

- **`toDisplayString` is `dd-MM-yyyy`, not `dd/MM/yyyy`.** If a spec asks for
  slashes, it needs `formatLocalDateDisplay` in `stats-chart.theme.ts`; do not
  "fix" `toDisplayString` and change every existing call site.
- `stats-chart.theme.ts` is a known boundary: it now holds display formatters that
  are not chart-theme concerns. They belong in a `format.utils.ts`. That
  relocation is explicitly **out of scope** for `sdd/stats-insights/spec.md`.

## 7. Tests that pin the zone

A date test is only meaningful if the timezone is pinned. Spy on
`Intl.DateTimeFormat.prototype.resolvedOptions` (the established pattern in
`tracking.wrapper.spec.ts`) or pass an explicit `timezone` argument. Otherwise the
suite passes in Madrid and fails in `America/Buenos_Aires`.
