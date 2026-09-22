import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { History } from './history';
import { TrainingHistoryService } from '../../../core/services/training-history/training-history.service';
import { PlanTrackingService } from '../../../core/services/trackings/plan-tracking.service';
import { PlanDayService } from '../../../core/services/day-logs/plan-day.service';
import { ExercisesService } from '../../../core/services/exercises/exercises.service';
import {
    CalendarDay,
    CalendarDayType,
    TrainingStatus,
} from '../../../shared/interfaces/training-history.interface';
import {
    ExercisePerformanceVM,
    TrackingVM,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { DayLogVM } from '../../../shared/interfaces/day-log.interface';

describe('History', () => {
    let component: History;
    let fixture: ComponentFixture<History>;
    let trainingHistorySvc: jasmine.SpyObj<TrainingHistoryService>;
    let planTrackingSvc: jasmine.SpyObj<PlanTrackingService>;
    let planDaySvc: jasmine.SpyObj<PlanDayService>;
    let exerciseSvc: jasmine.SpyObj<ExercisesService>;

    const qs = (selector: string): HTMLElement | null =>
        fixture.nativeElement.querySelector(selector);

    const exercise = (id: string, name: string, series = 3): ExercisePerformanceVM => ({
        exerciseId: id,
        name,
        series,
        category: 'strength' as ExercisePerformanceVM['category'],
        sets: [{ reps: 10, weights: 20 }],
        usesWeight: true,
    });

    const weekLogDay: CalendarDay = {
        date: '2026-02-02',
        type: CalendarDayType.WEEK_LOG,
        status: TrainingStatus.COMPLETE,
        workoutSessionId: 'ws-1',
        weekLogReference: {
            id: 'week-1',
            startDate: '2026-02-02',
            endDate: '2026-02-08',
            completed: true,
            active: true,
        },
    };

    const dayLogDay: CalendarDay = {
        date: '2026-02-03',
        type: CalendarDayType.DAY_LOG,
        status: TrainingStatus.COMPLETE,
        dayLogId: 'day-1',
        weekLogReference: null,
    };

    const weekTracking = (workouts: WorkoutSessionVM[] = []): TrackingVM => ({
        id: 'week-1',
        userId: 'u1',
        startDate: '2026-02-02',
        endDate: '2026-02-08',
        completed: true,
        active: true,
        workouts,
    });

    const dayLog = (): DayLogVM => ({
        id: 'day-1',
        userId: 'u1',
        date: '2026-02-03',
        exercises: [exercise('ex-2', 'Sentadilla')],
        extraSessionIds: [],
        status: 'complete',
        active: false,
        completed: true,
    });

    beforeEach(async () => {
        planTrackingSvc = jasmine.createSpyObj('PlanTrackingService', ['findById']);
        planDaySvc = jasmine.createSpyObj('PlanDayService', ['findById']);
        exerciseSvc = jasmine.createSpyObj('ExercisesService', ['getExercises']);
        trainingHistorySvc = jasmine.createSpyObj('TrainingHistoryService', [
            'getTrainingCalendar',
        ]);
        trainingHistorySvc.getTrainingCalendar.and.callFake((year: number, month: number) =>
            of({ year, month, days: [] }),
        );

        await TestBed.configureTestingModule({
            imports: [History],
            providers: [
                provideRouter([]),
                { provide: TrainingHistoryService, useValue: trainingHistorySvc },
                { provide: PlanTrackingService, useValue: planTrackingSvc },
                { provide: PlanDayService, useValue: planDaySvc },
                { provide: ExercisesService, useValue: exerciseSvc },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(History);
        component = fixture.componentInstance;
        component.currentYear.set(2026);
        component.currentMonth.set(1); // Febrero
        exerciseSvc.getExercises.and.returnValue(of([]));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('week-log preview', () => {
        beforeEach(() => {
            component.calendarDays.set([weekLogDay]);
            fixture.detectChanges();
        });

        it('loads the clicked day, renders its exercises and links to the week show (FR-007)', () => {
            planTrackingSvc.findById.and.returnValue(
                of(
                    weekTracking([
                        {
                            id: 'ws-1',
                            date: '2026-02-02',
                            exercises: [exercise('ex-1', 'Press banca')],
                            status: 'complete',
                        },
                    ]),
                ),
            );

            const tile = qs('[data-date="2026-02-02"]');
            tile!.click();
            fixture.detectChanges();

            expect(exerciseSvc.getExercises).toHaveBeenCalled();
            expect(planTrackingSvc.findById).toHaveBeenCalledWith('week-1');

            const preview = qs('[data-test="history-preview"]');
            expect(preview).toBeTruthy();
            expect(preview!.textContent).toContain('Press banca');

            const cta = preview!.querySelector('a');
            expect(cta!.getAttribute('href')).toBe('/user/trackings/week-1');
            expect(cta!.textContent).toContain('Ver semana');
        });

        it('does not open a preview when the clicked day has no exercises', () => {
            planTrackingSvc.findById.and.returnValue(
                of(
                    weekTracking([
                        { id: 'ws-1', date: '2026-02-02', exercises: [], status: 'complete' },
                    ]),
                ),
            );

            const tile = qs('[data-date="2026-02-02"]');
            tile!.click();
            fixture.detectChanges();

            expect(planTrackingSvc.findById).toHaveBeenCalledWith('week-1');
            expect(qs('[data-test="history-preview"]')).toBeNull();
        });

        it('does not open a preview for a rest week-log day', () => {
            component.calendarDays.set([
                { ...weekLogDay, date: '2026-02-04', status: TrainingStatus.REST },
            ]);
            fixture.detectChanges();

            const tile = qs('[data-date="2026-02-04"]');
            tile!.click();
            fixture.detectChanges();

            expect(planTrackingSvc.findById).not.toHaveBeenCalled();
            expect(qs('[data-test="history-preview"]')).toBeNull();
        });

        it('shows an error state and retries when the week fetch fails', () => {
            planTrackingSvc.findById.and.throwError(new Error('nope'));

            const tile = qs('[data-date="2026-02-02"]');
            tile!.click();
            fixture.detectChanges();

            expect(planTrackingSvc.findById).toHaveBeenCalledWith('week-1');
            expect(qs('[data-test="history-preview"]')).toBeNull();

            planTrackingSvc.findById.and.returnValue(
                of(
                    weekTracking([
                        {
                            id: 'ws-1',
                            date: '2026-02-02',
                            exercises: [exercise('ex-1', 'Press banca')],
                            status: 'complete',
                        },
                    ]),
                ),
            );
            const retry = qs('[data-test="history-preview-retry"]');
            expect(retry).toBeTruthy();
            retry!.click();
            fixture.detectChanges();

            expect(qs('[data-test="history-preview"]')!.textContent).toContain('Press banca');
        });

        it('shows "Ver mi semana" when the loaded week is the active one', () => {
            planTrackingSvc.findById.and.returnValue(
                of(
                    weekTracking([
                        {
                            id: 'ws-1',
                            date: '2026-02-02',
                            exercises: [exercise('ex-1', 'Press banca')],
                            status: 'complete',
                        },
                    ]),
                ),
            );

            const tile = qs('[data-date="2026-02-02"]');
            tile!.click();
            fixture.detectChanges();

            const preview = qs('[data-test="history-preview"]')!;
            const texts = Array.from(preview.querySelectorAll('a')).map((a) =>
                a.textContent?.trim(),
            );
            expect(texts).toContain('Ver mi semana');
        });

        it('does not show "Ver mi semana" when the loaded week is not active', () => {
            component.calendarDays.set([
                {
                    ...weekLogDay,
                    weekLogReference: { ...weekLogDay.weekLogReference!, active: false },
                },
            ]);
            planTrackingSvc.findById.and.returnValue(
                of(
                    weekTracking([
                        {
                            id: 'ws-1',
                            date: '2026-02-02',
                            exercises: [exercise('ex-1', 'Press banca')],
                            status: 'complete',
                        },
                    ]),
                ),
            );
            fixture.detectChanges();

            const tile = qs('[data-date="2026-02-02"]');
            tile!.click();
            fixture.detectChanges();

            const preview = qs('[data-test="history-preview"]')!;
            expect(preview.textContent).toContain('Ver semana');
            expect(preview.textContent).not.toContain('Ver mi semana');
        });
    });

    describe('day-log preview', () => {
        beforeEach(() => {
            component.calendarDays.set([dayLogDay]);
            fixture.detectChanges();
        });

        it('loads the day-log, renders its exercises and links to the day show (FR-008)', () => {
            planDaySvc.findById.and.returnValue(of(dayLog()));

            const tile = qs('[data-date="2026-02-03"]');
            tile!.click();
            fixture.detectChanges();

            expect(exerciseSvc.getExercises).toHaveBeenCalled();
            expect(planDaySvc.findById).toHaveBeenCalledWith('day-1');

            const preview = qs('[data-test="history-preview"]');
            expect(preview).toBeTruthy();
            expect(preview!.textContent).toContain('Sentadilla');

            const cta = preview!.querySelector('a');
            expect(cta!.getAttribute('href')).toBe('/user/tracking/day/day-1');
            expect(cta!.textContent).toContain('Ver día');
        });

        it('does not open a preview when the day-log has no exercises', () => {
            planDaySvc.findById.and.returnValue(of({ ...dayLog(), exercises: [] }));

            const tile = qs('[data-date="2026-02-03"]');
            tile!.click();
            fixture.detectChanges();

            expect(planDaySvc.findById).toHaveBeenCalledWith('day-1');
            expect(qs('[data-test="history-preview"]')).toBeNull();
        });
    });

    it('clicking an empty day closes an open preview', () => {
        planTrackingSvc.findById.and.returnValue(
            of(
                weekTracking([
                    {
                        id: 'ws-1',
                        date: '2026-02-02',
                        exercises: [exercise('ex-1', 'Press banca')],
                        status: 'complete',
                    },
                ]),
            ),
        );
        component.calendarDays.set([
            weekLogDay,
            { date: '2026-02-07', type: CalendarDayType.DAY_LOG, status: TrainingStatus.NONE },
        ]);
        fixture.detectChanges();

        qs('[data-date="2026-02-02"]')!.click();
        fixture.detectChanges();
        expect(qs('[data-test="history-preview"]')).toBeTruthy();

        qs('[data-date="2026-02-07"]')!.click();
        fixture.detectChanges();
        expect(qs('[data-test="history-preview"]')).toBeNull();
    });

    describe('month navigation', () => {
        it('moves to the next month and reloads its calendar days', () => {
            const marchDay: CalendarDay = {
                date: '2026-03-04',
                type: CalendarDayType.DAY_LOG,
                status: TrainingStatus.COMPLETE,
                dayLogId: 'day-3',
                weekLogReference: null,
            };
            trainingHistorySvc.getTrainingCalendar.and.callFake((year: number, month: number) =>
                of({ year, month, days: month === 2 ? [marchDay] : [] }),
            );

            qs('button[aria-label="Mes siguiente"]')!.click();
            fixture.detectChanges();

            expect(component.currentMonth()).toBe(2);
            expect(trainingHistorySvc.getTrainingCalendar).toHaveBeenCalledWith(2026, 2);
            expect(component.calendarDays()).toEqual([marchDay]);
        });

        it('wraps the year when moving back from January', () => {
            component.currentMonth.set(0);
            component.currentYear.set(2026);
            fixture.detectChanges();

            qs('button[aria-label="Mes anterior"]')!.click();
            fixture.detectChanges();

            expect(component.currentMonth()).toBe(11);
            expect(component.currentYear()).toBe(2025);
            expect(trainingHistorySvc.getTrainingCalendar).toHaveBeenCalledWith(2025, 11);
        });

        it('closes an open preview when navigating months', () => {
            planTrackingSvc.findById.and.returnValue(
                of(
                    weekTracking([
                        {
                            id: 'ws-1',
                            date: '2026-02-02',
                            exercises: [exercise('ex-1', 'Press banca')],
                            status: 'complete',
                        },
                    ]),
                ),
            );
            component.calendarDays.set([weekLogDay]);
            fixture.detectChanges();

            qs('[data-date="2026-02-02"]')!.click();
            fixture.detectChanges();
            expect(qs('[data-test="history-preview"]')).toBeTruthy();

            qs('button[aria-label="Mes siguiente"]')!.click();
            fixture.detectChanges();

            expect(qs('[data-test="history-preview"]')).toBeNull();
        });
    });
});
