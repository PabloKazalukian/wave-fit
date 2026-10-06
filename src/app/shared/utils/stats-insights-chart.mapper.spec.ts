import type { Options, XAxisOptions, YAxisOptions } from 'highcharts';
import {
    buildCaloriesChartOptions,
    buildExerciseTrendChartOptions,
    buildForgottenMusclesChartOptions,
    buildOneRmWeeklyChartOptions,
    buildVolumeByExerciseChartOptions,
    buildVolumeByMuscleChartOptions,
    buildVolumeTotalChartOptions,
    selectTop1RmExercises,
    selectTopVolumeExercises,
    weekCategories,
} from './stats-insights-chart.mapper';
import {
    CaloriesWeekVM,
    ExerciseTrendVM,
    ForgottenMuscleVM,
    OneRmExerciseVM,
    STATS_INSIGHTS_MAX_1RM_SERIES,
    STATS_INSIGHTS_MAX_VOLUME_SERIES,
    STATS_INSIGHTS_OTHERS_SERIES_NAME,
    VolumeTotalWeekVM,
    VolumeWeekVM,
} from '../interfaces/stats-insights.interface';
import type { StatsCategory } from '../interfaces/stats.interface';
import { DELOAD_POINT_COLOR, TREND_LABEL_COLORS } from './stats-chart.theme';

interface PointShape {
    y?: number | null;
    name?: string;
    color?: string;
    [key: string]: unknown;
}

interface SeriesShape {
    type?: string;
    name?: string;
    stack?: string;
    data: PointShape[];
}

const seriesOf = (options: Options): SeriesShape[] =>
    (options.series ?? []) as unknown as SeriesShape[];

// `StatsCategory` es un enum, no una unión de strings: los literales no asignan
// sin el cast. Misma convención que stats-chart.mapper.spec.ts.
const chest = 'chest' as StatsCategory;
const legs = 'legs' as StatsCategory;
const biceps = 'biceps' as StatsCategory;

const round1 = (value: number): number => Math.round(value * 10) / 10;

const tooltipHtml = (options: Options, point: PointShape): string => {
    const formatter = options.tooltip?.formatter as unknown as (this: unknown) => string;
    return formatter.call(point);
};

const xCategories = (options: Options): unknown =>
    (options.xAxis as XAxisOptions)?.categories ?? [];

const oneRmWeek = (weekKey: string, best1RM: number | null, participated = true) => ({
    weekKey,
    best1RM,
    weightUsed: best1RM === null ? null : best1RM * 0.8,
    reps: best1RM === null ? null : 5,
    participated,
});

const oneRmExercise = (
    exerciseId: string,
    name: string,
    weeks: OneRmExerciseVM['weeks'],
): OneRmExerciseVM => ({ exerciseId, name, category: chest, weeks });

const volumeWeek = (
    weekKey: string,
    exercises: { id: string; volume: number }[],
    muscles: { muscle: string; label: string; volume: number }[] = [],
): VolumeWeekVM => ({
    weekKey,
    exercises: exercises.map((e) => ({
        exerciseId: e.id,
        name: `Nombre ${e.id}`,
        category: chest,
        volume: e.volume,
    })),
    muscles: muscles.map((m) => ({ ...m, sets: 3 })),
});

describe('buildOneRmWeeklyChartOptions (TEST-011)', () => {
    const oneRmVms = [
        oneRmExercise('a', 'Press banca', [oneRmWeek('2026-W39', 100), oneRmWeek('2026-W40', 102)]),
    ];

    it('is a line chart with the legend on and unrotated week labels', () => {
        const options = buildOneRmWeeklyChartOptions(oneRmVms);

        expect(options).not.toBeNull();
        expect(options?.chart?.type).toBe('line');
        expect(options?.legend?.enabled).toBe(true);
        expect((options?.xAxis as XAxisOptions)?.labels?.rotation).toBe(0);
    });

    it('keeps a null best1RM as null so the line shows a gap', () => {
        const options = buildOneRmWeeklyChartOptions([
            oneRmExercise('a', 'Press banca', [
                oneRmWeek('2026-W39', 100),
                oneRmWeek('2026-W40', null, false),
            ]),
        ]);

        expect(seriesOf(options!)[0].data.map((p) => p.y)).toEqual([100, null]);
    });

    it('labels the x axis with W## and does not connect the gaps', () => {
        const options = buildOneRmWeeklyChartOptions([
            oneRmExercise('a', 'Press banca', [
                oneRmWeek('2026-W39', 100),
                oneRmWeek('2026-W40', null, false),
            ]),
        ]);

        expect(xCategories(options!)).toEqual(['W39', 'W40']);
        expect(
            (options?.plotOptions as { line?: { connectNulls?: boolean } })?.line?.connectNulls,
        ).toBe(false);
    });

    it('selects at most STATS_INSIGHTS_MAX_1RM_SERIES series', () => {
        const many = Array.from({ length: STATS_INSIGHTS_MAX_1RM_SERIES + 2 }, (_, i) =>
            oneRmExercise(`e${i}`, `Ejercicio ${i}`, [oneRmWeek('2026-W40', 100 + i)]),
        );

        const options = buildOneRmWeeklyChartOptions(many);

        expect(seriesOf(options!).length).toBe(STATS_INSIGHTS_MAX_1RM_SERIES);
    });

    it('ranks by participating weeks and breaks ties by name', () => {
        const exercises = [
            oneRmExercise('b', 'B squats', [oneRmWeek('2026-W40', 100)]),
            oneRmExercise('a', 'A bench', [oneRmWeek('2026-W40', 100)]),
            oneRmExercise('c', 'C deadlift', [
                oneRmWeek('2026-W39', 100),
                oneRmWeek('2026-W40', 100),
            ]),
        ];

        expect(selectTop1RmExercises(exercises, 2).map((e) => e.name)).toEqual([
            'C deadlift',
            'A bench',
        ]);
    });

    it('does not count non-participating weeks when ranking', () => {
        const exercises = [
            oneRmExercise('gap', 'Con huecos', [
                oneRmWeek('2026-W39', 100),
                oneRmWeek('2026-W40', null, false),
                oneRmWeek('2026-W41', null, false),
            ]),
            oneRmExercise('full', 'Completo', [oneRmWeek('2026-W40', 100)]),
        ];

        expect(selectTop1RmExercises(exercises, 1).map((e) => e.name)).toEqual(['Completo']);
    });
});

describe('volume mappers (TEST-012)', () => {
    const weeks = [
        volumeWeek(
            '2026-W39',
            [
                { id: 'a', volume: 100 },
                { id: 'b', volume: 300 },
                { id: 'c', volume: 200 },
            ],
            [
                { muscle: 'chest', label: 'Pecho', volume: 600 },
                { muscle: 'back', label: 'Espalda', volume: 200 },
            ],
        ),
        volumeWeek(
            '2026-W40',
            [
                { id: 'a', volume: 150 },
                { id: 'b', volume: 50 },
                { id: 'c', volume: 250 },
            ],
            [
                { muscle: 'chest', label: 'Pecho', volume: 400 },
                { muscle: 'back', label: 'Espalda', volume: 50 },
            ],
        ),
    ];

    describe('selectTopVolumeExercises', () => {
        it('keeps the top ids by total volume and returns the rest as otherIds', () => {
            const selection = selectTopVolumeExercises(weeks, 2);

            // b=350, c=450, a=250 → c, b kept; a goes to "Otros"
            expect(selection.keptIds).toEqual(['c', 'b']);
            expect(selection.otherIds).toEqual(['a']);
        });

        it('returns no otherIds when everything fits under the limit', () => {
            const selection = selectTopVolumeExercises(weeks, STATS_INSIGHTS_MAX_VOLUME_SERIES);

            expect(selection.otherIds).toEqual([]);
        });
    });

    describe('buildVolumeByExerciseChartOptions', () => {
        // 10 ejercicios distintos: supera el cap de 8 y obliga a agrupar en "Otros".
        const manyExercises = [
            volumeWeek(
                '2026-W40',
                Array.from({ length: 10 }, (_, i) => ({ id: `e${i}`, volume: (10 - i) * 10 })),
            ),
        ];

        it('is stacked, capped and carries an "Otros" series', () => {
            const options = buildVolumeByExerciseChartOptions(manyExercises);
            const series = seriesOf(options!);

            expect(series.length).toBe(STATS_INSIGHTS_MAX_VOLUME_SERIES + 1);
            expect(series.every((s) => s.stack === 'volume')).toBeTrue();
            expect(series[series.length - 1].name).toBe(STATS_INSIGHTS_OTHERS_SERIES_NAME);
        });

        it('adds no "Otros" series when every exercise fits under the cap', () => {
            const options = buildVolumeByExerciseChartOptions(weeks);
            const series = seriesOf(options!);

            expect(series.map((s) => s.name)).not.toContain(STATS_INSIGHTS_OTHERS_SERIES_NAME);
            expect(series.length).toBe(3);
        });

        it('preserves each week stacked total against the input total', () => {
            const series = seriesOf(buildVolumeByExerciseChartOptions(weeks)!);

            weeks.forEach((week, i) => {
                const inputTotal = week.exercises.reduce((sum, e) => sum + e.volume, 0);
                const stacked = series.reduce((sum, s) => sum + (s.data[i]?.y ?? 0), 0);

                expect(round1(stacked)).toBe(round1(inputTotal));
            });
        });

        it('fills a week where an exercise was not trained with 0, not null', () => {
            const sparse = [
                volumeWeek('2026-W39', [{ id: 'a', volume: 100 }]),
                volumeWeek('2026-W40', [{ id: 'b', volume: 50 }]),
            ];
            const series = seriesOf(buildVolumeByExerciseChartOptions(sparse)!);

            const aSeries = series.find((s) => s.name === 'Nombre a');
            expect(aSeries?.data[1].y).toBe(0);
        });
    });

    describe('buildVolumeByMuscleChartOptions', () => {
        it('builds one stacked series per muscle in first-appearance order', () => {
            const options = buildVolumeByMuscleChartOptions(weeks);
            const series = seriesOf(options!);

            expect(series.map((s) => s.name)).toEqual(['Pecho', 'Espalda']);
            expect(series.every((s) => s.stack === 'volume')).toBeTrue();
            expect(series[0].data.map((p) => p.y)).toEqual([600, 400]);
        });
    });
});

describe('buildVolumeTotalChartOptions (TEST-013)', () => {
    const volumeTotal: VolumeTotalWeekVM[] = [
        { weekKey: '2026-W39', totalVolume: 1000, deltaPct: 5, possibleDeload: false },
        { weekKey: '2026-W40', totalVolume: 600, deltaPct: -35, possibleDeload: true },
    ];

    it('is a column chart colored primary by default and accent on deload weeks', () => {
        const options = buildVolumeTotalChartOptions(volumeTotal);
        const data = seriesOf(options!)[0].data;

        expect(options?.chart?.type).toBe('column');
        expect(data[0].color).toBe('#50C878'); // primary
        expect(data[1].color).toBe(DELOAD_POINT_COLOR); // accent
    });

    it('keeps a null deltaPct null and renders it as an em dash, never 0%', () => {
        const options = buildVolumeTotalChartOptions([
            { weekKey: '2026-W39', totalVolume: 800, deltaPct: null, possibleDeload: false },
        ]);
        const point = seriesOf(options!)[0].data[0];

        expect(point['deltaPct']).toBeNull();

        const html = tooltipHtml(options!, { ...point, name: '2026-W39' });
        expect(html).toContain('—');
        expect(html).not.toContain('0%');
    });

    it('renders a signed percentage when there is a delta', () => {
        const options = buildVolumeTotalChartOptions(volumeTotal);
        const point = seriesOf(options!)[0].data[1];

        expect(tooltipHtml(options!, { ...point, name: '2026-W40' })).toContain('-35%');
    });
});

describe('buildCaloriesChartOptions (TEST-014)', () => {
    const calories: CaloriesWeekVM[] = [
        {
            weekKey: '2026-W40',
            routineKcal: 999,
            extraKcal: 500,
            totalKcal: 500,
            estimatedSessions: 2,
        },
    ];

    it('plots extraKcal in a single series', () => {
        const options = buildCaloriesChartOptions(calories);
        const series = seriesOf(options!);

        expect(options?.chart?.type).toBe('column');
        expect(series.length).toBe(1);
        expect(series[0].data.map((p) => p.y)).toEqual([500]);
    });

    it('never leaks the routineKcal value into a series or the tooltip', () => {
        const options = buildCaloriesChartOptions(calories);
        const point = seriesOf(options!)[0].data[0];

        expect(JSON.stringify(seriesOf(options!))).not.toContain('999');

        const html = tooltipHtml(options!, { ...point, name: '2026-W40', routineKcal: 999 });
        expect(html).not.toContain('routineKcal');
        expect(html).not.toContain('999');
        // La única mención a la rutina es la aclaración de que no se estima.
        expect(html).toContain('no las estima el backend');
    });
});

describe('buildForgottenMusclesChartOptions (TEST-015)', () => {
    const muscles: ForgottenMuscleVM[] = [
        {
            muscle: 'back',
            label: 'Espalda',
            totalSets: 4,
            weeksWithoutWork: 2,
            lastTrainedAt: null,
        },
        {
            muscle: 'chest',
            label: 'Pecho',
            totalSets: 12,
            weeksWithoutWork: 3,
            lastTrainedAt: '2026-04-30',
        },
    ];

    it('is a horizontal bar with no bottom margin and one series of totalSets', () => {
        const options = buildForgottenMusclesChartOptions(muscles);
        const series = seriesOf(options!);

        expect(options?.chart?.type).toBe('bar');
        expect(options?.chart?.marginBottom).toBe(0);
        expect(series.length).toBe(1);
        expect(series[0].data.map((p) => p.y)).toEqual([4, 12]);
    });

    it('preserves the backend order instead of re-ranking', () => {
        const options = buildForgottenMusclesChartOptions(muscles);

        expect(xCategories(options!)).toEqual(['Espalda', 'Pecho']);
    });
});

describe('buildExerciseTrendChartOptions (TEST-016)', () => {
    const trends: ExerciseTrendVM[] = [
        {
            exerciseId: 'a',
            name: 'Press banca',
            category: chest,
            slope: 1.2,
            pctChange: 12,
            label: 'UP',
            weeksUsed: 6,
        },
        {
            exerciseId: 'b',
            name: 'Sentadilla',
            category: legs,
            slope: -0.8,
            pctChange: -8,
            label: 'DOWN',
            weeksUsed: 5,
        },
        {
            exerciseId: 'c',
            name: 'Curl barra',
            category: biceps,
            slope: 0,
            pctChange: 0,
            label: 'FLAT',
            weeksUsed: 6,
        },
        {
            exerciseId: 'd',
            name: 'Sentadilla hung',
            category: legs,
            slope: null,
            pctChange: null,
            label: 'INSUFFICIENT',
            weeksUsed: 2,
        },
    ];

    it('is a diverging bar with symmetric min and max', () => {
        const options = buildExerciseTrendChartOptions(trends);
        const yAxis = options?.yAxis as YAxisOptions;

        expect(options?.chart?.type).toBe('bar');
        expect(yAxis.min).toBe(-(yAxis.max as number));
    });

    it('excludes INSUFFICIENT and null pctChange from the series', () => {
        const data = seriesOf(buildExerciseTrendChartOptions(trends)!)[0].data;

        expect(data.map((p) => p.name)).toEqual(['Press banca', 'Sentadilla', 'Curl barra']);
    });

    it('colors each point by its trend label', () => {
        const data = seriesOf(buildExerciseTrendChartOptions(trends)!)[0].data;

        expect(data.map((p) => p.color)).toEqual([
            TREND_LABEL_COLORS.UP,
            TREND_LABEL_COLORS.DOWN,
            TREND_LABEL_COLORS.FLAT,
        ]);
    });
});

describe('all builders (TEST-017)', () => {
    it('return null on empty input', () => {
        expect(buildOneRmWeeklyChartOptions([])).toBeNull();
        expect(buildVolumeByExerciseChartOptions([])).toBeNull();
        expect(buildVolumeByMuscleChartOptions([])).toBeNull();
        expect(buildVolumeTotalChartOptions([])).toBeNull();
        expect(buildCaloriesChartOptions([])).toBeNull();
        expect(buildForgottenMusclesChartOptions([])).toBeNull();
        expect(buildExerciseTrendChartOptions([])).toBeNull();
    });

    it('return null when the trend payload has nothing plottable', () => {
        expect(
            buildExerciseTrendChartOptions([
                {
                    exerciseId: 'd',
                    name: 'Sentadilla hung',
                    category: legs,
                    slope: null,
                    pctChange: null,
                    label: 'INSUFFICIENT',
                    weeksUsed: 2,
                },
            ]),
        ).toBeNull();
    });

    it('never mutate the arrays they receive', () => {
        const oneRm: OneRmExerciseVM[] = [
            oneRmExercise('a', 'Press banca', [oneRmWeek('2026-W40', 100)]),
        ];
        const weeks: VolumeWeekVM[] = [volumeWeek('2026-W40', [{ id: 'a', volume: 100 }])];
        const total: VolumeTotalWeekVM[] = [
            { weekKey: '2026-W40', totalVolume: 100, deltaPct: 1, possibleDeload: false },
        ];
        const calories: CaloriesWeekVM[] = [
            {
                weekKey: '2026-W40',
                routineKcal: null,
                extraKcal: 100,
                totalKcal: 100,
                estimatedSessions: 1,
            },
        ];
        const muscles: ForgottenMuscleVM[] = [
            {
                muscle: 'chest',
                label: 'Pecho',
                totalSets: 4,
                weeksWithoutWork: 1,
                lastTrainedAt: null,
            },
        ];
        const trends: ExerciseTrendVM[] = [
            {
                exerciseId: 'a',
                name: 'Press banca',
                category: chest,
                slope: 1,
                pctChange: 10,
                label: 'UP',
                weeksUsed: 5,
            },
        ];

        const snapshot = JSON.stringify([oneRm, weeks, total, calories, muscles, trends]);

        buildOneRmWeeklyChartOptions(oneRm);
        buildVolumeByExerciseChartOptions(weeks);
        buildVolumeByMuscleChartOptions(weeks);
        buildVolumeTotalChartOptions(total);
        buildCaloriesChartOptions(calories);
        buildForgottenMusclesChartOptions(muscles);
        buildExerciseTrendChartOptions(trends);
        selectTop1RmExercises(oneRm, 1);
        selectTopVolumeExercises(weeks, 1);

        expect(JSON.stringify([oneRm, weeks, total, calories, muscles, trends])).toBe(snapshot);
    });

    describe('weekCategories', () => {
        it('deduplicates and keeps first-appearance order', () => {
            expect(weekCategories(['2026-W40', '2026-W39', '2026-W40'])).toEqual([
                '2026-W40',
                '2026-W39',
            ]);
        });

        it('passes a malformed key through untouched', () => {
            expect(weekCategories(['semana 40'])).toEqual(['semana 40']);
        });

        it('hands the axis W## labels via formatWeekKey', () => {
            // El W## del eje sale de formatWeekKey; weekCategories solo deduplica.
            const options = buildVolumeTotalChartOptions([
                { weekKey: '2026-W40', totalVolume: 100, deltaPct: 1, possibleDeload: false },
            ]);

            expect(xCategories(options!)).toEqual(['W40']);
        });
    });
});
