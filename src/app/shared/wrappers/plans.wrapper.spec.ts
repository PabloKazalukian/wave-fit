import { ExerciseCategory } from '../interfaces/exercise.interface';
import { DayIndex, KindEnum, RoutineDayVM, RoutinePlanVM } from '../interfaces/routines.interface';
import { wrapperRoutinePlanVMtoRoutinePlan } from './plans.wrapper';

describe('plans.wrapper (TEST-005)', () => {
    const buildDay = (
        day: number,
        id: string | undefined,
        overrides: Partial<RoutineDayVM> = {},
    ): RoutineDayVM => ({
        id,
        day: day as DayIndex,
        title: `Day ${day}`,
        kind: KindEnum.workout,
        expanded: false,
        type: [ExerciseCategory.CHEST],
        exercises: [],
        ...overrides,
    });

    const buildPlan = (days: RoutineDayVM[]): RoutinePlanVM => ({
        name: 'Plan A',
        description: 'Description',
        weekly_distribution: '1,2,3,4,5,6,7',
        routineDays: days,
        createdBy: 'user-1',
    });

    it('maps routineDays to their day ids', () => {
        const plan = buildPlan([
            buildDay(1, 'rd-1'),
            buildDay(2, 'rd-2'),
            buildDay(3, undefined),
            buildDay(4, 'rd-4'),
        ]);

        const payload = wrapperRoutinePlanVMtoRoutinePlan(plan);

        expect(payload.routineDays).toEqual(['rd-1', 'rd-2', '', 'rd-4']);
    });

    it('maps the scalar fields and createdBy', () => {
        const payload = wrapperRoutinePlanVMtoRoutinePlan(buildPlan([buildDay(1, 'rd-1')]));

        expect(payload.name).toBe('Plan A');
        expect(payload.description).toBe('Description');
        expect(payload.weekly_distribution).toBe('1,2,3,4,5,6,7');
        expect(payload.createdBy).toBe('user-1');
    });

    it('does not forward the plan id', () => {
        const payload = wrapperRoutinePlanVMtoRoutinePlan({
            ...buildPlan([buildDay(1, 'rd-1')]),
            id: 'plan-1',
        });

        expect('id' in payload).toBe(false);
    });
});
