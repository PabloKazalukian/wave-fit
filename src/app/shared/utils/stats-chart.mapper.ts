import type {
    Options,
    Point,
    PointOptionsObject,
    SeriesBarOptions,
    SeriesColumnOptions,
    SeriesLineOptions,
} from 'highcharts';
import {
    AdherenceWeekVM,
    isNewRecord,
    PersonalRecordVM,
    TopExerciseVM,
    TopRoutineVM,
} from '../interfaces/stats.interface';
import {
    formatLocalDateShort,
    formatPercent,
    formatWeight,
    withStatsTheme,
} from './stats-chart.theme';
import { LocalDate } from '../interfaces/api/stats-api.interface';

const TEXT2 = '#adadad';

type MetricPoint = Point & {
    sessions?: number;
    avg?: number;
    weeks?: number;
    completed?: number;
    skipped?: number;
    pending?: number;
    oneRm?: number;
    reps?: number;
    achieved?: string;
    new?: boolean;
};

function volumeTooltip(this: Point): string {
    const point = this as MetricPoint;
    return [
        `<b>${this.name ?? ''}</b>`,
        `Volumen total: <b>${formatWeight(point.y ?? 0)} kg</b>`,
        `Sesiones: ${point.sessions ?? 0}`,
        `Prom. por sesión: ${formatWeight(point.avg ?? 0)} kg`,
    ].join('<br/>');
}

function adherenceTooltip(label: 'Rutina' | 'Semana'): TooltipFormatter {
    return function (this: Point) {
        const point = this as MetricPoint;
        const parts = [`<b>${label}: ${this.name ?? ''}</b>`];
        if (point.sessions != null) parts.push(`Sesiones: ${point.sessions}`);
        if (point.weeks != null) parts.push(`Semanas: ${point.weeks}`);
        if (point.completed != null) {
            parts.push(
                `Completados: ${point.completed} · Omitidos: ${point.skipped ?? 0} · Pendientes: ${point.pending ?? 0}`,
            );
        }
        parts.push(`Adherencia: <b>${formatPercent(point.y ?? 0)}%</b>`);
        return parts.join('<br/>');
    };
}

type TooltipFormatter = (this: Point) => string;

function recordTooltip(this: Point): string {
    const point = this as MetricPoint;
    const parts = [
        `<b>${this.name ?? ''}</b>`,
        `Peso máximo: <b>${formatWeight(point.y ?? 0)} kg</b>`,
        `1RM estimado: ${formatWeight(point.oneRm ?? 0)} kg`,
        `Repeticiones: ${point.reps ?? 0}`,
        `Alcanzado: ${formatAchievedAtDate(point.achieved ?? '')}`,
    ];
    if (point.new) parts.push('<span style="color:#50C878">Nuevo PR</span>');
    return parts.join('<br/>');
}

function kgLabel(this: Point): string {
    return `${formatWeight(this.y ?? 0)} kg`;
}

function percentLabel(this: Point): string {
    return `${formatPercent(this.y ?? 0)}%`;
}

const barSeries = (data: PointOptionsObject[]): SeriesBarOptions => ({
    type: 'bar',
    name: 'Volumen total',
    data,
});

const columnSeries = (name: string, data: PointOptionsObject[]): SeriesColumnOptions => ({
    type: 'column',
    name,
    data,
});

const lineSeries = (data: PointOptionsObject[]): SeriesLineOptions => ({
    type: 'line',
    name: 'Adherencia',
    data,
});

export function buildTopExercisesChartOptions(entries: TopExerciseVM[]): Options | null {
    const top = entries.slice(0, 10);
    if (top.length === 0) return null;
    const categories = top.map((e) => e.name);
    const data = top.map((e) => ({
        name: e.name,
        y: e.totalVolume,
        sessions: e.totalSessions,
        avg: e.avgVolumePerSession,
    }));

    return withStatsTheme({
        chart: { type: 'bar', height: Math.max(42 * top.length, 160) },
        title: { text: undefined },
        xAxis: { categories },
        yAxis: { title: { text: 'Volumen total (kg)' } },
        tooltip: { formatter: volumeTooltip },
        plotOptions: {
            bar: {
                dataLabels: { enabled: true, formatter: kgLabel, color: TEXT2 },
                colorByPoint: true,
            },
        },
        series: [barSeries(data)],
    });
}

export function buildTopRoutinesChartOptions(entries: TopRoutineVM[]): Options | null {
    if (entries.length === 0) return null;
    const categories = entries.map((r) => r.name);
    const data = entries.map((r) => ({
        name: r.name,
        y: r.adherenceRate,
        sessions: r.totalSessions,
        weeks: r.totalWeeks,
    }));

    return withStatsTheme({
        chart: { type: 'column', height: Math.max(42 * entries.length, 200) },
        title: { text: undefined },
        xAxis: { categories },
        yAxis: { min: 0, max: 100, title: { text: 'Adherencia (%)' } },
        tooltip: { formatter: adherenceTooltip('Rutina') },
        plotOptions: {
            column: {
                dataLabels: { enabled: true, formatter: percentLabel, color: TEXT2 },
                colorByPoint: true,
            },
        },
        series: [columnSeries('Adherencia', data)],
    });
}

export function buildPersonalRecordsChartOptions(entries: PersonalRecordVM[]): Options | null {
    if (entries.length === 0) return null;
    const categories = entries.map((r) => r.exerciseName);
    const data = entries.map((r) => ({
        name: r.exerciseName,
        y: r.bestWeight,
        oneRm: r.oneRmEstimated,
        reps: r.bestReps,
        achieved: r.achievedAt,
        new: isNewRecord(r),
    }));

    return withStatsTheme({
        chart: { type: 'column', height: Math.max(42 * entries.length, 200) },
        title: { text: undefined },
        xAxis: { categories },
        yAxis: { title: { text: 'Peso máximo (kg)' } },
        tooltip: { formatter: recordTooltip },
        plotOptions: {
            column: {
                dataLabels: { enabled: true, formatter: kgLabel, color: TEXT2 },
                colorByPoint: true,
            },
        },
        series: [columnSeries('Peso máximo', data)],
    });
}

export function buildAdherenceChartOptions(weeks: AdherenceWeekVM[]): Options | null {
    if (weeks.length === 0) return null;
    const categories = weeks.map((w) => formatLocalDateShort(w.weekStartDate));
    const data = weeks.map((w) => ({
        name: w.weekStartDate,
        y: w.adherencePercent,
        completed: w.completedDays,
        skipped: w.skippedDays,
        pending: w.pendingDays,
    }));

    return withStatsTheme({
        chart: { type: 'line', height: 240 },
        title: { text: undefined },
        xAxis: { categories, tickmarkPlacement: 'on' },
        yAxis: { min: 0, max: 100, title: { text: 'Adherencia (%)' } },
        tooltip: { formatter: adherenceTooltip('Semana') },
        plotOptions: {
            line: {
                marker: { enabled: true, radius: 3 },
                dataLabels: { enabled: false },
            },
        },
        series: [lineSeries(data)],
    });
}

export function formatAchievedAtDate(localDate: LocalDate): string {
    return formatLocalDateShort(localDate);
}
