import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { LocalDate, LocalDateRange } from '../../../../interfaces/local-date.interface';
import type {
    StatsInsightsMetricOption,
    StatsInsightsSection,
} from '../../../../interfaces/stats-insights.interface';
import { SelectType } from '../../../../interfaces/input.interface';
import { BtnComponent } from '../../../ui/btn/btn';
import { SpinnerComponent } from '../../../ui/icon/spinner';
import { FormSelectComponent } from '../../../ui/select/select';
import { StatsDateRange } from '../stats-date-range/stats-date-range';

/** Texto del botón (product language). */
const RUN_TEXT = 'Ver gráficas';
/** Placeholder del select: la elección está vacía hasta que el usuario elige. */
const METRIC_PLACEHOLDER = 'Elegí una métrica';
const METRIC_LABEL = '¿Qué querés graficar?';

/**
 * La cadena de entradas de `/stats/insights`: métrica → rango → "Ver gráficas"
 * (FR-022).
 *
 * Es un control **presentacional y mudo**: no tiene referencia al
 * `StatsInsightsState`, no importa Apollo y no abre ninguna subscription. Su único
 * output es `run`. Eso es lo que hace que "cambiar una fecha no consulta" sea una
 * propiedad estructural y no una disciplina que haya que recordar (FR-023,
 * NFR-011).
 *
 * El rango que se emite es el **pendiente**, no el seed: el `from`/`to` de entrada
 * son sólo el punto de partida, y cualquier edición interna (o preset) pasa por
 * `pendingRange`. Si se emitiera el seed, el botón volvería a consultar el rango
 * anterior al que el usuario acaba de corregir.
 */
@Component({
    selector: 'app-stats-insights-controls',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        FormSelectComponent,
        StatsDateRange,
        BtnComponent,
        SpinnerComponent,
    ],
    templateUrl: './stats-insights-controls.html',
    styles: ``,
})
export class StatsInsightsControls {
    options = input.required<readonly StatsInsightsMetricOption[]>();
    from = input.required<LocalDate>();
    to = input.required<LocalDate>();
    /** Hay una sección visible en vuelo. Bloquea el botón y muestra el spinner. */
    isRunning = input<boolean>(false);

    /** Única salida del widget: la sección elegida con el rango pendiente. */
    run = output<{ section: StatsInsightsSection; range: LocalDateRange }>();

    /**
     * El `app-select` binds un `FormControl<string | null>` (`select.ts`), así que
     * el valor viaja como string. `selectedSection` es quien lo traduce a
     * `StatsInsightsSection` validando contra `options`, así que un valor fuera del
     * contrato no llega al state como una sección inventada.
     */
    readonly metricControl = new FormControl<string | null>(null);

    /**
     * Espejo del `FormControl` en un signal. No es decoración: `computed` sólo
     * recalcula cuando una dependencia **signal** cambia, y `FormControl.value` es
     * una propiedad común, así que leerla dentro de un `computed` lo dejaría
     * cacheado para siempre y el botón nunca se habilitaría.
     */
    private readonly metricValue = signal<string | null>(null);

    private readonly pendingRange = signal<LocalDateRange>({ from: '', to: '' });

    readonly selectOptions = computed<SelectType[]>(() =>
        this.options().map((option) => ({ name: option.label, value: option.section })),
    );

    readonly selectedSection = computed<StatsInsightsSection | null>(() => {
        const value = this.metricValue();
        return this.options().find((option) => option.section === value)?.section ?? null;
    });

    readonly canRun = computed(() => this.selectedSection() !== null && !this.isRunning());

    // Exuestos para el template: el copy vive acá, no inline en el HTML.
    readonly runText = RUN_TEXT;
    readonly metricPlaceholder = METRIC_PLACEHOLDER;
    readonly metricLabel = METRIC_LABEL;

    constructor() {
        this.metricControl.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe((value) => this.metricValue.set(value));

        // El seed del padre se refleja sin emitir: el padre ya conoce ese rango y
        // devolverlo dispararía una consulta sin que nadie la pidiera.
        effect(() => {
            const from = this.from();
            const to = this.to();
            untracked(() => this.pendingRange.set({ from, to }));
        });
    }

    onRangeChange(range: LocalDateRange): void {
        this.pendingRange.set(range);
    }

    submit(): void {
        const section = this.selectedSection();
        if (section === null || this.isRunning()) return;
        this.run.emit({ section, range: this.pendingRange() });
    }
}
