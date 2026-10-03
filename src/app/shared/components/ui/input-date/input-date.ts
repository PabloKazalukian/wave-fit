import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameMonth,
    parseISO,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { DateService } from '../../../../core/services/date.service';
import type { LocalDate } from '../../../interfaces/local-date.interface';

export interface CalendarDay {
    localDate: LocalDate;
    dayNumber: number;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
    inMonth: boolean;
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DISPLAY_FORMAT = 'dd/MM/yyyy';
const LOCAL_DATE_FORMAT = 'yyyy-MM-dd';
const MONTH_FORMAT = 'MMMM yyyy';

/**
 * Comparación de `LocalDate`. Ambas partes son fechas `yyyy-MM-dd` con padding
 * fijo, así que el orden lexicográfico coincide con el cronológico — sin pasar
 * por `Date` ni por sus trampas de zona horaria.
 */
function isBefore(a: LocalDate, b: LocalDate): boolean {
    return a < b;
}

function isAfter(a: LocalDate, b: LocalDate): boolean {
    return a > b;
}

/** Primer día del mes de una `LocalDate`, de vuelta en `LocalDate` (BR-003). */
function firstOfMonth(localDate: LocalDate): LocalDate {
    return format(startOfMonth(parseISO(localDate)), LOCAL_DATE_FORMAT);
}

function shiftMonth(localDate: LocalDate, months: number): LocalDate {
    return firstOfMonth(format(addMonths(parseISO(localDate), months), LOCAL_DATE_FORMAT));
}

/**
 * Control de formulario de fecha genérico (FR-005).
 *
 * Muestra la `LocalDate` ligada en `dd/MM/yyyy` y abre un popover de calendario
 * mensual. Es un `@for` plano sobre celdas calculadas, no una librería de
 * datepicker (NFR-008).
 *
 * Regla importante (BR-003): el grid trabaja sobre `Date` **display-only** y
 * toda comparación o emisión vuelve a `LocalDate` string. Un `Date` nunca
 * toca el dominio — `parseISO('2026-09-01')` en una zona negativa es el día
 * anterior.
 *
 * No escribe en `control` por su cuenta: sólo cuando el usuario elige un día.
 * Abrir, navegar de mes o cerrar dejan el control intacto.
 */
@Component({
    selector: 'app-input-date',
    standalone: true,
    imports: [ReactiveFormsModule, NgClass],
    templateUrl: './input-date.html',
    styles: ``,
    host: {
        '(document:keydown)': 'onKeydown($event)',
        '(document:click)': 'onDocumentClick($event)',
    },
})
export class InputDate {
    private readonly dateSvc = inject(DateService);
    private readonly host = inject(ElementRef<HTMLElement>);

    control = input.required<FormControl<LocalDate | null>>();
    label = input<string>('');
    placeholder = input<string>('dd/mm/aaaa');
    min = input<LocalDate | null>(null);
    max = input<LocalDate | null>(null);
    isDisabled = input<boolean>(false);

    /** Sólo se emite ante una selección real del usuario. */
    dateChange = output<LocalDate>();

    readonly open = signal(false);

    /** Mes visible; arranca en el mes de hoy. */
    private readonly visibleMonth = signal<LocalDate>(firstOfMonth(this.dateSvc.todayLocalDate()));

    readonly showError = computed(() => {
        const control = this.control();
        return control.touched && control.invalid;
    });

    /** Un valor no-calendario se trata como vacío en vez de romper el render. */
    private readonly validValue = computed<LocalDate | null>(() => {
        const value = this.control().value;
        return value !== null && this.dateSvc.isValidLocalDate(value) ? value : null;
    });

    readonly displayValue = computed(() => {
        const value = this.validValue();
        return value === null ? this.placeholder() : format(parseISO(value), DISPLAY_FORMAT);
    });

    readonly hasValue = computed(() => this.validValue() !== null);

    readonly monthLabel = computed(() => {
        const visible = this.visibleMonth();
        return format(parseISO(visible), MONTH_FORMAT, { locale: es });
    });

    readonly days = computed<CalendarDay[]>(() => {
        const visible = this.visibleMonth();
        const monthStart = parseISO(visible);
        const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });

        const today = this.dateSvc.todayLocalDate();
        const selected = this.validValue();
        const min = this.min();
        const max = this.max();

        return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((day) => {
            const localDate = format(day, LOCAL_DATE_FORMAT);
            return {
                localDate,
                dayNumber: day.getDate(),
                isToday: localDate === today,
                isSelected: localDate === selected,
                isDisabled:
                    (min !== null && isBefore(localDate, min)) ||
                    (max !== null && isAfter(localDate, max)),
                inMonth: isSameMonth(day, monthStart),
            };
        });
    });

    readonly weekdayLabels = WEEKDAYS;

    toggle(): void {
        if (this.isDisabled()) return;
        if (this.open()) {
            this.close();
            return;
        }
        // Abrir reencuadra el mes en el valor ligado: si el control cambió por
        // otra vía, el calendario no queda apuntando a un mes viejo.
        this.visibleMonth.set(firstOfMonth(this.validValue() ?? this.dateSvc.todayLocalDate()));
        this.open.set(true);
    }

    close(): void {
        this.open.set(false);
    }

    shiftMonth(months: number): void {
        this.visibleMonth.set(shiftMonth(this.visibleMonth(), months));
    }

    select(day: CalendarDay): void {
        if (day.isDisabled) return;
        this.control().setValue(day.localDate);
        this.control().markAsDirty();
        this.dateChange.emit(day.localDate);
        this.close();
    }

    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape' && this.open()) {
            this.close();
        }
    }

    onDocumentClick(event: MouseEvent): void {
        if (!this.open()) return;
        // Un click dentro del propio componente (incluido el trigger) no cierra.
        if (this.host.nativeElement.contains(event.target as Node)) return;
        this.close();
    }
}
