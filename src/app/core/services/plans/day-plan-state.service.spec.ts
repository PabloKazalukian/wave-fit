import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';
import {
    KindEnum,
    RoutineDay,
    RoutineDayVM,
    RoutinePlanVM,
} from '../../../shared/interfaces/routines.interface';
import { RoutinesService } from '../routines/routines.service';
import { DayPlanStateService } from './day-plan-state.service';
import { PlansService } from './plans.service';

describe('DayPlanStateService', () => {
    let service: DayPlanStateService;
    let planSubject: BehaviorSubject<RoutinePlanVM | null>;
    let plansSvc: {
        routinePlanVM$: BehaviorSubject<RoutinePlanVM | null>;
        setExpandedDay: jasmine.Spy;
        setDayRoutine: jasmine.Spy;
        currentValue: jasmine.Spy;
    };
    let routinesSubject: BehaviorSubject<RoutineDay[]>;

    const buildDay = (day: number, overrides: Partial<RoutineDayVM> = {}): RoutineDayVM => ({
        day: day as RoutineDayVM['day'],
        title: '',
        kind: KindEnum.rest,
        expanded: day === 1,
        ...overrides,
    });

    const buildPlan = (): RoutinePlanVM => ({
        name: 'Plan',
        description: '',
        weekly_distribution: '',
        routineDays: [
            buildDay(1),
            buildDay(2),
            buildDay(3),
            buildDay(4),
            buildDay(5),
            buildDay(6),
            buildDay(7),
        ],
    });

    const buildRoutine = (id: string, type: ExerciseCategory): RoutineDay => ({
        id,
        title: id,
        type: [type],
        kind: KindEnum.workout,
        isFavorite: false,
    });

    beforeEach(() => {
        planSubject = new BehaviorSubject<RoutinePlanVM | null>(null);
        plansSvc = {
            routinePlanVM$: planSubject,
            setExpandedDay: jasmine.createSpy('setExpandedDay'),
            setDayRoutine: jasmine.createSpy('setDayRoutine'),
            currentValue: jasmine.createSpy('currentValue'),
        };
        routinesSubject = new BehaviorSubject<RoutineDay[]>([]);

        TestBed.configureTestingModule({
            providers: [
                DayPlanStateService,
                { provide: PlansService, useValue: plansSvc },
                {
                    provide: RoutinesService,
                    useValue: {
                        routines$: routinesSubject,
                        getAllRoutines: jasmine.createSpy('getAllRoutines').and.returnValue(of([])),
                    },
                },
            ],
        });
    });

    const createWithPlan = (plan: RoutinePlanVM) => {
        planSubject.next(plan);
        service = TestBed.inject(DayPlanStateService);
    };

    describe('index and selection', () => {
        it('defaults to day 1 and exposes the matching routine day', () => {
            const plan = buildPlan();
            plan.routineDays[0] = buildDay(1, { title: 'Push', kind: KindEnum.workout });
            createWithPlan(plan);

            expect(service.indexDay()).toBe(1);
            expect(service.routinaDay()?.title).toBe('Push');
        });

        it('setDay expands the target and moves the index', () => {
            const plan = buildPlan();
            plan.routineDays[2] = buildDay(3, { title: 'Legs' });
            createWithPlan(plan);

            service.setDay(3);

            expect(plansSvc.setExpandedDay).toHaveBeenCalledWith(2);
            expect(service.indexDay()).toBe(3);
            expect(service.routinaDay()?.title).toBe('Legs');
        });
    });

    describe('setKind (TEST-004)', () => {
        it('clears id/type/exercises/title when switching to REST', () => {
            const plan = buildPlan();
            plan.routineDays[0] = buildDay(1, {
                title: 'Push',
                kind: KindEnum.workout,
                id: 'rd-1',
                type: [ExerciseCategory.CHEST],
                exercises: [],
            });
            createWithPlan(plan);

            service.setKind('REST');

            expect(plansSvc.setDayRoutine).toHaveBeenCalledWith(
                0,
                jasmine.objectContaining({
                    kind: 'REST',
                    id: undefined,
                    type: undefined,
                    exercises: undefined,
                    title: '',
                }),
            );
        });

        it('preserves id/type/exercises/title when switching to WORKOUT', () => {
            const plan = buildPlan();
            plan.routineDays[0] = buildDay(1, {
                title: 'Push',
                kind: KindEnum.workout,
                id: 'rd-1',
                type: [ExerciseCategory.CHEST],
                exercises: [],
            });
            createWithPlan(plan);

            service.setKind('WORKOUT');

            expect(plansSvc.setDayRoutine).toHaveBeenCalledWith(
                0,
                jasmine.objectContaining({ kind: 'WORKOUT', id: 'rd-1', title: 'Push' }),
            );
        });

        it('does nothing when there is no routine day', () => {
            createWithPlan({ ...buildPlan(), routineDays: [] });

            service.setKind('WORKOUT');

            expect(plansSvc.setDayRoutine).not.toHaveBeenCalled();
        });
    });

    describe('clearRoutine', () => {
        it('drops the routine id and type of the active day', () => {
            const plan = buildPlan();
            plan.routineDays[0] = buildDay(1, { id: 'rd-1', type: [ExerciseCategory.CHEST] });
            createWithPlan(plan);

            service.clearRoutine();

            expect(plansSvc.setDayRoutine).toHaveBeenCalledWith(
                0,
                jasmine.objectContaining({ id: undefined, type: undefined }),
            );
        });
    });

    describe('derived signals', () => {
        it('selectedCategory and routinesByCategory follow the active day type', () => {
            const plan = buildPlan();
            plan.routineDays[0] = buildDay(1, { type: [ExerciseCategory.CHEST] });
            const chest = buildRoutine('rd-1', ExerciseCategory.CHEST);
            const back = buildRoutine('rd-2', ExerciseCategory.BACK);
            routinesSubject.next([chest, back]);
            createWithPlan(plan);

            expect(service.selectedCategory()).toBe(ExerciseCategory.CHEST);
            expect(service.routinesByCategory()).toEqual([chest]);
        });

        it('expandedDays returns the days flagged as expanded', () => {
            createWithPlan(buildPlan());

            expect(service.expandedDays().map((d) => d.day)).toEqual([1]);
        });
    });
});
