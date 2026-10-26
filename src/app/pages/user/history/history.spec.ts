import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { History } from './history';
import { TrainingHistoryService } from '../../../core/services/training-history/training-history.service';
import { PlanTrackingService } from '../../../core/services/trackings/plan-tracking.service';
import { PlanDayService } from '../../../core/services/day-logs/plan-day.service';
import { ExercisesService } from '../../../core/services/exercises/exercises.service';
import { ExtraSessionService } from '../../../core/services/extra-session/extra-session.service';
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
import {
    ExtraSession,
    ExtraSessionCategory,
    ExtraSessionDisciplineConfig,
} from '../../../shared/interfaces/extra-session.interface';

describe('History', () => {
    let component: History;
    let fixture: ComponentFixture<History>;
    let trainingHistorySvc: jasmine.SpyObj<TrainingHistoryService>;
    let planTrackingSvc: jasmine.SpyObj<PlanTrackingService>;
    let planDaySvc: jasmine.SpyObj<PlanDayService>;
    let exerciseSvc: jasmine.SpyObj<ExercisesService>;
    let extraSessionSvc: jasmine.SpyObj<ExtraSessionService>;

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

    const extraSession: ExtraSession = {
        id: 'extra-1',
        category: ExtraSessionCategory.CARDIO,
        discipline: 'running',
        date: '2026-02-02',
        duration: 30,
        intensityLevel: 3,
        calories: 320,
        notes: 'trotada',
    };

    const catalog: ExtraSessionDisciplineConfig[] = [
        { key: 'running', label: 'Running', category: ExtraSessionCategory.CARDIO, met: 9.8 },
    ];

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
        planDaySvc = jasmine.createSpyObj('PlanDayService', ['findById', 'createDayLogDeferred']);
        exerciseSvc = jasmine.createSpyObj('ExercisesService', ['getExercises']);
        trainingHistorySvc = jasmine.createSpyObj('TrainingHistoryService', [
            'getTrainingCalendar',
        ]);
        trainingHistorySvc.getTrainingCalendar.and.callFake((year: number, month: number) =>
            of({ year, month, days: [] }),
        );
        extraSessionSvc = jasmine.createSpyObj('ExtraSessionService', ['loadCatalog']);
        extraSessionSvc.catalog$ = of(catalog);
        extraSessionSvc.loadCatalog.and.returnValue();

        await TestBed.configureTestingModule({
            imports: [History],
            providers: [
                provideRouter([]),
                { provide: TrainingHistoryService, useValue: trainingHistorySvc },
                { provide: PlanTrackingService, useValue: planTrackingSvc },
                { provide: PlanDayService, useValue: planDaySvc },
                { provide: ExercisesService, useValue: exerciseSvc },
                { provide: ExtraSessionService, useValue: extraSessionSvc },
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

        it('selects a rest week-log day without opening a preview or offering a deferred day', () => {
            component.calendarDays.set([
                { ...weekLogDay, date: '2026-02-04', status: TrainingStatus.REST },
            ]);
            fixture.detectChanges();

            const tile = qs('[data-date="2026-02-04"]');
            tile!.click();
            fixture.detectChanges();

            expect(component.selectedDate()).toBe('2026-02-04');
            expect(planTrackingSvc.findById).not.toHaveBeenCalled();
            expect(qs('[data-test="history-preview"]')).toBeNull();
            expect(qs('[data-test="history-add-deferred"]')).toBeNull();
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

        it('opens a preview with extra sessions only when the day has no exercises (FR-011)', () => {
            component.calendarDays.set([{ ...weekLogDay, extraSessions: [extraSession] }]);
            planTrackingSvc.findById.and.returnValue(
                of(
                    weekTracking([
                        {
                            id: 'ws-1',
                            date: '2026-02-02',
                            exercises: [],
                            status: 'complete',
                        },
                    ]),
                ),
            );
            fixture.detectChanges();

            qs('[data-date="2026-02-02"]')!.click();
            fixture.detectChanges();

            const preview = qs('[data-test="history-preview"]')!;
            expect(preview).toBeTruthy();
            expect(preview.textContent).toContain('Sesiones extra');
            expect(preview.textContent).toContain('Running');
        });

        it('opens a preview for a REST week-log day with extra sessions (FR-011)', () => {
            component.calendarDays.set([
                {
                    ...weekLogDay,
                    date: '2026-02-04',
                    status: TrainingStatus.REST,
                    extraSessions: [extraSession],
                },
            ]);
            planTrackingSvc.findById.and.returnValue(
                of(
                    weekTracking([
                        { id: 'ws-1', date: '2026-02-04', exercises: [], status: 'rest' },
                    ]),
                ),
            );
            fixture.detectChanges();

            qs('[data-date="2026-02-04"]')!.click();
            fixture.detectChanges();

            const preview = qs('[data-test="history-preview"]')!;
            expect(preview).toBeTruthy();
            expect(preview.textContent).toContain('Running');
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

        it('opens an empty preview for a day-log with no exercises (FR-008)', () => {
            planDaySvc.findById.and.returnValue(of({ ...dayLog(), exercises: [] }));

            const tile = qs('[data-date="2026-02-03"]');
            tile!.click();
            fixture.detectChanges();

            expect(planDaySvc.findById).toHaveBeenCalledWith('day-1');
            const preview = qs('[data-test="history-preview"]');
            expect(preview).toBeTruthy();
            expect(preview!.textContent).toContain('No hay ejercicios registrados');
            expect(preview!.textContent).toContain('Editar día');
        });

        it('renders extra sessions after the exercises (FR-011)', () => {
            component.calendarDays.set([{ ...dayLogDay, extraSessions: [extraSession] }]);
            planDaySvc.findById.and.returnValue(of(dayLog()));
            fixture.detectChanges();

            qs('[data-date="2026-02-03"]')!.click();
            fixture.detectChanges();

            const preview = qs('[data-test="history-preview"]')!;
            expect(preview.textContent).toContain('Sentadilla');
            expect(preview.textContent).toContain('Running');
            expect(preview.textContent!.indexOf('Sentadilla')).toBeLessThan(
                preview.textContent!.indexOf('Running'),
            );
        });

        it('opens a preview with extra sessions only when the day-log has no exercises (FR-011)', () => {
            component.calendarDays.set([{ ...dayLogDay, extraSessions: [extraSession] }]);
            planDaySvc.findById.and.returnValue(of({ ...dayLog(), exercises: [] }));
            fixture.detectChanges();

            qs('[data-date="2026-02-03"]')!.click();
            fixture.detectChanges();

            const preview = qs('[data-test="history-preview"]')!;
            expect(preview).toBeTruthy();
            expect(preview.textContent).toContain('Running');
            expect(preview.textContent).toContain('Ver día');
        });

        it('opens a CTA-less preview when a day-log has extras but no dayLogId (FR-011)', () => {
            component.calendarDays.set([
                { ...dayLogDay, dayLogId: undefined, extraSessions: [extraSession] },
            ]);
            fixture.detectChanges();

            qs('[data-date="2026-02-03"]')!.click();
            fixture.detectChanges();

            expect(planDaySvc.findById).not.toHaveBeenCalled();
            const preview = qs('[data-test="history-preview"]')!;
            expect(preview).toBeTruthy();
            expect(preview.textContent).toContain('Running');
            expect(preview.querySelector('a')).toBeNull();
            expect(qs('[data-test="history-empty-day"]')).toBeNull();
            expect(qs('[data-test="history-add-deferred"]')).toBeNull();
        });
    });

    it('selects an empty day, closes an open preview and offers the deferred-day button', () => {
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

        expect(component.selectedDate()).toBe('2026-02-07');
        expect(qs('[data-test="history-preview"]')).toBeNull();

        const info = qs('[data-test="history-empty-day"]');
        expect(info).toBeTruthy();
        expect(info!.querySelectorAll('li').length).toBe(2);
        expect(info!.textContent).toContain('No hay datos en este día');
        expect(info!.textContent).toContain('forma diferida');

        const button = qs('[data-test="history-add-deferred"]');
        expect(button).toBeTruthy();
        expect(button!.tagName).toBe('BUTTON');
        expect(button!.textContent).toContain('Agregar día');
        expect(
            info!.compareDocumentPosition(button!) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });

    it('jumps to the padding day month and selects that day', () => {
        component.calendarDays.set([]);
        fixture.detectChanges();

        qs('[data-date="2026-01-31"]')!.click();
        fixture.detectChanges();

        expect(trainingHistorySvc.getTrainingCalendar).toHaveBeenCalledWith(2026, 0);
        expect(component.currentYear()).toBe(2026);
        expect(component.currentMonth()).toBe(0);
        expect(component.selectedDate()).toBe('2026-01-31');
        expect(qs('[data-test="history-empty-day"]')).toBeTruthy();
        expect(qs('[data-test="history-add-deferred"]')).toBeTruthy();
    });

    it('renders the deferred-day button below the calendar', () => {
        component.calendarDays.set([
            { date: '2026-02-07', type: CalendarDayType.DAY_LOG, status: TrainingStatus.NONE },
        ]);
        fixture.detectChanges();

        qs('[data-date="2026-02-07"]')!.click();
        fixture.detectChanges();

        const calendar = qs('app-training-history-calendar')!;
        const button = qs('[data-test="history-add-deferred"]')!;
        expect(
            calendar.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });

    describe('deferred day creation', () => {
        const emptyDay: CalendarDay = {
            date: '2026-02-07',
            type: CalendarDayType.DAY_LOG,
            status: TrainingStatus.NONE,
        };

        const createdDayLog = (): DayLogVM => ({
            id: 'new-1',
            userId: 'u1',
            date: '2026-02-07',
            exercises: [],
            extraSessionIds: [],
            status: 'pending',
            active: false,
            completed: false,
        });

        beforeEach(() => {
            component.calendarDays.set([emptyDay]);
            fixture.detectChanges();
            qs('[data-date="2026-02-07"]')!.click();
            fixture.detectChanges();
        });

        it('creates the day, notifies, reloads the calendar and selects the created day', () => {
            const created = createdDayLog();
            planDaySvc.createDayLogDeferred.and.returnValue(of(created));
            planDaySvc.findById.and.returnValue(of(created));
            trainingHistorySvc.getTrainingCalendar.and.callFake((year: number, month: number) =>
                of({
                    year,
                    month,
                    days: [
                        {
                            ...emptyDay,
                            dayLogId: created.id,
                            status: TrainingStatus.PENDING,
                        },
                    ],
                }),
            );
            const callsBefore = trainingHistorySvc.getTrainingCalendar.calls.count();

            qs('[data-test="history-add-deferred"]')!.click();
            fixture.detectChanges();

            expect(planDaySvc.createDayLogDeferred).toHaveBeenCalledWith('2026-02-07');
            expect(trainingHistorySvc.getTrainingCalendar.calls.count()).toBe(callsBefore + 1);
            expect(fixture.nativeElement.textContent).toContain('Día creado correctamente');
            expect(component.selectedDate()).toBe('2026-02-07');

            const preview = qs('[data-test="history-preview"]')!;
            expect(preview).toBeTruthy();
            expect(preview.textContent).toContain('No hay ejercicios registrados');
            expect(qs('[data-test="history-add-deferred"]')).toBeNull();
            expect(qs('[data-test="history-empty-day"]')).toBeNull();

            const edit = qs('[data-test="history-edit-day"]')!;
            expect(edit.getAttribute('href')).toBe(
                '/user/history/deferred?date=2026-02-07&id=new-1',
            );
        });

        it('uses the created id when the reloaded calendar does not include it yet', () => {
            const created = createdDayLog();
            planDaySvc.createDayLogDeferred.and.returnValue(of(created));
            planDaySvc.findById.and.returnValue(of(created));
            trainingHistorySvc.getTrainingCalendar.and.callFake((year: number, month: number) =>
                of({ year, month, days: [emptyDay] }),
            );

            qs('[data-test="history-add-deferred"]')!.click();
            fixture.detectChanges();

            expect(component.selectedDay()?.dayLogId).toBe('new-1');
            expect(qs('[data-test="history-preview"]')).toBeTruthy();
            expect(qs('[data-test="history-edit-day"]')!.getAttribute('href')).toBe(
                '/user/history/deferred?date=2026-02-07&id=new-1',
            );
        });

        it('shows an error notification and re-enables the button when creation fails', () => {
            planDaySvc.createDayLogDeferred.and.returnValue(throwError(() => new Error('nope')));
            const callsBefore = trainingHistorySvc.getTrainingCalendar.calls.count();

            qs('[data-test="history-add-deferred"]')!.click();
            fixture.detectChanges();

            expect(fixture.nativeElement.textContent).toContain('No se pudo crear el día');
            expect(trainingHistorySvc.getTrainingCalendar.calls.count()).toBe(callsBefore);

            const button = qs('[data-test="history-add-deferred"]') as HTMLButtonElement;
            expect(button).toBeTruthy();
            expect(button.disabled).toBeFalse();
            expect(button.textContent).toContain('Agregar día');
        });

        it('does not offer the creation CTA for today or future dates', () => {
            component.currentYear.set(2999);
            component.currentMonth.set(11);
            component.calendarDays.set([
                {
                    date: '2999-12-31',
                    type: CalendarDayType.DAY_LOG,
                    status: TrainingStatus.NONE,
                },
            ]);
            fixture.detectChanges();

            qs('[data-date="2999-12-31"]')!.click();
            fixture.detectChanges();

            expect(component.selectedDate()).toBe('2999-12-31');
            expect(qs('[data-test="history-empty-day"]')).toBeNull();
            expect(qs('[data-test="history-add-deferred"]')).toBeNull();
        });
    });

    it('deselects when clicking the selected empty day again', () => {
        component.calendarDays.set([
            { date: '2026-02-07', type: CalendarDayType.DAY_LOG, status: TrainingStatus.NONE },
        ]);
        fixture.detectChanges();

        qs('[data-date="2026-02-07"]')!.click();
        fixture.detectChanges();
        expect(component.selectedDate()).toBe('2026-02-07');

        qs('[data-date="2026-02-07"]')!.click();
        fixture.detectChanges();

        expect(component.selectedDate()).toBeNull();
        expect(qs('[data-test="history-add-deferred"]')).toBeNull();
    });

    it('does not offer a deferred day for a day-log that already exists', () => {
        component.calendarDays.set([dayLogDay]);
        planDaySvc.findById.and.returnValue(of(dayLog()));
        fixture.detectChanges();

        qs('[data-date="2026-02-03"]')!.click();
        fixture.detectChanges();

        expect(component.selectedDate()).toBe('2026-02-03');
        expect(qs('[data-test="history-add-deferred"]')).toBeNull();
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
