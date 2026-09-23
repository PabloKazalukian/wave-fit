import { TrackingAPI, WeekLogDayAPI } from '../interfaces/api/tracking-api.interface';
import { Exercise } from '../interfaces/exercise.interface';
import { StatusWorkoutSessionEnum, WorkoutSessionVM } from '../interfaces/tracking.interface';
import {
    wrapperTrackingApiToVMS,
    wrapperTrackingApiToVM,
    wrapperWeekLogDayApiToVM,
    wrapperWorkoutSessionVMtoUpdateWeekLogDayInput,
} from './tracking.wrapper';

describe('tracking.wrapper (TEST-005)', () => {
    const ISO = '2026-05-01T02:30:00.000Z';

    const withTimezone = (timeZone: string) => {
        const resolved = new Intl.DateTimeFormat('en-US', { timeZone }).resolvedOptions();
        spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').and.returnValue(resolved);
    };

    const buildDay = (overrides: Partial<WeekLogDayAPI> = {}): WeekLogDayAPI => ({
        order: 1,
        date: ISO,
        isRest: false,
        extraSessionIds: [],
        status: 'pending',
        ...overrides,
    });

    const buildTracking = (overrides: Partial<TrackingAPI> = {}): TrackingAPI => ({
        id: 't-1',
        userId: 'user-1',
        startDate: ISO,
        endDate: ISO,
        days: [buildDay()],
        completed: false,
        active: false,
        ...overrides,
    });

    const catalog: Exercise[] = [];

    it('converts startDate and endDate from ISO to the LocalDate of the resolved timezone (UTC-3)', () => {
        withTimezone('America/Argentina/Buenos_Aires');

        const vm = wrapperTrackingApiToVM(buildTracking(), catalog);

        expect(vm.startDate).toBe('2026-04-30');
        expect(vm.endDate).toBe('2026-04-30');
    });

    it('converts the same ISO instant to another timezone (UTC+9)', () => {
        withTimezone('Asia/Tokyo');

        const vm = wrapperTrackingApiToVM(buildTracking(), catalog);

        expect(vm.startDate).toBe('2026-05-01');
    });

    it('returns plain yyyy-MM-dd strings without time information', () => {
        withTimezone('UTC');

        const vm = wrapperTrackingApiToVM(buildTracking(), catalog);

        expect(vm.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(vm.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('converts the day date in wrapperWeekLogDayApiToVM', () => {
        withTimezone('America/Argentina/Buenos_Aires');

        const vm = wrapperWeekLogDayApiToVM(buildDay(), catalog);

        expect(vm.date).toBe('2026-04-30');
    });

    it('maps the active flag to the view model', () => {
        withTimezone('UTC');

        const inactive = wrapperTrackingApiToVM(buildTracking(), catalog);
        expect(inactive.active).toBe(false);

        const active = wrapperTrackingApiToVM(buildTracking({ active: true }), catalog);
        expect(active.active).toBe(true);
    });

    it('converts every day and workout date in wrapperTrackingApiToVMS', () => {
        withTimezone('America/Argentina/Buenos_Aires');

        const vm = wrapperTrackingApiToVMS(
            buildTracking({
                days: [
                    buildDay({ order: 1 }),
                    buildDay({ order: 2, date: '2026-05-10T15:00:00.000Z' }),
                ],
            }),
            catalog,
        );

        expect(vm.startDate).toBe('2026-04-30');
        expect(vm.days.map((d) => d.date)).toEqual(['2026-04-30', '2026-05-10']);
        expect(vm.workouts?.map((w) => w.date)).toEqual(['2026-04-30', '2026-05-10']);
    });

    describe('wrapperWorkoutSessionVMtoUpdateWeekLogDayInput', () => {
        const buildWorkout = (overrides: Partial<WorkoutSessionVM> = {}): WorkoutSessionVM => ({
            id: 'ws-1',
            date: '2026-05-01',
            exercises: [],
            status: StatusWorkoutSessionEnum.COMPLETE,
            ...overrides,
        });

        it('keeps a real workoutSessionId', () => {
            const [day] = wrapperWorkoutSessionVMtoUpdateWeekLogDayInput([buildWorkout()]);

            expect(day.workoutSessionId).toBe('ws-1');
        });

        it('normalizes an empty id to undefined instead of leaking ""', () => {
            const [day] = wrapperWorkoutSessionVMtoUpdateWeekLogDayInput([
                buildWorkout({ id: '' }),
            ]);

            expect(day.workoutSessionId).toBeUndefined();
        });
    });
});
