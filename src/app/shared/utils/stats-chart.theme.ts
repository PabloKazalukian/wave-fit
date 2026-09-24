import type { Options } from 'highcharts';

/**
 * Paleta y estilo base de los gráficos de estadísticas.
 * Los tokens provienen de documents/design/ui-conventions.md §1 (sin inventar colores).
 */
export const STATS_CHART_COLORS: string[] = [
    '#50C878', // primary
    '#4472B4', // secondary
    '#F5C623', // accent
    '#C83A6E', // confirm
    '#66D18A', // primary2
    '#2B6D41', // primaryDark
    '#A1E6BE', // primaryLight
];

const TEXT2 = '#adadad';
const BACKGROUND3 = '#1C2F22';
const BACKGROUND4 = '#295538';
const WHITE = '#ffffff';
const FONT_FAMILY = 'Lato, sans-serif';

export const statsChartBaseOptions: Options = {
    colors: STATS_CHART_COLORS,
    chart: {
        backgroundColor: 'transparent',
    },
    credits: {
        enabled: false,
    },
    legend: {
        enabled: false,
    },
    tooltip: {
        backgroundColor: BACKGROUND3,
        borderColor: BACKGROUND4,
        style: {
            color: WHITE,
            fontFamily: FONT_FAMILY,
        },
    },
    xAxis: {
        lineColor: BACKGROUND4,
        tickColor: BACKGROUND4,
        gridLineColor: 'rgba(255, 255, 255, 0.08)',
        labels: {
            style: {
                color: TEXT2,
                fontFamily: FONT_FAMILY,
            },
        },
        title: {
            style: {
                color: TEXT2,
                fontFamily: FONT_FAMILY,
            },
        },
    },
    yAxis: {
        gridLineColor: 'rgba(255, 255, 255, 0.08)',
        labels: {
            style: {
                color: TEXT2,
                fontFamily: FONT_FAMILY,
            },
        },
        title: {
            style: {
                color: TEXT2,
                fontFamily: FONT_FAMILY,
            },
        },
    },
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function merge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
): Record<string, unknown> {
    const out: Record<string, unknown> = { ...target };
    for (const key of Object.keys(source)) {
        const srcValue = source[key];
        const targetValue = out[key];
        out[key] =
            isPlainObject(targetValue) && isPlainObject(srcValue)
                ? merge(targetValue, srcValue)
                : srcValue;
    }
    return out;
}

/** Aplica el tema base sobre las opciones específicas de un gráfico (merge profundo). */
export function withStatsTheme(options: Options): Options {
    const result = merge(
        statsChartBaseOptions as unknown as Record<string, unknown>,
        options as unknown as Record<string, unknown>,
    );
    return result as unknown as Options;
}

export function formatWeight(value: number): string {
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value);
}

export function formatPercent(value: number): string {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value);
}

/** "yyyy-MM-dd" → "dd/MM" (sin pasar por Date para evitar saltos de timezone, BR-003). */
export function formatLocalDateShort(localDate: string): string {
    const parts = localDate.split('-');
    if (parts.length !== 3) return localDate;
    return `${parts[2]}/${parts[1]}`;
}

export function formatDateTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}
