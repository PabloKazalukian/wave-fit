import { Component, input, output, effect } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DayDeferred } from './day-deferred';
import { EditorContextService } from '../../../../core/services/editor-context/editor-context.service';
import { EditorContext } from '../../../../core/services/editor-context/editor-context.interface';
import { PlanDayService } from '../../../../core/services/day-logs/plan-day.service';
import { PlanTrackingService } from '../../../../core/services/trackings/plan-tracking.service';
import { ExtraSessionService } from '../../../../core/services/extra-session/extra-session.service';
import { ExtraSessionApi } from '../../../../core/services/extra-session/api/extra-session.api';
import { WorkoutApi } from '../../../../core/services/workouts/api/workout.api';
import { WorkoutSessionVM } from '../../../../shared/interfaces/tracking.interface';
import { ExtraSession } from '../../../../shared/interfaces/extra-session.interface';
import { WorkoutSessionEditor } from '../../../../shared/components/widgets/tracking/workout-session-editor/workout-session-editor';

@Component({
    selector: 'app-workout-session-editor',
    standalone: true,
    template: '<div data-test="workout-session-editor-mock"></div>',
})
class MockWorkoutSessionEditor {
    editorContext = input<EditorContext>();
    workoutSession = input<WorkoutSessionVM | null>(null);
    exercises = input<any[]>([]);
    selectedDate = input<string>('');
    extraSessions = input<ExtraSession[]>([]);
    disciplines = input<any[]>([]);

    save = output<WorkoutSessionVM>();
    extraSessionSave = output<any>();
    extraSessionUpdate = output<any>();
    extraSessionDelete = output<string>();
    closeEditor = output<void>();
    completeDay = output<void>();

    static lastReceivedContext: EditorContext | undefined = undefined;

    constructor() {
        effect(() => {
            MockWorkoutSessionEditor.lastReceivedContext = this.editorContext();
        });
    }
}

describe('DayDeferred', () => {
    let fixture: ComponentFixture<DayDeferred>;
    let component: DayDeferred;
    let ctxSvc: jasmine.SpyObj<EditorContextService>;
    let planDaySvc: jasmine.SpyObj<PlanDayService>;
    let planTrackingSvc: jasmine.SpyObj<PlanTrackingService>;
    let extraSessionSvc: jasmine.SpyObj<ExtraSessionService>;
    let extraSessionApi: jasmine.SpyObj<ExtraSessionApi>;
    let workoutApi: jasmine.SpyObj<WorkoutApi>;

    const sampleDayLog: any = {
        id: 'day-1',
        date: '2026-10-15',
        workoutSessionId: 'ws-1',
        exercises: [],
        extraSessionIds: ['es-1'],
        status: 'complete',
        notes: 'Good session',
    };

    const sampleExtra: ExtraSession = {
        id: 'es-1',
        userId: 'u-1',
        category: 'CARDIO' as any,
        discipline: 'running',
        date: '2026-10-15',
        duration: 30,
        intensityLevel: 3,
    };

    const setup = async (
        queryParams: Record<string, string> = {},
        routeParams: Record<string, string> = {},
    ) => {
        MockWorkoutSessionEditor.lastReceivedContext = undefined;

        await TestBed.configureTestingModule({
            imports: [DayDeferred],
            providers: [
                provideRouter([]),
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            queryParamMap: convertToParamMap(queryParams),
                            paramMap: convertToParamMap(routeParams),
                        },
                    },
                },
                { provide: EditorContextService, useValue: ctxSvc },
                { provide: PlanDayService, useValue: planDaySvc },
                { provide: PlanTrackingService, useValue: planTrackingSvc },
                { provide: ExtraSessionService, useValue: extraSessionSvc },
                { provide: ExtraSessionApi, useValue: extraSessionApi },
                { provide: WorkoutApi, useValue: workoutApi },
            ],
        })
            .overrideComponent(DayDeferred, {
                remove: { imports: [WorkoutSessionEditor] },
                add: { imports: [MockWorkoutSessionEditor] },
            })
            .compileComponents();

        fixture = TestBed.createComponent(DayDeferred);
        component = fixture.componentInstance;
        fixture.detectChanges();
    };

    beforeEach(() => {
        ctxSvc = jasmine.createSpyObj('EditorContextService', [
            'setContext',
            'clearContext',
            'completeDeferredDayLog',
        ]);
        planDaySvc = jasmine.createSpyObj('PlanDayService', [
            'findById',
            'updateWorkoutSession',
            'updateWorkoutSessionDeferred',
            'updateExtraSessionDeferred',
            'removeExtraSessionDeferred',
        ]);
        planDaySvc.findById.and.returnValue(of(sampleDayLog));
        planDaySvc.updateWorkoutSessionDeferred.and.returnValue(of(sampleDayLog));
        planDaySvc.updateExtraSessionDeferred.and.returnValue(of(sampleDayLog));
        planDaySvc.removeExtraSessionDeferred.and.returnValue(of(sampleDayLog));

        planTrackingSvc = jasmine.createSpyObj('PlanTrackingService', [
            'findById',
            'updateExtraSessionDeferred',
            'removeExtraSessionDeferred',
        ]);
        planTrackingSvc.findById.and.returnValue(of(null));
        planTrackingSvc.updateExtraSessionDeferred.and.returnValue(of(null));
        planTrackingSvc.removeExtraSessionDeferred.and.returnValue(of(null));

        extraSessionSvc = jasmine.createSpyObj('ExtraSessionService', ['loadCatalog'], {
            catalog$: of([]),
        });

        extraSessionApi = jasmine.createSpyObj('ExtraSessionApi', ['getByIds', 'update']);
        extraSessionApi.getByIds.and.returnValue(of([sampleExtra]));
        extraSessionApi.update.and.returnValue(of(sampleExtra));

        workoutApi = jasmine.createSpyObj('WorkoutApi', ['updateWorkoutSession']);
        workoutApi.updateWorkoutSession.and.returnValue(of(null));
    });

    it('initializes DEFERRED_DAY_LOG context, loads day-log and extra sessions', async () => {
        await setup({ date: '2026-10-15', id: 'day-1' });

        expect(component.containerType()).toBe('DEFERRED_DAY_LOG');
        expect(component.containerId()).toBe('day-1');
        expect(planDaySvc.findById).toHaveBeenCalledWith('day-1');
        expect(extraSessionApi.getByIds).toHaveBeenCalledWith(['es-1']);
        expect(component.extraSessions().length).toBe(1);

        expect(component.editorContext()).toEqual({
            containerType: 'DEFERRED_DAY_LOG',
            containerId: 'day-1',
            dayOrder: undefined,
            weekLogId: undefined,
        });

        const headerTitle = fixture.nativeElement.querySelector('header h1');
        expect(headerTitle.textContent).toContain('Día diferido');
    });

    it('initializes WEEK_LOG_DAY context when weekLogId and dayOrder are in route params', async () => {
        const mockTracking: any = {
            id: 'week-99',
            workouts: [
                null,
                null,
                {
                    id: 'ws-2',
                    date: '2026-10-16',
                    exercises: [],
                    extras: ['es-99'],
                    status: 'complete',
                },
            ],
        };
        planTrackingSvc.findById.and.returnValue(of(mockTracking));

        await setup({}, { weekLogId: 'week-99', dayOrder: '2' });

        expect(component.containerType()).toBe('WEEK_LOG_DAY');
        expect(component.weekLogId()).toBe('week-99');
        expect(component.dayOrder()).toBe(2);
        expect(planTrackingSvc.findById).toHaveBeenCalledWith('week-99');
        expect(extraSessionApi.getByIds).toHaveBeenCalledWith(['es-99']);

        const headerTitle = fixture.nativeElement.querySelector('header h1');
        expect(headerTitle.textContent).toContain('Día de semana');
    });

    it('calls ctxSvc.clearContext on ngOnDestroy (D7)', async () => {
        await setup({ date: '2026-10-15', id: 'day-1' });

        component.ngOnDestroy();

        expect(ctxSvc.clearContext).toHaveBeenCalledTimes(1);
    });

    it('routes onSave to PlanDayService.updateWorkoutSessionDeferred for DEFERRED_DAY_LOG', async () => {
        await setup({ date: '2026-10-15', id: 'day-1' });

        const workout: WorkoutSessionVM = {
            id: 'ws-1',
            date: '2026-10-15',
            exercises: [],
            status: 'complete',
        };
        component.onSave(workout);

        expect(planDaySvc.updateWorkoutSessionDeferred).toHaveBeenCalledWith('day-1', workout);
        expect(planDaySvc.updateWorkoutSession).not.toHaveBeenCalled();
    });

    it('routes onSave to WorkoutApi.updateWorkoutSession for WEEK_LOG_DAY', async () => {
        await setup({ date: '2026-10-15' }, { weekLogId: 'week-99', dayOrder: '2' });

        const workout: WorkoutSessionVM = {
            id: 'ws-2',
            date: '2026-10-15',
            exercises: [],
            status: 'complete',
        };
        component.onSave(workout);

        expect(workoutApi.updateWorkoutSession).toHaveBeenCalledOnceWith(workout, 'week-99');
        expect(planDaySvc.updateWorkoutSession).not.toHaveBeenCalled();
        expect(planDaySvc.updateWorkoutSessionDeferred).not.toHaveBeenCalled();
    });

    it('does not send a mutation when the workout session has no id', async () => {
        await setup({ date: '2026-10-15', id: 'day-1' });

        component.onSave({
            id: '',
            date: '2026-10-15',
            exercises: [],
            status: 'complete',
        });

        expect(planDaySvc.updateWorkoutSession).not.toHaveBeenCalled();
        expect(planDaySvc.updateWorkoutSessionDeferred).not.toHaveBeenCalled();
        expect(workoutApi.updateWorkoutSession).not.toHaveBeenCalled();
        expect(component.error()).toBeTruthy();
    });

    it('routes onExtraSessionSave to updateExtraSessionDeferred for DEFERRED_DAY_LOG', async () => {
        await setup({ date: '2026-10-15', id: 'day-1' });

        const newExtra = {
            date: '2026-10-15',
            discipline: 'cycling',
            duration: 40,
            intensityLevel: 3,
        };
        component.onExtraSessionSave(newExtra as any);

        expect(planDaySvc.updateExtraSessionDeferred).toHaveBeenCalledWith(
            'day-1',
            newExtra as any,
        );
    });

    it('routes onExtraSessionUpdate to ExtraSessionApi.update', async () => {
        await setup({ date: '2026-10-15', id: 'day-1' });

        const updateData = {
            id: 'es-1',
            duration: 50,
            intensityLevel: 4,
            calories: 400,
            notes: 'Felt great',
        };
        component.onExtraSessionUpdate(updateData);

        expect(extraSessionApi.update).toHaveBeenCalledWith(updateData);
    });

    it('routes onExtraSessionDelete to removeExtraSessionDeferred for DEFERRED_DAY_LOG', async () => {
        await setup({ date: '2026-10-15', id: 'day-1' });

        component.onExtraSessionDelete('es-1');

        expect(planDaySvc.removeExtraSessionDeferred).toHaveBeenCalledWith('es-1');
        expect(component.extraSessions().length).toBe(0);
    });

    it('detects DEFERRED_DAY_LOG from the :id path param', async () => {
        await setup({}, { id: 'day-1' });

        expect(component.containerType()).toBe('DEFERRED_DAY_LOG');
        expect(component.containerId()).toBe('day-1');
        expect(planDaySvc.findById).toHaveBeenCalledWith('day-1');
    });

    it('detects WEEK_LOG_DAY from the :weekId path param alias', async () => {
        planTrackingSvc.findById.and.returnValue(
            of({
                id: 'week-99',
                workouts: [
                    null,
                    null,
                    {
                        id: 'ws-2',
                        date: '2026-10-15',
                        exercises: [],
                        extras: [],
                        status: 'complete',
                    },
                ],
            } as any),
        );

        await setup({}, { weekId: 'week-99', dayOrder: '2' });

        expect(component.containerType()).toBe('WEEK_LOG_DAY');
        expect(component.weekLogId()).toBe('week-99');
        expect(planTrackingSvc.findById).toHaveBeenCalledWith('week-99');
    });

    it('targets the loaded workout session when deleting an extra-session in a deferred day-log', async () => {
        await setup({ date: '2026-10-15', id: 'day-1' });

        component.onExtraSessionDelete('es-1');

        const removeSpy = planDaySvc.removeExtraSessionDeferred as unknown as jasmine.Spy;
        expect(removeSpy).toHaveBeenCalledWith('ws-1', 'es-1');
    });

    it('surfaces a failed day-log workout save instead of silently ignoring it', async () => {
        await setup({ date: '2026-10-15', id: 'day-1' });
        const updateSpy = planDaySvc.updateWorkoutSessionDeferred as unknown as jasmine.Spy;
        updateSpy.and.returnValue(throwError(() => new Error('network')));

        component.onSave({
            id: 'ws-1',
            date: '2026-10-15',
            exercises: [],
            status: 'complete',
        });

        expect(component.error()).toBeTruthy();
    });
});
