import { Component, computed, effect, inject, Signal, signal } from '@angular/core';
import type { Options } from 'highcharts';
import { StatsInsightsState } from '../../../core/services/stats/stats-insights.state';
import type {
    LocalDateRange,
    StatsInsightsMetricOption,
    StatsInsightsSection,
    TrendLabelVM,
} from '../../../shared/interfaces/stats-insights.interface';
import {
    buildCaloriesChartOptions,
    buildExerciseTrendChartOptions,
    buildForgottenMusclesChartOptions,
    buildOneRmWeeklyChartOptions,
    buildVolumeByExerciseChartOptions,
    buildVolumeByMuscleChartOptions,
    buildVolumeTotalChartOptions,
} from '../../../shared/utils/stats-insights-chart.mapper';
import {
    formatLocalDateDisplay,
    formatSignedPercent,
    formatWeight,
} from '../../../shared/utils/stats-chart.theme';
import { StatsInsightsCard } from '../../../shared/components/widgets/stats/stats-insights-card/stats-insights-card';
import { StatsInsightsControls } from '../../../shared/components/widgets/stats/stats-insights-controls/stats-insights-controls';
import { Notification } from '../../../shared/components/ui/notification/notification';
import { TextLink } from '../../../shared/components/ui/text-link/text-link';

/** Texto del badge de tendencia (product language). */
const TREND_LABEL_TEXT: Record<TrendLabelVM, string> = {
    UP: 'Subiendo',
    FLAT: 'Estable',
    DOWN: 'Bajando',
    INSUFFICIENT: 'Sin datos suficientes',
};

interface SectionView {
    section: StatsInsightsSection;
    title: string;
    emptyMessage: string;
    charts: readonly Signal<Options | null>[];
}

/**
 * `/stats/insights`: analítica por rango de fechas (FR-020, FR-023).
 *
 * El flujo es encadenado y explícito: se elige **una** métrica, se ajusta el
 * rango y se aprieta "Ver gráficas". Nada se consulta al entrar, así que el
 * constructor no dispara nada y las seis secciones arrancan en `null`.
 *
 * Orquestador delgado a propósito: no consulta, no persiste y no arma options de
 * Highcharts — traduce cada payload con los mappers puros y delega la forma en
 * `app-stats-insights-card` / `app-stats-chart`. Las reglas que importan viven donde
 * se pueden probar solas: la cancelación en el `switchMap` del state, los caps en
 * el mapper, la validación del rango en el widget, el esqueleto-vs-spinner en la
 * card.
 *
 * Las seis secciones siguen teniendo sus `computed` de options —son lo que hace
 * que cambiar el tipo de chart más adelante sea una línea por sección— pero sólo
 * la seleccionada se materializa como card.
 */
@Component({
    selector: 'app-stats-insights-page',
    standalone: true,
    imports: [StatsInsightsControls, StatsInsightsCard, Notification, TextLink],
    templateUrl: './stats-insights.html',
    styles: ``,
})
export class StatsInsightsPage {
    private readonly state = inject(StatsInsightsState);

    readonly seedRange = this.state.range;

    private readonly optionsFor = <T>(
        section: StatsInsightsSection,
        build: (data: T) => Options | null,
    ) =>
        computed(() => {
            const data = this.state.data(section)();
            return data ? build(data as T) : null;
        });

    private view(
        section: StatsInsightsSection,
        title: string,
        emptyMessage: string,
        charts: readonly Signal<Options | null>[],
    ): SectionView {
        return { section, title, emptyMessage, charts };
    }

    /**
     * Las seis secciones, en el orden de la tabla del Spec. `charts` es un signal
     * por chart ya mapeado a `Highcharts.Options`.
     */
    readonly views: readonly SectionView[] = [
        this.view('oneRm', '1RM semanal por ejercicio', 'No hay 1RM en este rango.', [
            this.optionsFor('oneRm', buildOneRmWeeklyChartOptions),
        ]),
        this.view('volume', 'Volumen semanal', 'No hay volumen en este rango.', [
            this.optionsFor('volume', buildVolumeByExerciseChartOptions),
            this.optionsFor('volume', buildVolumeByMuscleChartOptions),
        ]),
        this.view('volumeTotal', 'Volumen total semanal', 'No hay volumen total en este rango.', [
            this.optionsFor('volumeTotal', buildVolumeTotalChartOptions),
        ]),
        this.view('calories', 'Calorías semanales', 'No hay sesiones extra en este rango.', [
            this.optionsFor('calories', buildCaloriesChartOptions),
        ]),
        this.view('forgottenMuscles', 'Músculos olvidados', '¡Todos los músculos están al día!', [
            this.optionsFor('forgottenMuscles', buildForgottenMusclesChartOptions),
        ]),
        this.view('exerciseTrend', 'Tendencia por ejercicio', 'No hay tendencia calculable.', [
            this.optionsFor('exerciseTrend', buildExerciseTrendChartOptions),
        ]),
    ];

    /** Las mismas seis, en forma de opciones del select (FR-022). */
    readonly metricOptions: readonly StatsInsightsMetricOption[] = this.views.map((v) => ({
        section: v.section,
        label: v.title,
    }));

    /** Sección elegida en el select; `null` hasta que el usuario elija una. */
    readonly selected = signal<StatsInsightsSection | null>(null);

    /**
     * La card en pantalla, o `null` si no se eligió métrica (AC-013).
     *
     * Filtra por `selected` a propósito: sin ese filtro, cambiar de métrica dejaría
     * en pantalla el chart anterior bajo el título de la nueva, que a simple vista
     * parece correcto.
     */
    readonly visibleCard = computed<SectionView | null>(() => {
        const section = this.selected();
        return section === null ? null : (this.views.find((v) => v.section === section) ?? null);
    });

    /**
     * Con un solo select a la vez hay a lo sumo una sección en vuelo, así que un
     * `computed` sobre esa sección alcanza. Si volviera el multi-select, esto
     * pasaría a ser un contador dentro del state.
     */
    readonly isRunning = computed(() => {
        const section = this.selected();
        return section !== null && this.state.entry(section)().loading;
    });

    /**
     * Rango con el que se corrió la sección visible, como subtítulo. Sale del
     * applied range del state y no del pendiente, así que el encabezado nunca
     * describe un chart con un rango que el usuario todavía no corrió (FR-023).
     */
    readonly rangeLabel = computed(() => {
        const section = this.selected();
        const range = section === null ? null : this.state.appliedRange(section)();
        if (range === null) return null;
        return `${formatLocalDateDisplay(range.from)} → ${formatLocalDateDisplay(range.to)}`;
    });

    /**
     * Ambas listas se dibujan siempre que haya filas, incluso si su card quedó
     * vacía: una lista de tendencia sin barras (todo `INSUFFICIENT`) es
     * información, y esconderla detrás del empty state perdería los nombres.
     */
    readonly forgottenMuscleList = computed(() => this.state.data('forgottenMuscles')() ?? []);
    readonly trendList = computed(() => this.state.data('exerciseTrend')() ?? []);

    readonly notification = signal<{ type: 'error'; message: string } | null>(null);

    private readonly onError = effect(() => {
        const card = this.visibleCard();
        if (card === null) return;
        const error = this.state.entry(card.section)().error;
        if (error) {
            this.notification.set({ type: 'error', message: error });
        }
    });

    readonly formatWeight = formatWeight;
    readonly formatSignedPercent = formatSignedPercent;
    readonly trendLabels = TREND_LABEL_TEXT;

    /** Único camino a la red: se elige la métrica y recién ahí se consulta. */
    onRun(event: { section: StatsInsightsSection; range: LocalDateRange }): void {
        this.selected.set(event.section);
        this.state.run(event.section, event.range);
    }

    hasData(section: StatsInsightsSection): boolean {
        return this.state.data(section)() !== null;
    }

    /**
     * `volume` está vacía sólo si lo están **sus dos** charts: mirar uno solo
     * ocultaría el otro justo cuando sí tiene datos.
     */
    isEmpty(section: StatsInsightsSection): boolean {
        const entry = this.state.entry(section)();
        const charts = this.views.find((v) => v.section === section)?.charts ?? [];
        return !entry.loading && entry.error === null && charts.every((c) => c() === null);
    }

    errorFor(section: StatsInsightsSection): string | null {
        return this.state.entry(section)().error;
    }

    retry(section: StatsInsightsSection): void {
        this.state.retry(section);
    }
}
