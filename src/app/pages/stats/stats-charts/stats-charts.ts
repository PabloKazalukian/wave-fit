import { Component, computed, effect, inject, Signal, signal } from '@angular/core';
import type { Options } from 'highcharts';
import {
    StatsChartsState,
    StatsChartsSectionEntry,
} from '../../../core/services/stats/stats-charts.state';
import type {
    LocalDateRange,
    StatsChartsSection,
    TrendLabelVM,
} from '../../../shared/interfaces/stats-charts.interface';
import {
    buildCaloriesChartOptions,
    buildExerciseTrendChartOptions,
    buildForgottenMusclesChartOptions,
    buildOneRmWeeklyChartOptions,
    buildVolumeByExerciseChartOptions,
    buildVolumeByMuscleChartOptions,
    buildVolumeTotalChartOptions,
} from '../../../shared/utils/stats-charts-chart.mapper';
import {
    formatLocalDateDisplay,
    formatSignedPercent,
    formatWeight,
} from '../../../shared/utils/stats-chart.theme';
import { StatsSection } from '../../../shared/components/ui/stats/stats-section/stats-section';
import { StatsChart } from '../../../shared/components/widgets/stats/stats-chart/stats-chart';
import { StatsDateRange } from '../../../shared/components/widgets/stats/stats-date-range/stats-date-range';
import { Notification } from '../../../shared/components/ui/notification/notification';
import { TextLink } from '../../../shared/components/ui/text-link/text-link';

/** Texto del badge de tendencia (product language). */
const TREND_LABEL_TEXT: Record<TrendLabelVM, string> = {
    UP: 'Subiendo',
    FLAT: 'Estable',
    DOWN: 'Bajando',
    INSUFFICIENT: 'Sin datos suficientes',
};

/**
 * Una card = una sección del state + sus charts. El template itera sobre esta
 * lista en vez de repetir seis veces el mismo bloque de bindings; lo único que
 * distingue a las secciones es el contenido proyectado, que sí va caso por caso.
 */
interface StatsChartsCard {
    section: StatsChartsSection;
    title: string;
    emptyMessage: string;
    charts: readonly Signal<Options | null>[];
    loading: Signal<boolean>;
    empty: Signal<boolean>;
    refreshing: Signal<boolean>;
}

/**
 * `/stats/charts`: analítica por rango de fechas (FR-020).
 *
 * Orquestador delgado a propósito: no consulta, no persiste y no arma options de
 * Highcharts — traduce cada payload con los mappers puros y delega la forma en
 * `app-stats-section` / `app-stats-chart`. Las reglas que importan viven donde se
 * pueden probar solas: la cancelación en el `switchMap` del state, los caps en el
 * mapper, la validación del rango en el widget.
 *
 * `refreshing` y `empty` son **derivados**, no estado guardado: guardados, podrían
 * discrepar de `loading` y perder el "dato viejo en pantalla con spinner".
 */
@Component({
    selector: 'app-stats-charts-page',
    standalone: true,
    imports: [StatsSection, StatsChart, StatsDateRange, Notification, TextLink],
    templateUrl: './stats-charts.html',
    styles: ``,
})
export class StatsChartsPage {
    private readonly state = inject(StatsChartsState);

    readonly range = this.state.range;

    readonly entries: Record<StatsChartsSection, Signal<StatsChartsSectionEntry>> = {
        oneRm: this.state.entry('oneRm'),
        volume: this.state.entry('volume'),
        volumeTotal: this.state.entry('volumeTotal'),
        calories: this.state.entry('calories'),
        forgottenMuscles: this.state.entry('forgottenMuscles'),
        exerciseTrend: this.state.entry('exerciseTrend'),
    };

    private readonly optionsFor = <T>(
        section: StatsChartsSection,
        build: (data: T) => Options | null,
    ) =>
        computed(() => {
            const data = this.state.data(section)();
            return data ? build(data as T) : null;
        });

    /** Las seis cards, en el orden de la tabla del Spec. */
    readonly cards: readonly StatsChartsCard[] = [
        this.card('oneRm', '1RM semanal por ejercicio', 'No hay 1RM en este rango.', [
            this.optionsFor('oneRm', buildOneRmWeeklyChartOptions),
        ]),
        this.card('volume', 'Volumen semanal', 'No hay volumen en este rango.', [
            this.optionsFor('volume', buildVolumeByExerciseChartOptions),
            this.optionsFor('volume', buildVolumeByMuscleChartOptions),
        ]),
        this.card('volumeTotal', 'Volumen total semanal', 'No hay volumen total en este rango.', [
            this.optionsFor('volumeTotal', buildVolumeTotalChartOptions),
        ]),
        this.card('calories', 'Calorías semanales', 'No hay sesiones extra en este rango.', [
            this.optionsFor('calories', buildCaloriesChartOptions),
        ]),
        this.card('forgottenMuscles', 'Músculos olvidados', '¡Todos los músculos están al día!', [
            this.optionsFor('forgottenMuscles', buildForgottenMusclesChartOptions),
        ]),
        this.card('exerciseTrend', 'Tendencia por ejercicio', 'No hay tendencia calculable.', [
            this.optionsFor('exerciseTrend', buildExerciseTrendChartOptions),
        ]),
    ];

    private card(
        section: StatsChartsSection,
        title: string,
        emptyMessage: string,
        charts: readonly Signal<Options | null>[],
    ): StatsChartsCard {
        const hasData = () => this.state.data(section)() !== null;
        return {
            section,
            title,
            emptyMessage,
            charts,
            // El shell precedencea `loading` sobre el contenido proyectado, así
            // que `loading` sólo puede ser `true` en la **primera** carga: si no,
            // el esqueleto taparía el chart del rango anterior durante el refetch
            // y `refreshing` nunca llegaría a verse (FR-009, AC-005).
            loading: computed(() => this.entries[section]().loading && !hasData()),
            // `volume` está vacía sólo si lo están **sus dos** charts: mirar uno
            // solo ocultaría el otro justo cuando sí tiene datos.
            empty: computed(() => {
                const entry = this.entries[section]();
                return !entry.loading && entry.error === null && charts.every((c) => c() === null);
            }),
            // `refreshing` = carga en vuelo **y** payload previo en pantalla: sin
            // el segundo término la primera carga se dibujaría como spinner en
            // vez de skeleton, y con él el chart anterior sigue visible (FR-009).
            refreshing: computed(() => this.entries[section]().loading && hasData()),
        };
    }

    /**
     * Ambas listas se dibujan siempre que haya filas, incluso si su card quedó
     * vacía: una lista de tendencia sin barras (todo `INSUFFICIENT`) es
     * información, y esconderla detrás del empty state perdería los nombres.
     */
    readonly forgottenMuscleList = computed(() => this.state.data('forgottenMuscles')() ?? []);
    readonly trendList = computed(() => this.state.data('exerciseTrend')() ?? []);

    /** Rango vigente como subtítulo de cada card: son queries on demand, no hay `computedAt`. */
    readonly rangeLabel = computed(() => {
        const range = this.range();
        return `${formatLocalDateDisplay(range.from)} → ${formatLocalDateDisplay(range.to)}`;
    });

    readonly notification = signal<{ type: 'error'; message: string } | null>(null);

    private readonly firstError = computed(() => {
        for (const entry of Object.values(this.entries)) {
            const error = entry().error;
            if (error) return error;
        }
        return null;
    });

    private readonly onError = effect(() => {
        const error = this.firstError();
        if (error) {
            this.notification.set({ type: 'error', message: error });
        }
    });

    readonly formatWeight = formatWeight;
    readonly formatSignedPercent = formatSignedPercent;
    readonly trendLabels = TREND_LABEL_TEXT;

    constructor() {
        this.state.load();
    }

    onRangeChange(range: LocalDateRange): void {
        this.state.applyRange(range);
    }

    retry(section: StatsChartsSection): void {
        this.state.retry(section);
    }
}
