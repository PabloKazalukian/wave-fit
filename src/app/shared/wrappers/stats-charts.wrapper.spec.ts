import {
    CaloriesWeekAPI,
    ExerciseTrendAPI,
    ForgottenMuscleAPI,
    OneRmExerciseAPI,
    TrendLabelAPI,
    VolumeTotalWeekAPI,
    VolumeWeekAPI,
} from '../interfaces/api/stats-charts-api.interface';
import {
    wrapperExerciseTrendApiToVM,
    wrapperForgottenMuscleApiToVM,
    wrapperOneRmExerciseApiToVM,
    wrapperStatsCaloriesWeeklyToVM,
    wrapperStatsExerciseTrendToVM,
    wrapperStatsForgottenMusclesToVM,
    wrapperStats1RmWeeklyToVM,
    wrapperStatsVolumeTotalWeeklyToVM,
    wrapperStatsVolumeWeeklyToVM,
    wrapperVolumeTotalWeekApiToVM,
    wrapperVolumeWeekApiToVM,
} from './stats-charts.wrapper';

const TZ = 'America/Argentina/Buenos_Aires';

const week = (overrides: Partial<OneRmExerciseAPI['weeks'][number]> = {}) => ({
    weekKey: '2026-W40',
    best1RM: 100,
    weightUsed: 80,
    reps: 5,
    participated: true,
    ...overrides,
});

const oneRm = (overrides: Partial<OneRmExerciseAPI> = {}): OneRmExerciseAPI => ({
    exerciseId: 'ex-1',
    name: 'Press de banca',
    category: 'CHEST',
    weeks: [week()],
    ...overrides,
});

describe('stats-charts.wrapper (TEST-009)', () => {
    describe('category', () => {
        it('lowercases an UPPERCASE API category (BR-004)', () => {
            const vm = wrapperOneRmExerciseApiToVM(oneRm({ category: 'LEGS_FRONT' }));

            expect(vm.category).toBe('legs_front');
        });

        it('falls back to unknown for a category outside the enum', () => {
            const vm = wrapperOneRmExerciseApiToVM(oneRm({ category: 'ANTIGRAVITY' }));

            expect(vm.category).toBe('unknown');
        });
    });

    describe('1RM nullable numerics', () => {
        it('keeps nulls as null instead of coercing them to 0', () => {
            const vm = wrapperOneRmExerciseApiToVM(
                oneRm({
                    weeks: [
                        week({
                            best1RM: null,
                            weightUsed: null,
                            reps: null,
                            participated: false,
                        }),
                    ],
                }),
            );

            expect(vm.weeks[0].best1RM).toBeNull();
            expect(vm.weeks[0].weightUsed).toBeNull();
            expect(vm.weeks[0].reps).toBeNull();
            expect(vm.weeks[0].participated).toBe(false);
        });

        it('rounds kg metrics to one decimal', () => {
            const vm = wrapperOneRmExerciseApiToVM(
                oneRm({ weeks: [week({ best1RM: 100.567, weightUsed: 79.94 })] }),
            );

            expect(vm.weeks[0].best1RM).toBe(100.6);
            expect(vm.weeks[0].weightUsed).toBe(79.9);
        });

        it('maps a null container to an empty array', () => {
            expect(wrapperStats1RmWeeklyToVM(null)).toEqual([]);
        });

        it('does not mutate the input', () => {
            const input = oneRm({ weeks: [week({ best1RM: 100.567 })] });
            const snapshot = JSON.stringify(input);

            wrapperStats1RmWeeklyToVM([input]);

            expect(JSON.stringify(input)).toBe(snapshot);
        });
    });

    describe('volume', () => {
        it('normalizes exercises, muscles and rounds volumes', () => {
            const api: VolumeWeekAPI = {
                weekKey: '2026-W40',
                exercises: [
                    { exerciseId: 'ex-1', name: 'Press', category: 'CHEST', volume: 1200.567 },
                ],
                muscles: [{ muscle: 'chest', sets: 4, volume: 1200.567 }],
            };

            const vm = wrapperVolumeWeekApiToVM(api);

            expect(vm.exercises[0].category).toBe('chest');
            expect(vm.exercises[0].volume).toBe(1200.6);
            expect(vm.muscles[0].muscle).toBe('chest');
            expect(vm.muscles[0].label).toBe('Pecho');
            expect(vm.muscles[0].volume).toBe(1200.6);
        });

        it('maps a null container to an empty array', () => {
            expect(wrapperStatsVolumeWeeklyToVM(null)).toEqual([]);
        });
    });

    describe('volume total', () => {
        it('keeps a null deltaPct and rounds percentages to integer', () => {
            const api: VolumeTotalWeekAPI = {
                weekKey: '2026-W40',
                totalVolume: 8123.456,
                deltaPct: null,
                possibleDeload: false,
            };

            expect(wrapperVolumeTotalWeekApiToVM(api).deltaPct).toBeNull();

            const withDelta = wrapperVolumeTotalWeekApiToVM({
                ...api,
                deltaPct: 12.7,
                possibleDeload: true,
            });

            expect(withDelta.deltaPct).toBe(13);
            expect(withDelta.totalVolume).toBe(8123.5);
            expect(withDelta.possibleDeload).toBe(true);
        });

        it('maps a null container to an empty array', () => {
            expect(wrapperStatsVolumeTotalWeeklyToVM(null)).toEqual([]);
        });
    });

    describe('calories', () => {
        it('keeps routineKcal null and preserves the rest', () => {
            const api: CaloriesWeekAPI = {
                weekKey: '2026-W40',
                routineKcal: null,
                extraKcal: 1850,
                totalKcal: 1850,
                estimatedSessions: 3,
            };

            const vm = wrapperStatsCaloriesWeeklyToVM([api])[0];

            expect(vm.routineKcal).toBeNull();
            expect(vm.extraKcal).toBe(1850);
            expect(vm.totalKcal).toBe(1850);
            expect(vm.estimatedSessions).toBe(3);
        });

        it('maps a null container to an empty array', () => {
            expect(wrapperStatsCaloriesWeeklyToVM(null)).toEqual([]);
        });
    });

    describe('exercise trend', () => {
        it('keeps slope and pctChange null when there is not enough data', () => {
            const api: ExerciseTrendAPI = {
                exerciseId: 'ex-1',
                name: 'Sentadilla',
                category: 'LEGS',
                slope: null,
                pctChange: null,
                label: 'INSUFFICIENT',
                weeksUsed: 2,
            };

            const vm = wrapperExerciseTrendApiToVM(api);

            expect(vm.slope).toBeNull();
            expect(vm.pctChange).toBeNull();
            expect(vm.label).toBe('INSUFFICIENT');
            expect(vm.category).toBe('legs');
        });

        it('rounds slope to one decimal and pctChange to integer', () => {
            const vm = wrapperExerciseTrendApiToVM({
                exerciseId: 'ex-1',
                name: 'Sentadilla',
                category: 'LEGS',
                slope: 1.567,
                pctChange: -8.2,
                label: 'DOWN',
                weeksUsed: 9,
            });

            expect(vm.slope).toBe(1.6);
            expect(vm.pctChange).toBe(-8);
        });

        it('narrows an unknown label to INSUFFICIENT', () => {
            const vm = wrapperExerciseTrendApiToVM({
                exerciseId: 'ex-1',
                name: 'Sentadilla',
                category: 'LEGS',
                slope: 1,
                pctChange: 4,
                label: 'SIDEWAYS' as TrendLabelAPI,
                weeksUsed: 5,
            });

            expect(vm.label).toBe('INSUFFICIENT');
        });

        it('maps a null container to an empty array', () => {
            expect(wrapperStatsExerciseTrendToVM(null)).toEqual([]);
        });
    });
});

describe('stats-charts.wrapper forgotten muscles (TEST-010)', () => {
    it('converts an ISO DateTime to a LocalDate in the user timezone', () => {
        const api: ForgottenMuscleAPI = {
            muscle: 'chest',
            totalSets: 12,
            weeksWithoutWork: 3,
            lastTrainedAt: '2026-05-01T02:30:00.000Z',
        };

        const vm = wrapperForgottenMuscleApiToVM(api, TZ);

        expect(vm.lastTrainedAt).toBe('2026-04-30');
    });

    it('keeps a null lastTrainedAt as null', () => {
        const vm = wrapperForgottenMuscleApiToVM(
            { muscle: 'core', totalSets: 0, weeksWithoutWork: 9, lastTrainedAt: null },
            TZ,
        );

        expect(vm.lastTrainedAt).toBeNull();
    });

    it('keeps a backend-only muscle verbatim and translates the label (Correction 6)', () => {
        const vm = wrapperStatsForgottenMusclesToVM(
            [
                { muscle: 'rest', totalSets: 4, weeksWithoutWork: 2, lastTrainedAt: null },
                { muscle: 'chest', totalSets: 12, weeksWithoutWork: 3, lastTrainedAt: null },
            ],
            TZ,
        );

        // 'rest' no existe en el enum del frontend: no colapsa a 'unknown'
        expect(vm[0].muscle).toBe('rest');
        expect(vm[0].label).toBe('Rest');

        // un músculo conocido sí se traduce
        expect(vm[1].muscle).toBe('chest');
        expect(vm[1].label).toBe('Pecho');
    });

    it('does not collapse a backend-only muscle to unknown in the volume muscles list', () => {
        const vm = wrapperVolumeWeekApiToVM({
            weekKey: '2026-W40',
            exercises: [],
            muscles: [{ muscle: 'rest', sets: 2, volume: 100 }],
        });

        expect(vm.muscles[0].muscle).toBe('rest');
        expect(vm.muscles[0].label).toBe('Rest');
    });
});
