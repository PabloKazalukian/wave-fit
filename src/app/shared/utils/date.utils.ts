import { fromZonedTime } from 'date-fns-tz';

export type LocalDate = string; // "yyyy-MM-dd"

export const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Convierte un LocalDate "yyyy-MM-dd" + timezone a un Date UTC.
 * El Date resultante representa el inicio del día (00:00:00) en esa timezone.
 */
export function localDateToUtc(localDate: LocalDate, timezone: string = DEFAULT_TIMEZONE): Date {
    return fromZonedTime(`${localDate} 00:00:00`, timezone);
}
