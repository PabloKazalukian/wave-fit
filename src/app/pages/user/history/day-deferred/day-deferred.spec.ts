import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { DayDeferred } from './day-deferred';
import { EditorContextService } from '../../../../core/services/editor-context/editor-context.service';
import { EditorContext } from '../../../../core/services/editor-context/editor-context.interface';
import { WORKOUT_STORE } from '../../../../core/services/workouts/workout-store.interface';
import { WorkoutSessionVM } from '../../../../shared/interfaces/tracking.interface';
import { WorkoutSessionEditor } from '../../../../shared/components/widgets/tracking/workout-session-editor/workout-session-editor';

@Component({
    selector: 'app-workout-session-editor',
    standalone: true,
    template: '<div data-test="workout-session-editor-mock"></div>',
})
class MockWorkoutSessionEditor {
    editorContext = input<EditorContext>();
    save = output<WorkoutSessionVM>();
    closeEditor = output<void>();
    completeDay = output<void>();
}

describe('DayDeferred', () => {
    let fixture: ComponentFixture<DayDeferred>;
    let component: DayDeferred;
    let ctxSvc: jasmine.SpyObj<EditorContextService>;

    const workoutStoreMock = {
        workoutSession: signal<WorkoutSessionVM | null>(null),
        selectedDate: signal<string | null>(null),
        exercises: signal<any[]>([]),
    };

    const setup = async (
        queryParams: Record<string, string> = {},
        routeParams: Record<string, string> = {},
    ) => {
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
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
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
            'completeDeferredDayLog',
        ]);
    });

    it('initializes DEFERRED_DAY_LOG context when id and date are provided in query params', async () => {
        await setup({ date: '2026-10-15', id: 'day-1' });

        expect(component.containerType()).toBe('DEFERRED_DAY_LOG');
        expect(component.containerId()).toBe('day-1');
        expect(ctxSvc.setContext).toHaveBeenCalledWith({
            containerType: 'DEFERRED_DAY_LOG',
            containerId: 'day-1',
            dayOrder: undefined,
            weekLogId: undefined,
        });

        const headerTitle = fixture.nativeElement.querySelector('header h1');
        expect(headerTitle.textContent).toContain('Día diferido');
    });

    it('initializes WEEK_LOG_DAY context when weekLogId and dayOrder are in route params', async () => {
        await setup({}, { weekLogId: 'week-99', dayOrder: '2' });

        expect(component.containerType()).toBe('WEEK_LOG_DAY');
        expect(component.weekLogId()).toBe('week-99');
        expect(component.dayOrder()).toBe(2);
        expect(ctxSvc.setContext).toHaveBeenCalledWith({
            containerType: 'WEEK_LOG_DAY',
            containerId: undefined,
            dayOrder: 2,
            weekLogId: 'week-99',
        });

        const headerTitle = fixture.nativeElement.querySelector('header h1');
        expect(headerTitle.textContent).toContain('Día de semana');
    });

    it('initializes empty DEFERRED_DAY_LOG context when only date is provided', async () => {
        await setup({ date: '2026-10-20' });

        expect(component.containerType()).toBe('DEFERRED_DAY_LOG');
        expect(component.containerId()).toBeNull();
        expect(ctxSvc.setContext).toHaveBeenCalledWith({
            containerType: 'DEFERRED_DAY_LOG',
            containerId: undefined,
            dayOrder: undefined,
            weekLogId: undefined,
        });

        const headerTitle = fixture.nativeElement.querySelector('header h1');
        expect(headerTitle.textContent).toContain('Día diferido');
    });

    it('delegates onCompleteDay to EditorContextService.completeDeferredDayLog', async () => {
        await setup({ date: '2026-10-15', id: 'day-1' });

        component.onCompleteDay();

        expect(ctxSvc.completeDeferredDayLog).toHaveBeenCalledTimes(1);
    });

    it('computes editorContext correctly matching container signals', async () => {
        await setup({ date: '2026-10-15', id: 'day-1' });

        expect(component.editorContext()).toEqual({
            containerType: 'DEFERRED_DAY_LOG',
            containerId: 'day-1',
            dayOrder: undefined,
            weekLogId: undefined,
        });
    });

    it('handles onSave and closeDialog without throwing errors', async () => {
        await setup({ date: '2026-10-15', id: 'day-1' });

        expect(() => component.onSave()).not.toThrow();
        expect(() => component.closeDialog()).not.toThrow();
    });
});
