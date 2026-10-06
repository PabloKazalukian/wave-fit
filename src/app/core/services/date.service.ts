import { Injectable } from '@angular/core';
import { addDays, differenceInCalendarDays, format, isEqual, isValid, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import type { LocalDate, LocalDateRange } from '../../shared/interfaces/local-date.interface';
import { isoWeekStartLocalDateFromKey } from '../../shared/utils/date.utils';

export type { LocalDate, LocalDateRange };

const LOCAL_DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

export interface DayWithString {
    day: string;
    dayNumber: number;
    localDate: LocalDate; // "yyyy-MM-dd"
    displayDate: Date; // Solo para renderizado UI
}

@Injectable({ providedIn: 'root' })
export class DateService {
    /**
     * Obtiene el timezone del usuario desde el navegador.
     * El usuario puede sobreescribirlo en su perfil.
     */
    getUserTimezone(userTimezone?: string): string {
        return userTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    /**
     * Fecha de hoy como LocalDate "yyyy-MM-dd" en el timezone del usuario.
     * ✅ Reemplaza a new Date() para lógica de negocio.
     */
    todayLocalDate(timezone?: string): LocalDate {
        const tz = this.getUserTimezone(timezone);
        return formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');
    }

    /**
     * Avanza N días a partir de un LocalDate.
     * Ejemplo: addDaysToLocalDate("2024-04-16", 6) → "2024-04-22"
     */
    addDaysToLocalDate(localDate: LocalDate, days: number): LocalDate {
        return format(addDays(parseISO(localDate), days), 'yyyy-MM-dd');
    }

    /**
     * Genera el rango de 7 LocalDates a partir de un startDate LocalDate.
     */
    weekRangeLocalDates(startLocalDate: LocalDate): LocalDate[] {
        return Array.from({ length: 7 }, (_, i) => this.addDaysToLocalDate(startLocalDate, i));
    }

    /**
     * Convierte un LocalDate string a Date para uso en la UI (display-only).
     * ✅ Seguro porque parseISO interpreta "yyyy-MM-dd" como local noon,
     *    no como UTC midnight — así se evita el off-by-one en display.
     */
    localDateToDisplay(localDate: LocalDate): Date {
        // parseISO con solo fecha (sin hora) da medianoche local del navegador
        return parseISO(localDate);
    }

    /**
     * Compara si dos LocalDate son el mismo día calendario.
     */
    isSameLocalDate(a: LocalDate, b: LocalDate): boolean {
        return a === b;
    }

    /**
     * Genera los días de la semana a partir de un startDate LocalDate.
     * Retorna datos para display en la UI.
     */
    daysOfWeek(startLocalDate: LocalDate): DayWithString[] {
        return Array.from({ length: 7 }, (_, i) => {
            const localDate = this.addDaysToLocalDate(startLocalDate, i);
            const displayDate = this.localDateToDisplay(localDate);
            return {
                day: format(displayDate, 'EE', { locale: es }),
                dayNumber: parseInt(format(displayDate, 'dd')),
                localDate,
                displayDate,
            };
        });
    }

    /**
     * Formatea fecha para display (ej: "mié 16").
     */
    dateToStringLocalWithDay(localDate: LocalDate): string {
        return format(this.localDateToDisplay(localDate), 'EE dd', { locale: es });
    }

    /**
     * Formatea un LocalDate a "dd-MM-yyyy" para mostrar al usuario.
     */
    toDisplayString(localDate: LocalDate): string {
        return format(this.localDateToDisplay(localDate), 'dd-MM-yyyy');
    }

    /**
     * Formatea un LocalDate a "yyyy-MM-dd" (alias explícito, sin transformación).
     */
    formatDate(localDate: LocalDate): LocalDate {
        return localDate; // Ya es LocalDate, no necesita conversión
    }

    /**
     * @deprecated Usar isSameLocalDate() para comparar LocalDate strings.
     * Mantener por compatibilidad con componentes de display que usan Date.
     */
    isEqualDate(date1: Date, date2: Date): boolean {
        return isEqual(date1, date2);
    }

    /**
     * @deprecated Usar isSameLocalDate() para lógica de negocio.
     * Solo usar en componentes de display que trabajen con Date.
     */
    isSameDay(date1: Date, date2: Date): boolean {
        return isEqual(
            parseISO(format(date1, 'yyyy-MM-dd')),
            parseISO(format(date2, 'yyyy-MM-dd')),
        );
    }

    /**
     * Genera startDate + endDate como LocalDates para la semana actual.
     */
    todayWeekRange(timezone?: string): { start: LocalDate; end: LocalDate } {
        const start = this.todayLocalDate(timezone);
        const end = this.addDaysToLocalDate(start, 6);
        return { start, end };
    }

    /**
     * Valida que un string sea un LocalDate real: no basta con la forma
     * "yyyy-MM-dd", el día tiene que existir en el calendario.
     *
     * Ejemplo: isValidLocalDate("2026-02-30") → false
     */
    isValidLocalDate(value: string | null | undefined): boolean {
        if (typeof value !== 'string' || !LOCAL_DATE_SHAPE.test(value)) {
            return false;
        }
        const parsed = parseISO(value);
        return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === value;
    }

    /**
     * Diferencia en días calendario entre dos LocalDates, con signo.
     * Positiva cuando `to` es posterior a `from`, negativa cuando es anterior,
     * cero cuando son el mismo día (no cuenta ambos extremos).
     *
     * Ejemplo: daysBetween("2026-01-01", "2026-01-02") → 1
     */
    daysBetween(from: LocalDate, to: LocalDate): number {
        return differenceInCalendarDays(parseISO(to), parseISO(from));
    }

    /**
     * Rango de los últimos N días hasta hoy, inclusive.
     * El rango cubre N - 1 días de diferencia: lastNDays(30) → 29 días.
     *
     * Ejemplo: lastNDays(30) → { from: "hoy-29", to: "hoy" }
     */
    lastNDays(days: number, timezone?: string): LocalDateRange {
        const to = this.todayLocalDate(timezone);
        const from = this.addDaysToLocalDate(to, -(days - 1));
        return { from, to };
    }

    /**
     * Lunes de una semana ISO a partir de su weekKey ("2026-W40" → "2026-09-28").
     *
     * El weekKey viene del backend: solo se parsea, nunca se deriva del rango.
     * Devuelve null ante una clave mal formada o ante una semana ISO que el año
     * no tiene (por ejemplo "2025-W53", porque 2025 tiene 52 semanas ISO).
     *
     * Delega en la función pura porque los mappers de charts la necesitan para
     * el tooltip y no pueden inyectar este servicio.
     */
    isoWeekStartLocalDate(weekKey: string): LocalDate | null {
        return isoWeekStartLocalDateFromKey(weekKey);
    }
}
