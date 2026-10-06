import {
    DELOAD_POINT_COLOR,
    DIVERGING_BAR_CHART_HEIGHT,
    formatDateTime,
    formatKcal,
    formatLocalDateDisplay,
    formatLocalDateShort,
    formatPercent,
    formatSignedPercent,
    formatWeight,
    formatWeekKey,
    MULTI_SERIES_CHART_HEIGHT,
    STATS_CHART_COLORS,
    statsChartBaseOptions,
    TREND_LABEL_COLORS,
    WEEKLY_CHART_HEIGHT,
    withStatsTheme,
} from './stats-chart.theme';
import type { XAxisOptions, YAxisOptions } from 'highcharts';

describe('stats-chart.theme', () => {
    it('uses the app palette tokens for the series colors', () => {
        expect(STATS_CHART_COLORS).toContain('#50C878'); // primary
        expect(STATS_CHART_COLORS).toContain('#4472B4'); // secondary
        expect(STATS_CHART_COLORS).toContain('#F5C623'); // accent
        expect(STATS_CHART_COLORS).toContain('#C83A6E'); // confirm
    });

    it('disables credits and renders on a transparent background', () => {
        expect(statsChartBaseOptions.credits?.enabled).toBe(false);
        expect(statsChartBaseOptions.chart?.backgroundColor).toBe('transparent');
    });

    it('rotates x-axis labels so long category names fit the card width (NFR-005)', () => {
        expect((statsChartBaseOptions.xAxis as XAxisOptions)?.labels?.rotation).toBe(-45);
    });

    it('keeps the deep merge able to override the base label rotation', () => {
        const options = withStatsTheme({
            chart: { type: 'column' },
            xAxis: { labels: { rotation: 0 } },
        });

        expect((options.xAxis as XAxisOptions)?.labels?.rotation).toBe(0);
    });

    it('merges theme base with chart-specific options (deep merge)', () => {
        const options = withStatsTheme({
            chart: { type: 'column' },
            yAxis: { title: { text: 'Volumen (kg)' } },
            credits: { enabled: true },
        });

        // chart-specific values win
        expect(options.chart?.type).toBe('column');
        expect((options.yAxis as YAxisOptions)?.title?.text).toBe('Volumen (kg)');
        // base is preserved where not overridden (nested merge keeps colorByPoint etc.)
        expect(options.chart?.backgroundColor).toBe('transparent');
        // explicit override wins
        expect(options.credits?.enabled).toBe(true);
    });

    describe('format helpers', () => {
        it('formats weight with one decimal in es-ES', () => {
            expect(formatWeight(1234.6)).toBe('1234,6');
            expect(formatWeight(100)).toBe('100,0');
        });

        it('formats percent as integer', () => {
            expect(formatPercent(71.4)).toBe('71');
        });

        it('formats LocalDate as dd/MM without timezone shifts (BR-003)', () => {
            expect(formatLocalDateShort('2026-09-14')).toBe('14/09');
        });

        it('formats DateTime ISO with locale es-ES', () => {
            expect(formatDateTime('2026-09-20T10:05:00.000Z')).toContain('2026');
        });

        it('falls back to the raw string for an invalid date', () => {
            expect(formatDateTime('not-a-date')).toBe('not-a-date');
        });
    });
});

describe('stats-chart.theme — /stats/insights additions (TEST-007)', () => {
    describe('formatWeekKey', () => {
        it('reduces an ISO week key to its W## label', () => {
            expect(formatWeekKey('2026-W40')).toBe('W40');
            expect(formatWeekKey('2026-W5')).toBe('W5');
        });

        it('passes malformed keys through untouched', () => {
            expect(formatWeekKey('W40')).toBe('W40');
            expect(formatWeekKey('2026-W')).toBe('2026-W');
            expect(formatWeekKey('')).toBe('');
            expect(formatWeekKey('semana 40')).toBe('semana 40');
        });
    });

    describe('formatKcal', () => {
        it('formats with no decimals in es-ES', () => {
            expect(formatKcal(1234.6)).toBe('1235');
            expect(formatKcal(900)).toBe('900');
            expect(formatKcal(0)).toBe('0');
        });
    });

    describe('formatSignedPercent', () => {
        it('prefixes gains with a plus and keeps losses negative', () => {
            expect(formatSignedPercent(12)).toBe('+12%');
            expect(formatSignedPercent(12.4)).toBe('+12%');
            expect(formatSignedPercent(-8)).toBe('-8%');
        });

        it('renders zero without a sign and null as an em dash', () => {
            expect(formatSignedPercent(0)).toBe('0%');
            expect(formatSignedPercent(null)).toBe('—');
        });
    });

    describe('formatLocalDateDisplay', () => {
        it('formats a LocalDate as dd/MM/yyyy without timezone shifts (BR-003)', () => {
            expect(formatLocalDateDisplay('2026-09-14')).toBe('14/09/2026');
        });

        it('passes a malformed value through instead of rendering Invalid Date', () => {
            expect(formatLocalDateDisplay('not-a-date')).toBe('not-a-date');
        });
    });

    describe('tokens', () => {
        it('maps every trend label to a documented design token', () => {
            expect(TREND_LABEL_COLORS.UP).toBe('#50C878'); // primary
            expect(TREND_LABEL_COLORS.FLAT).toBe('#adadad'); // text2
            expect(TREND_LABEL_COLORS.DOWN).toBe('#D66F6F'); // warning
            expect(TREND_LABEL_COLORS.INSUFFICIENT).toBe('#4472B4'); // secondary
        });

        it('reuses the accent already present in the series palette for deload', () => {
            expect(DELOAD_POINT_COLOR).toBe('#F5C623');
            expect(STATS_CHART_COLORS).toContain(DELOAD_POINT_COLOR);
        });

        it('exposes the three chart heights', () => {
            expect(WEEKLY_CHART_HEIGHT).toBe(240);
            expect(MULTI_SERIES_CHART_HEIGHT).toBe(280);
            expect(DIVERGING_BAR_CHART_HEIGHT).toBe(300);
        });
    });
});
