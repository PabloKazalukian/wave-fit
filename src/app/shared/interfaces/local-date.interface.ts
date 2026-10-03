/**
 * Canonical `LocalDate` type for the whole app.
 *
 * BR-003: a LocalDate is a calendar day with no timezone ambiguity — the string
 * format is always "yyyy-MM-dd".
 *
 * Use it for: backend communication and business comparisons.
 * Do not use: `new Date("yyyy-MM-dd")`, `toISOString()` for domain dates, or any
 * `Date` that leaks into a comparison.
 */
export type LocalDate = string; // "yyyy-MM-dd"

/**
 * An inclusive span of calendar days: `[from, to]`.
 * The number of days it covers is `daysBetween(from, to) + 1`.
 */
export interface LocalDateRange {
    from: LocalDate;
    to: LocalDate;
}
