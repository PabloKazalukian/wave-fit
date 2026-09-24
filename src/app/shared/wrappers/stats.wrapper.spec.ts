import {
    wrapperAdherenceApiToVM,
    wrapperPersonalRecordsApiToVM,
    wrapperTopExercisesApiToVM,
    wrapperTopRoutinesApiToVM,
} from './stats.wrapper';

describe('stats.wrapper', () => {
    describe('wrapperTopExercisesApiToVM', () => {
        it('normalizes category to lowercase (BR-004) and rounds volume/avg', () => {
            const vm = wrapperTopExercisesApiToVM({
                id: 'e1',
                userId: 'u1',
                computedAt: '2026-09-20T10:00:00.000Z',
                exercises: [
                    {
                        rank: 1,
                        exerciseId: 'ex1',
                        name: 'Press banca',
                        category: 'CHEST',
                        totalSessions: 5,
                        totalVolume: 1234.567,
                        avgVolumePerSession: 246.9134,
                    },
                ],
            });

            expect(vm.exercises[0].category).toBe('chest');
            expect(vm.exercises[0].totalVolume).toBe(1234.6);
            expect(vm.exercises[0].avgVolumePerSession).toBe(246.9);
            expect(vm.exercises[0].totalSessions).toBe(5);
        });

        it('maps unknown categories to "unknown" without throwing', () => {
            const vm = wrapperTopExercisesApiToVM({
                id: 'e1',
                userId: 'u1',
                computedAt: '2026-09-20T10:00:00.000Z',
                exercises: [
                    {
                        rank: 1,
                        exerciseId: 'ex1',
                        name: 'Rare',
                        category: 'WEIRD_VALUE',
                        totalSessions: 1,
                        totalVolume: 10,
                        avgVolumePerSession: 10,
                    },
                ],
            });

            expect(vm.exercises[0].category).toBe('unknown');
        });

        it('tolerates a missing exercises array', () => {
            const vm = wrapperTopExercisesApiToVM({
                id: 'e1',
                userId: 'u1',
                computedAt: '2026-09-20T10:00:00.000Z',
                exercises: undefined as never,
            });

            expect(vm.exercises).toEqual([]);
        });
    });

    describe('wrapperTopRoutinesApiToVM', () => {
        it('rounds adherenceRate to integer and keeps the rest', () => {
            const vm = wrapperTopRoutinesApiToVM({
                id: 'r1',
                userId: 'u1',
                computedAt: '2026-09-20T10:00:00.000Z',
                routines: [
                    {
                        rank: 1,
                        planId: 'p1',
                        name: 'Push Pull Legs',
                        totalWeeks: 4,
                        totalSessions: 12,
                        adherenceRate: 93.33,
                    },
                ],
            });

            expect(vm.routines[0].adherenceRate).toBe(93);
            expect(vm.routines[0].totalWeeks).toBe(4);
            expect(vm.routines[0].name).toBe('Push Pull Legs');
        });
    });

    describe('wrapperPersonalRecordsApiToVM', () => {
        it('keeps LocalDate, null previousOneRm and rounds numeric metrics (BR-003)', () => {
            const vm = wrapperPersonalRecordsApiToVM({
                id: 'pr1',
                userId: 'u1',
                computedAt: '2026-09-20T10:00:00.000Z',
                records: [
                    {
                        exerciseId: 'ex1',
                        exerciseName: 'Sentadilla',
                        category: 'LEGS',
                        oneRmEstimated: 120.345,
                        bestWeight: 100.55,
                        bestReps: 5,
                        bestVolume: 1000,
                        achievedAt: '2026-09-15',
                        previousOneRm: null,
                    },
                ],
            });

            expect(vm.records[0].category).toBe('legs');
            expect(vm.records[0].achievedAt).toBe('2026-09-15');
            expect(vm.records[0].previousOneRm).toBeNull();
            expect(vm.records[0].oneRmEstimated).toBe(120.3);
            expect(vm.records[0].bestWeight).toBe(100.6);
            expect(vm.records[0].bestReps).toBe(5);
        });

        it('rounds non-null previousOneRm', () => {
            const vm = wrapperPersonalRecordsApiToVM({
                id: 'pr1',
                userId: 'u1',
                computedAt: '2026-09-20T10:00:00.000Z',
                records: [
                    {
                        exerciseId: 'ex1',
                        exerciseName: 'Sentadilla',
                        category: 'LEGS',
                        oneRmEstimated: 120,
                        bestWeight: 100,
                        bestReps: 5,
                        bestVolume: 1000,
                        achievedAt: '2026-09-15',
                        previousOneRm: 117.666,
                    },
                ],
            });

            expect(vm.records[0].previousOneRm).toBe(117.7);
        });
    });

    describe('wrapperAdherenceApiToVM', () => {
        it('preserves weekStartDate LocalDate and rounds adherencePercent', () => {
            const vm = wrapperAdherenceApiToVM({
                id: 'a1',
                userId: 'u1',
                computedAt: '2026-09-20T10:00:00.000Z',
                weeks: [
                    {
                        weekStartDate: '2026-09-14',
                        totalDays: 7,
                        completedDays: 5,
                        skippedDays: 1,
                        pendingDays: 1,
                        adherencePercent: 71.428,
                    },
                ],
            });

            expect(vm.weeks[0].weekStartDate).toBe('2026-09-14');
            expect(vm.weeks[0].adherencePercent).toBe(71);
            expect(vm.weeks[0].totalDays).toBe(7);
        });
    });
});
