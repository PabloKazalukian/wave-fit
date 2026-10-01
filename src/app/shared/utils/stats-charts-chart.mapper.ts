import type {
    Options,
    Point,
    PointOptionsObject,
    SeriesBarOptions,
    SeriesColumnOptions,
    SeriesLineOptions,
} from 'highcharts';
import {
    CaloriesWeekVM,
    ExerciseTrendVM,
    ForgottenMuscleVM,
    OneRmExerciseVM,
    STATS_CHARTS_MAX_1RM_SERIES,
    STATS_CHARTS_MAX_VOLUME_SERIES,
    STATS_CHARTS_OTHERS_SERIES_NAME,
    VolumeTotalWeekVM,
    VolumeWeekVM,
} from '../interfaces/stats-charts.interface';
import {
    DELOAD_POINT_COLOR,
    DIVERGING_BAR_CHART_HEIGHT,
    formatKcal,
    formatSignedPercent,
    formatWeekKey,
    formatWeight,
    LONG_LABEL_CHART_HEIGHT,
    MULTI_SERIES_CHART_HEIGHT,
    TREND_LABEL_COLORS,
    WEEKLY_CHART_HEIGHT,
    withStatsTheme,
} from './stats-chart.theme';
import { isoWeekStartLocalDateFromKey } from './date.utils';

const TEXT2 = '#adadad';
const PRIMARY = '#50C878';
const VOLUME_STACK = 'volume';
const INSUFFICIENT = 'INSUFFICIENT';

/**
 * Campos extra que los formatters y los dataLabels leen del punto. Highcharts
 * los deja pasar en runtime aunque `PointOptionsObject` no los declare, así que
 * se intersectan aparte: intersectar con `Point` arrastraría sus propiedades
 * requeridas (series, plotX, plotY…) a la forma del dato serializado.
 *
 * Ojo con los nombres: `sets` ya existe en `PointOptionsObject` y significa
 * drilldown (`string[]`), así que el conteo de series va como `seriesCount`.
 */
interface MetricPointExtras {
    weightUsed?: number | null;
    reps?: number | null;
    participated?: boolean;
    seriesCount?: number;
    weeksWithoutWork?: number;
    lastTrainedAt?: string | null;
    deltaPct?: number | null;
    label?: string;
}

type MetricPoint = Point & MetricPointExtras;

type MetricPointOptions = PointOptionsObject & MetricPointExtras;

export interface VolumeSeriesSelection {
    keptIds: string[];
    otherIds: string[];
}

// ── helpers de categorías ──────────────────────────────────────────────────

/** Semana ISO → etiqueta de eje, deduplicando y conservando el orden de aparición. */
export function weekCategories(weekKeys: string[]): string[] {
    const seen = new Set<string>();
    return weekKeys.filter((key) => (seen.has(key) ? false : (seen.add(key), true)));
}

const axisCategories = (weekKeys: string[]): string[] => weekKeys.map(formatWeekKey);

const weekAxis = (weekKeys: string[]) => ({
    categories: axisCategories(weekKeys),
    tickmarkPlacement: 'on' as const,
    labels: { rotation: 0 },
});

const displayLocalDate = (localDate: string): string => localDate.split('-').reverse().join('/');

// ── 1RM semanal ────────────────────────────────────────────────────────────

const participatingWeeks = (exercise: OneRmExerciseVM): number =>
    exercise.weeks.filter((w) => w.participated).length;

/**
 * Selecciona los ejercicios con más semanas *participadas*. El desempate por
 * nombre hace la selección determinista: sin él, dos ejercicios empatados
 * podrían entrar o salir según el orden del backend y el gráfico cambiaría
 * entre dos cargas de la misma query.
 */
export function selectTop1RmExercises(
    exercises: OneRmExerciseVM[],
    limit: number,
): OneRmExerciseVM[] {
    return [...exercises]
        .sort((a, b) => {
            const byWeeks = participatingWeeks(b) - participatingWeeks(a);
            return byWeeks !== 0 ? byWeeks : a.name.localeCompare(b.name);
        })
        .slice(0, limit);
}

function oneRmTooltip(this: Point): string {
    const point = this as MetricPoint;
    const monday = point.name ? isoWeekStartLocalDateFromKey(point.name) : null;
    const parts = [
        `<b>${point.name ?? ''}</b>`,
        `1RM: <b>${point.y == null ? '—' : `${formatWeight(point.y)} kg`}</b>`,
    ];
    if (monday) parts.push(`Semana del ${displayLocalDate(monday)}`);
    if (point.weightUsed != null) parts.push(`Peso usado: ${formatWeight(point.weightUsed)} kg`);
    if (point.reps != null) parts.push(`Repeticiones: ${point.reps}`);
    if (point.participated === false) parts.push('Sin set elegible esa semana');
    return parts.join('<br/>');
}

export function buildOneRmWeeklyChartOptions(exercises: OneRmExerciseVM[]): Options | null {
    if (exercises.length === 0) return null;

    const selected = selectTop1RmExercises(exercises, STATS_CHARTS_MAX_1RM_SERIES);
    const weekKeys = weekCategories(selected.flatMap((e) => e.weeks.map((w) => w.weekKey)));

    const series: SeriesLineOptions[] = selected.map((exercise) => {
        const byWeekKey = new Map(exercise.weeks.map((w) => [w.weekKey, w]));

        const data: MetricPointOptions[] = weekKeys.map((weekKey) => {
            const week = byWeekKey.get(weekKey);
            // null, no 0: un gap y un cero no son lo mismo (FR-012).
            return {
                name: weekKey,
                y: week?.best1RM ?? null,
                weightUsed: week?.weightUsed ?? null,
                reps: week?.reps ?? null,
                participated: week?.participated ?? false,
            };
        });

        return { type: 'line', name: exercise.name, data };
    });

    return withStatsTheme({
        chart: { type: 'line', height: MULTI_SERIES_CHART_HEIGHT, marginBottom: 0 },
        title: { text: undefined },
        legend: { enabled: true },
        xAxis: weekAxis(weekKeys),
        yAxis: { min: 0, title: { text: '1RM (kg)' } },
        tooltip: { formatter: oneRmTooltip },
        plotOptions: {
            line: {
                // Sin conectar gaps: una semana sin 1RM no es "igual que la anterior".
                connectNulls: false,
                marker: { enabled: true, radius: 3 },
                dataLabels: { enabled: false },
            },
        },
        series,
    });
}

// ── Volumen por ejercicio ─────────────────────────────────────────────────

const exerciseNameOf = (weeks: VolumeWeekVM[], exerciseId: string): string => {
    for (const week of weeks) {
        const found = week.exercises.find((e) => e.exerciseId === exerciseId);
        if (found) return found.name;
    }
    return exerciseId;
};

const volumeForWeek = (week: VolumeWeekVM, exerciseId: string): number =>
    week.exercises.find((e) => e.exerciseId === exerciseId)?.volume ?? 0;

function exerciseVolumeTotals(weeks: VolumeWeekVM[]): Map<string, number> {
    const totals = new Map<string, number>();
    for (const week of weeks) {
        for (const exercise of week.exercises) {
            totals.set(
                exercise.exerciseId,
                (totals.get(exercise.exerciseId) ?? 0) + exercise.volume,
            );
        }
    }
    return totals;
}

/**
 * Reparte los ejercicios entre los que entran como series propias y los que se
 * agregan en "Otros". El cap vive acá y no en el componente: es política de
 * forma del dato, y desde un template no se puede probar.
 */
export function selectTopVolumeExercises(
    weeks: VolumeWeekVM[],
    limit: number,
): VolumeSeriesSelection {
    const ranked = [...exerciseVolumeTotals(weeks).entries()].sort((a, b) => {
        const byVolume = b[1] - a[1];
        return byVolume !== 0
            ? byVolume
            : exerciseNameOf(weeks, a[0]).localeCompare(exerciseNameOf(weeks, b[0]));
    });

    return {
        keptIds: ranked.slice(0, limit).map(([id]) => id),
        otherIds: ranked.slice(limit).map(([id]) => id),
    };
}

const volumeWeekKeys = (weeks: VolumeWeekVM[]): string[] =>
    weekCategories(weeks.map((w) => w.weekKey));

function volumeTooltip(this: Point): string {
    const point = this as MetricPoint;
    const parts = [
        `<b>${point.name ?? ''}</b>`,
        `Volumen: <b>${formatWeight(point.y ?? 0)} kg</b>`,
    ];
    if (point.seriesCount != null) parts.push(`Series: ${point.seriesCount}`);
    return parts.join('<br/>');
}

export function buildVolumeByExerciseChartOptions(weeks: VolumeWeekVM[]): Options | null {
    if (weeks.length === 0) return null;

    const selection = selectTopVolumeExercises(weeks, STATS_CHARTS_MAX_VOLUME_SERIES);
    const weekKeys = volumeWeekKeys(weeks);

    const series: SeriesColumnOptions[] = selection.keptIds.map((id) => ({
        type: 'column',
        name: exerciseNameOf(weeks, id),
        stack: VOLUME_STACK,
        data: weeks.map((week) => ({ name: week.weekKey, y: volumeForWeek(week, id) })),
    }));

    // "Otros" conserva el total apilado: lo que no entra como serie propia se
    // suma acá en vez de desaparecer del gráfico.
    if (selection.otherIds.length > 0) {
        series.push({
            type: 'column',
            name: STATS_CHARTS_OTHERS_SERIES_NAME,
            stack: VOLUME_STACK,
            data: weeks.map((week) => ({
                name: week.weekKey,
                y: selection.otherIds.reduce((sum, id) => sum + volumeForWeek(week, id), 0),
            })),
        });
    }

    return withStatsTheme({
        chart: { type: 'column', height: WEEKLY_CHART_HEIGHT, marginBottom: 0 },
        title: { text: undefined },
        xAxis: weekAxis(weekKeys),
        yAxis: { min: 0, title: { text: 'Volumen (kg)' } },
        tooltip: { formatter: volumeTooltip },
        plotOptions: {
            column: { dataLabels: { enabled: false }, stacking: 'normal' },
        },
        series,
    });
}

export function buildVolumeByMuscleChartOptions(weeks: VolumeWeekVM[]): Options | null {
    if (weeks.length === 0) return null;

    const weekKeys = volumeWeekKeys(weeks);

    // Orden de primera aparición: el mapper no reordena lo que manda el backend.
    const muscles: { muscle: string; label: string }[] = [];
    const seen = new Set<string>();
    for (const week of weeks) {
        for (const muscle of week.muscles) {
            if (seen.has(muscle.muscle)) continue;
            seen.add(muscle.muscle);
            muscles.push({ muscle: muscle.muscle, label: muscle.label });
        }
    }

    if (muscles.length === 0) return null;

    const series: SeriesColumnOptions[] = muscles.map((muscle) => {
        const data: MetricPointOptions[] = weeks.map((week) => {
            const found = week.muscles.find((m) => m.muscle === muscle.muscle);
            return {
                name: week.weekKey,
                y: found?.volume ?? 0,
                seriesCount: found?.sets ?? 0,
            };
        });

        return {
            type: 'column',
            name: muscle.label,
            stack: VOLUME_STACK,
            data,
        };
    });

    return withStatsTheme({
        chart: { type: 'column', height: WEEKLY_CHART_HEIGHT, marginBottom: 0 },
        title: { text: undefined },
        xAxis: weekAxis(weekKeys),
        yAxis: { min: 0, title: { text: 'Volumen (kg)' } },
        tooltip: { formatter: volumeTooltip },
        plotOptions: {
            column: { dataLabels: { enabled: false }, stacking: 'normal' },
        },
        series,
    });
}

// ── Volumen total ──────────────────────────────────────────────────────────

function volumeTotalTooltip(this: Point): string {
    const point = this as MetricPoint;
    return [
        `<b>${point.name ?? ''}</b>`,
        `Volumen total: <b>${formatWeight(point.y ?? 0)} kg</b>`,
        // null se muestra como "—", nunca como 0%: no sabemos el cambio, no
        // sabemos que no haya cambiado.
        `Variación: <b>${formatSignedPercent(point.deltaPct ?? null)}</b>`,
    ].join('<br/>');
}

function signedPercentLabel(this: Point): string {
    return formatSignedPercent(this.y ?? null);
}

export function buildVolumeTotalChartOptions(weeks: VolumeTotalWeekVM[]): Options | null {
    if (weeks.length === 0) return null;

    const weekKeys = weekCategories(weeks.map((w) => w.weekKey));

    const series: SeriesColumnOptions[] = [
        {
            type: 'column',
            name: 'Volumen total',
            data: weeks.map((week) => ({
                name: week.weekKey,
                y: week.totalVolume,
                deltaPct: week.deltaPct,
                color: week.possibleDeload ? DELOAD_POINT_COLOR : PRIMARY,
            })),
        },
    ];

    return withStatsTheme({
        chart: { type: 'column', height: WEEKLY_CHART_HEIGHT, marginBottom: 0 },
        title: { text: undefined },
        xAxis: weekAxis(weekKeys),
        yAxis: { min: 0, title: { text: 'Volumen (kg)' } },
        tooltip: { formatter: volumeTotalTooltip },
        plotOptions: { column: { dataLabels: { enabled: false } } },
        series,
    });
}

// ── Calorías ───────────────────────────────────────────────────────────────

/**
 * Solo `extraKcal`. `routineKcal` no aparece en ninguna rama de este tooltip
 * aunque el input lo traiga: el backend no lo estima y el frontend tampoco,
 * así que dibujarlo sería inventar un dato (FR-015).
 */
function caloriesTooltip(this: Point): string {
    const point = this as MetricPoint;
    return [
        `<b>${point.name ?? ''}</b>`,
        `Calorías extra: <b>${formatKcal(point.y ?? 0)} kcal</b>`,
        'Las calorías de rutina no las estima el backend',
    ].join('<br/>');
}

function kcalLabel(this: Point): string {
    return `${formatKcal(this.y ?? 0)} kcal`;
}

export function buildCaloriesChartOptions(weeks: CaloriesWeekVM[]): Options | null {
    if (weeks.length === 0) return null;

    const weekKeys = weekCategories(weeks.map((w) => w.weekKey));

    const series: SeriesColumnOptions[] = [
        {
            type: 'column',
            name: 'Calorías extra',
            data: weeks.map((week) => ({ name: week.weekKey, y: week.extraKcal })),
        },
    ];

    return withStatsTheme({
        chart: { type: 'column', height: WEEKLY_CHART_HEIGHT, marginBottom: 0 },
        title: { text: undefined },
        xAxis: weekAxis(weekKeys),
        yAxis: { min: 0, title: { text: 'Calorías (kcal)' } },
        tooltip: { formatter: caloriesTooltip },
        plotOptions: { column: { dataLabels: { enabled: false, formatter: kcalLabel } } },
        series,
    });
}

// ── Músculos olvidados ─────────────────────────────────────────────────────

function forgottenMusclesTooltip(this: Point): string {
    const point = this as MetricPoint;
    const parts = [`<b>${point.name ?? ''}</b>`, `Series: <b>${point.y ?? 0}</b>`];
    if (point.weeksWithoutWork != null) {
        parts.push(`Semanas sin entrenar: ${point.weeksWithoutWork}`);
    }
    if (point.lastTrainedAt) {
        parts.push(`Última vez: ${displayLocalDate(point.lastTrainedAt)}`);
    }
    return parts.join('<br/>');
}

function setsLabel(this: Point): string {
    return `${this.y ?? 0}`;
}

export function buildForgottenMusclesChartOptions(muscles: ForgottenMuscleVM[]): Options | null {
    if (muscles.length === 0) return null;

    // El orden es el del backend: el mapper no reordena un ranking que ya
    // decidió el servidor.
    const categories = muscles.map((m) => m.label);

    const series: SeriesBarOptions[] = [
        {
            type: 'bar',
            name: 'Series',
            data: muscles.map((m) => ({
                name: m.label,
                y: m.totalSets,
                weeksWithoutWork: m.weeksWithoutWork,
                lastTrainedAt: m.lastTrainedAt,
            })),
        },
    ];

    return withStatsTheme({
        chart: { type: 'bar', height: LONG_LABEL_CHART_HEIGHT, marginBottom: 0 },
        title: { text: undefined },
        xAxis: { categories, labels: { rotation: 0 } },
        yAxis: { min: 0, title: { text: 'Series' } },
        tooltip: { formatter: forgottenMusclesTooltip },
        plotOptions: {
            bar: { dataLabels: { enabled: true, formatter: setsLabel, color: TEXT2 } },
        },
        series,
    });
}

// ── Tendencia por ejercicio ────────────────────────────────────────────────

function trendTooltip(this: Point): string {
    const point = this as MetricPoint;
    const parts = [
        `<b>${point.name ?? ''}</b>`,
        `Variación: <b>${formatSignedPercent(point.y ?? null)}</b>`,
    ];
    if (point.label) parts.push(`Tendencia: ${point.label}`);
    return parts.join('<br/>');
}

export function buildExerciseTrendChartOptions(trends: ExerciseTrendVM[]): Options | null {
    if (trends.length === 0) return null;

    // INSUFFICIENT viene con pctChange null: una barra de largo cero se leería
    // como "sin cambio", que es una afirmación que el dato no hace.
    const plottable = trends.filter((t) => t.pctChange != null && t.label !== INSUFFICIENT);
    if (plottable.length === 0) return null;

    const limit = Math.max(...plottable.map((t) => Math.abs(t.pctChange as number)));
    const axisMax = limit > 0 ? limit : 1;

    const series: SeriesBarOptions[] = [
        {
            type: 'bar',
            name: 'Variación',
            data: plottable.map((t) => ({
                name: t.name,
                y: t.pctChange,
                label: t.label,
                color: TREND_LABEL_COLORS[t.label],
            })),
        },
    ];

    return withStatsTheme({
        chart: { type: 'bar', height: DIVERGING_BAR_CHART_HEIGHT, marginBottom: 0 },
        title: { text: undefined },
        xAxis: { categories: plottable.map((t) => t.name), labels: { rotation: 0 } },
        // Eje simétrico: el cero al centro y el signo legible de un vistazo.
        yAxis: {
            min: -axisMax,
            max: axisMax,
            title: { text: 'Variación (%)' },
            plotLines: [{ value: 0, width: 1, color: TEXT2, zIndex: 4 }],
        },
        tooltip: { formatter: trendTooltip },
        plotOptions: {
            bar: {
                borderWidth: 0,
                dataLabels: { enabled: true, formatter: signedPercentLabel, color: TEXT2 },
            },
        },
        series,
    });
}
