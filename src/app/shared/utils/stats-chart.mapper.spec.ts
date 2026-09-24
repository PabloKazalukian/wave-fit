import {
    buildAdherenceChartOptions,
    buildPersonalRecordsChartOptions,
    buildTopExercisesChartOptions,
    buildTopRoutinesChartOptions,
} from './stats-chart.mapper';
import {
    AdherenceWeekVM,
    PersonalRecordVM,
    StatsCategory,
    TopExerciseVM,
    TopRoutineVM,
} from '../interfaces/stats.interface';
import type { XAxisOptions, YAxisOptions } from 'highcharts';

type YData = { y: number }[];

const chest = 'chest' as StatsCategory;
const legs = 'legs' as StatsCategory;

const exerciseVms: TopExerciseVM[] = [
    {
        rank: 1,
        exerciseId: 'ex1',
        name: 'Press banca',
        category: chest,
        totalSessions: 5,
        totalVolume: 1200,
        avgVolumePerSession: 240,
    },
    {
        rank: 2,
        exerciseId: 'ex2',
        name: 'Sentadilla',
        category: legs,
        totalSessions: 4,
        totalVolume: 800,
        avgVolumePerSession: 200,
    },
];

const routineVms: TopRoutineVM[] = [
    {
        rank: 1,
        planId: 'p1',
        name: 'Push Pull Legs',
        totalWeeks: 4,
        totalSessions: 12,
        adherenceRate: 93,
    },
    {
        rank: 2,
        planId: 'p2',
        name: 'Upper Lower',
        totalWeeks: 6,
        totalSessions: 24,
        adherenceRate: 80,
    },
];

const recordVms: PersonalRecordVM[] = [
    {
        exerciseId: 'ex1',
        exerciseName: 'Sentadilla',
        category: legs,
        oneRmEstimated: 120,
        bestWeight: 100,
        bestReps: 5,
        bestVolume: 500,
        achievedAt: '2026-09-15',
        previousOneRm: null,
    },
];

const weekVms: AdherenceWeekVM[] = [
    {
        weekStartDate: '2026-09-14',
        totalDays: 7,
        completedDays: 5,
        skippedDays: 1,
        pendingDays: 1,
        adherencePercent: 71,
    },
    {
        weekStartDate: '2026-09-21',
        totalDays: 7,
        completedDays: 7,
        skippedDays: 0,
        pendingDays: 0,
        adherencePercent: 100,
    },
];

describe('stats-chart.mapper', () => {
    describe('buildTopExercisesChartOptions', () => {
        it('builds a horizontal bar chart with exercise names and volumes', () => {
            const options = buildTopExercisesChartOptions(exerciseVms);

            expect(options).not.toBeNull();
            expect(options?.chart?.type).toBe('bar');
            expect((options?.xAxis as XAxisOptions)?.categories).toEqual([
                'Press banca',
                'Sentadilla',
            ]);
            expect((options?.series?.[0] as { data: YData }).data.map((p) => p.y)).toEqual([
                1200, 800,
            ]);
        });

        it('caps the chart at 10 exercises', () => {
            const many = Array.from({ length: 15 }, (_, i) => ({
                rank: i + 1,
                exerciseId: `ex${i}`,
                name: `Ejercicio ${i}`,
                category: chest,
                totalSessions: 1,
                totalVolume: i,
                avgVolumePerSession: i,
            }));
            const options = buildTopExercisesChartOptions(many);

            expect((options?.xAxis as XAxisOptions)?.categories?.length).toBe(10);
        });

        it('returns null for empty input (empty state)', () => {
            expect(buildTopExercisesChartOptions([])).toBeNull();
        });
    });

    describe('buildTopRoutinesChartOptions', () => {
        it('builds a column chart with adherence percentages bounded to 100', () => {
            const options = buildTopRoutinesChartOptions(routineVms);

            expect(options).not.toBeNull();
            expect(options?.chart?.type).toBe('column');
            expect((options?.yAxis as YAxisOptions)?.max).toBe(100);
            expect((options?.series?.[0] as { data: YData }).data.map((p) => p.y)).toEqual([
                93, 80,
            ]);
        });

        it('returns null for empty input', () => {
            expect(buildTopRoutinesChartOptions([])).toBeNull();
        });
    });

    describe('buildPersonalRecordsChartOptions', () => {
        it('builds a column chart with best weights and new-PR flags', () => {
            const options = buildPersonalRecordsChartOptions(recordVms);

            expect(options).not.toBeNull();
            expect(options?.chart?.type).toBe('column');
            const point = (options?.series?.[0] as { data: { y: number; new: boolean }[] }).data[0];
            expect(point.y).toBe(100);
            expect(point.new).toBe(true);
        });

        it('returns null for empty input', () => {
            expect(buildPersonalRecordsChartOptions([])).toBeNull();
        });
    });

    describe('buildAdherenceChartOptions', () => {
        it('builds a line chart with dd/MM categories and percentages', () => {
            const options = buildAdherenceChartOptions(weekVms);

            expect(options).not.toBeNull();
            expect(options?.chart?.type).toBe('line');
            expect((options?.xAxis as XAxisOptions)?.categories).toEqual(['14/09', '21/09']);
            expect((options?.yAxis as YAxisOptions)?.min).toBe(0);
            expect((options?.yAxis as YAxisOptions)?.max).toBe(100);
            expect((options?.series?.[0] as { data: YData }).data.map((p) => p.y)).toEqual([
                71, 100,
            ]);
        });

        it('returns null for empty input', () => {
            expect(buildAdherenceChartOptions([])).toBeNull();
        });
    });
});
