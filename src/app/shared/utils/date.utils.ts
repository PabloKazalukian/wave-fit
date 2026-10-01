import {
    addWeeks,
    format,
    getISOWeek,
    getISOWeekYear,
    isValid,
    parseISO,
    startOfWeek,
} from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { LocalDate } from '../interfaces/local-date.interface';

export type { LocalDate };

export const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const ISO_WEEK_KEY_SHAPE = /^(\d{4})-W(\d{1,2})$/;

const MIN_ISO_WEEK = 1;

const MAX_ISO_WEEK = 53;

/**
 * Convierte un LocalDate "yyyy-MM-dd" + timezone a un Date UTC.
 * El Date resultante representa el inicio del día (00:00:00) en esa timezone.
 */
export function localDateToUtc(localDate: LocalDate, timezone: string = DEFAULT_TIMEZONE): Date {
    return fromZonedTime(`${localDate} 00:00:00`, timezone);
}

/**
 * Convierte un datetime ISO del backend a un LocalDate en la timezone indicada.
 *
 * Se usa en el límite de la API: el backend devuelve un instante ISO completo
 * ("2026-05-01T02:30:00.000Z"), pero el dominio necesita solo el día calendario
 * que el usuario vio. Sin `timezone` explícita se usa la del navegador.
 *
 * NUNCA usar `new Date(iso).toISOString().slice(0, 10)`: eso recorta en UTC y
 * corre el día un día hacia atrás en zonas negativas.
 */
export function apiDateTimeToLocalDate(iso: string, timezone?: string): LocalDate {
    const tz = timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    return formatInTimeZone(new Date(iso), tz, 'yyyy-MM-dd');
}

/**
 * Lunes de una semana ISO a partir de su weekKey ("2026-W40" → "2026-09-28").
 *
 * El weekKey llega del backend: solo se parsea, nunca se deriva del rango.
 * Devuelve null ante una clave mal formada o ante una semana ISO que el año no
 * tiene (p. ej. "2025-W53", porque 2025 tiene 52 semanas ISO).
 *
 * Función pura: los mappers de charts la necesitan para el tooltip y no pueden
 * inyectar `DateService`, así que la implementación vive acá y el servicio
 * delega.
 */
export function isoWeekStartLocalDateFromKey(weekKey: string): LocalDate | null {
    const match = ISO_WEEK_KEY_SHAPE.exec(weekKey);
    if (!match) {
        return null;
    }

    const isoWeekYear = Number(match[1]);
    const isoWeek = Number(match[2]);
    if (isoWeek < MIN_ISO_WEEK || isoWeek > MAX_ISO_WEEK) {
        return null;
    }

    // El 4 de enero siempre cae en la semana ISO 1, así que el lunes de esa
    // semana es el lunes en o antes del 4 de enero.
    const january4th = parseISO(`${isoWeekYear}-01-04`);
    if (!isValid(january4th)) {
        return null;
    }

    const monday = addWeeks(startOfWeek(january4th, { weekStartsOn: 1 }), isoWeek - 1);

    // addWeeks desbordaría a la semana siguiente (o a otro año) si la clave
    // no existiera, así que se verifica la vuelta completa.
    if (getISOWeekYear(monday) !== isoWeekYear || getISOWeek(monday) !== isoWeek) {
        return null;
    }

    return format(monday, 'yyyy-MM-dd');
}
