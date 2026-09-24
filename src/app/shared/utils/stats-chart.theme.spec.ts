import {
    formatDateTime,
    formatLocalDateShort,
    formatPercent,
    formatWeight,
    STATS_CHART_COLORS,
    statsChartBaseOptions,
    withStatsTheme,
} from './stats-chart.theme';
import type { YAxisOptions } from 'highcharts';

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

    it('merges theme base with chart-specific options (deep merge)', () => {
        const options = withStatsTheme({
            chart: { type: 'bar' },
            yAxis: { title: { text: 'Volumen (kg)' } },
            credits: { enabled: true },
        });

        // chart-specific values win
        expect(options.chart?.type).toBe('bar');
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
