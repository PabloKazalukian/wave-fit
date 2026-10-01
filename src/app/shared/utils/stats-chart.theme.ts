import type { Options } from 'highcharts';
import type { TrendLabelVM } from '../interfaces/stats-charts.interface';

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

/** Rotación de las etiquetas del eje X: nombres largos de ejercicio/rutina en ~440px. */
export const X_AXIS_LABEL_ROTATION = -45;

/** Margen inferior que reserva espacio para las etiquetas rotadas a -45°. */
export const ROTATED_LABEL_MARGIN_BOTTOM = 72;

/** Alto de los gráficos cuyas categorías son nombres largos. */
export const LONG_LABEL_CHART_HEIGHT = 300;

/** Alto del gráfico de adherencia semanal (línea, categorías dd/MM). */
export const ADHERENCE_CHART_HEIGHT = 240;

/** Gráficos semanales de /stats/charts: el eje X usa etiquetas W## sin rotar. */
export const WEEKLY_CHART_HEIGHT = 240;

/** Gráfico de 1RM por ejercicio: línea con leyenda, hasta 6 series. */
export const MULTI_SERIES_CHART_HEIGHT = 280;

/** Gráfico de tendencia: barras divergentes con eje % simétrico. */
export const DIVERGING_BAR_CHART_HEIGHT = 300;

/**
 * Color de badge por etiqueta de tendencia.
 *
 * Lectura de tokens: como dato de chart valen los colores de serie; como badge
 * aplican los roles de acción de ui-conventions.md §1 — `error` queda
 * deliberadamente sin uso (se reserva a acciones destructivas y mensajes de
 * error), por eso DOWN usa `warning` y no `error`.
 */
export const TREND_LABEL_COLORS: Record<TrendLabelVM, string> = {
    UP: '#50C878', // primary
    FLAT: '#adadad', // text2
    DOWN: '#D66F6F', // warning
    INSUFFICIENT: '#4472B4', // secondary
};

/** Punto de deload: `accent`, ya presente en STATS_CHART_COLORS. */
export const DELOAD_POINT_COLOR = '#F5C623';

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
            rotation: X_AXIS_LABEL_ROTATION,
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

/**
 * "yyyy-MM-dd" → "dd/MM/yyyy", el mismo formato que muestra `app-input-date`.
 *
 * Sólo reformatea lo que tiene forma de `LocalDate`: un string cualquiera se
 * devuelve tal cual en vez de quedar reorderado como si fuera una fecha.
 */
export function formatLocalDateDisplay(localDate: string): string {
    const parts = LOCAL_DATE_SHAPE.exec(localDate);
    if (!parts) return localDate;
    return `${parts[3]}/${parts[2]}/${parts[1]}`;
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

const ISO_WEEK_KEY = /^\d{4}-(W\d{1,2})$/;
const LOCAL_DATE_SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * "2026-W40" → "W40" para la etiqueta del eje X de los gráficos semanales.
 * Una clave mal formada se devuelve tal cual: el backend manda el weekKey y la
 * UI no debe romper ni inventar una etiqueta.
 */
export function formatWeekKey(weekKey: string): string {
    const match = ISO_WEEK_KEY.exec(weekKey);
    return match ? match[1] : weekKey;
}

/** Kilocalorías: es-ES, sin decimales. */
export function formatKcal(value: number): string {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value);
}

/**
 * Variación porcentual con signo explícito: "+12%" / "-8%" / "0%".
 * `null` se muestra como "—" y nunca como 0%: sin datos no es "sin cambios"
 * (FR-014, FR-017).
 */
export function formatSignedPercent(value: number | null): string {
    if (value == null) return '—';
    const rounded = Math.round(value);
    const sign = rounded > 0 ? '+' : '';
    return `${sign}${formatPercent(rounded)}%`;
}
