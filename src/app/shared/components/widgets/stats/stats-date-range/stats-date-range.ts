import {
    Component,
    computed,
    effect,
    inject,
    input,
    output,
    signal,
    untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateService } from '../../../../../core/services/date.service';
import type { LocalDate, LocalDateRange } from '../../../../interfaces/local-date.interface';
import {
    STATS_INSIGHTS_MAX_RANGE_DAYS,
    STATS_INSIGHTS_RANGE_PRESETS,
    type StatsDateRangePreset,
} from '../../../../interfaces/stats-insights.interface';
import { BtnComponent } from '../../../ui/btn/btn';
import { InputDate } from '../../../ui/input-date/input-date';

const MISSING_BOUND_MESSAGE = 'Elegí una fecha de inicio y de fin.';
const INVALID_DATE_MESSAGE = 'Alguna de las fechas no es una fecha válida.';

/** Cuál de los dos extremos acaba de cambiar. */
type Bound = 'from' | 'to';

/**
 * Selector de rango de fechas para `/stats/insights` (FR-006, FR-007).
 *
 * Compone dos `app-input-date` sobre un `FormGroup` propio y una fila de
 * presets. El estado del rango vive aquí, no en el padre: el padre sólo recibe
 * un rango ya resuelto a través de `rangeChange`.
 *
 * Una sola validación, dos comportamientos (FR-006 + `plan.md`): un rango
 * desordenado se **corrige** — hay un valor pretendido evidente — mientras que
 * lo que no admite corrección unívoca (vacío, fecha no-calendaria, span sobre
 * `maxDays`) se **rechaza** con un mensaje inline y sin emitir, para evitar un
 * `BadRequest` de ida y vuelta. El backend sigue siendo la autoridad.
 */
@Component({
    selector: 'app-stats-date-range',
    standalone: true,
    imports: [ReactiveFormsModule, InputDate, BtnComponent],
    templateUrl: './stats-date-range.html',
    styles: ``,
})
export class StatsDateRange {
    private readonly dateSvc = inject(DateService);

    from = input.required<LocalDate>();
    to = input.required<LocalDate>();
    maxDays = input<number>(STATS_INSIGHTS_MAX_RANGE_DAYS);
    presets = input<readonly StatsDateRangePreset[]>(STATS_INSIGHTS_RANGE_PRESETS);
    isDisabled = input<boolean>(false);

    /** Se emite sólo con un rango válido (o corregido). */
    rangeChange = output<LocalDateRange>();
    /** Mensaje en español, o `null` cuando el rango es válido. */
    rangeInvalid = output<string | null>();

    readonly form = new FormGroup({
        from: new FormControl<LocalDate | null>(null),
        to: new FormControl<LocalDate | null>(null),
    });

    /**
     * Rango resuelto, o `null` si está en estado inválido. Es un signal (y no
     * una lectura del `FormGroup`) porque `activePresetDays` lo necesita como
     * dependencia: los controles del formulario no notifican a los `computed`.
     */
    readonly value = signal<LocalDateRange | null>(null);

    readonly invalidMessage = signal<string | null>(null);

    /** Preset que representa el rango actual, o `null` si es a medida. */
    readonly activePresetDays = computed<number | null>(() => {
        const range = this.value();
        if (range === null) return null;
        // Un preset siempre termina hoy, así que comparar contra `today` es lo
        // que distingue "últimos 30 días" de un rango de 30 días arbitrario.
        if (range.to !== this.dateSvc.todayLocalDate()) return null;
        const span = this.dateSvc.daysBetween(range.from, range.to) + 1;
        return this.presets().find((preset) => preset.days === span)?.days ?? null;
    });

    constructor() {
        // Cada control se suscribe por separado, y no al `FormGroup`, porque la
        // corrección de un rango desordenado necesita saber *qué* extremo movió
        // el usuario: ése es el que manda y el otro lo acompaña (FR-006). Con
        // un `valueChanges` único del grupo esa información se pierde.
        this.form.controls.from.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe(() => this.evaluate('from'));
        this.form.controls.to.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe(() => this.evaluate('to'));

        // El padre puede empujar un rango (p. ej. al montar con el rango por
        // defecto). Se refleja sin emitir: el padre ya tiene ese rango, y
        // devolverlo dispararía un refetch de las seis queries al montar.
        effect(() => {
            const from = this.from();
            const to = this.to();
            untracked(() => this.reflect({ from, to }));
        });
    }

    applyPreset(preset: StatsDateRangePreset): void {
        if (this.isDisabled()) return;
        this.solve(this.dateSvc.lastNDays(preset.days));
    }

    isPresetActive(preset: StatsDateRangePreset): boolean {
        return this.activePresetDays() === preset.days;
    }

    private evaluate(moved: Bound): void {
        const from = this.form.controls.from.value;
        const to = this.form.controls.to.value;

        if (from === null || to === null) {
            this.reject(MISSING_BOUND_MESSAGE);
            return;
        }
        if (!this.dateSvc.isValidLocalDate(from) || !this.dateSvc.isValidLocalDate(to)) {
            this.reject(INVALID_DATE_MESSAGE);
            return;
        }
        if (this.dateSvc.daysBetween(from, to) < 0) {
            // FR-006: manda el extremo que el usuario acaba de mover y el otro
            // se ajusta a él. Corregir así deja siempre un span de 0, que cabe
            // en cualquier `maxDays`; por eso aquí no se comprueba el límite.
            this.solve(moved === 'from' ? { from, to: from } : { from: to, to });
            return;
        }
        if (this.dateSvc.daysBetween(from, to) > this.maxDays()) {
            this.reject(`El rango no puede superar los ${this.maxDays()} días.`);
            return;
        }
        this.solve({ from, to });
    }

    /** Refleja un rango en los inputs y en el estado, sin emitir. */
    private reflect(range: LocalDateRange): void {
        this.invalidMessage.set(null);
        this.form.controls.from.setValue(range.from, { emitEvent: false });
        this.form.controls.to.setValue(range.to, { emitEvent: false });
        this.value.set(range);
    }

    /** Acepta un rango, lo refleja y lo emite. */
    private solve(range: LocalDateRange): void {
        this.reflect(range);
        this.rangeChange.emit(range);
    }

    private reject(message: string): void {
        this.value.set(null);
        this.invalidMessage.set(message);
        this.rangeInvalid.emit(message);
    }
}
