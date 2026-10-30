import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { Apollo } from 'apollo-angular';
import { WorkoutSessionEditor } from './workout-session-editor';
import { EditorContextService } from '../../../../../core/services/editor-context/editor-context.service';
import { PlanDayService } from '../../../../../core/services/day-logs/plan-day.service';
import { PlanTrackingService } from '../../../../../core/services/trackings/plan-tracking.service';
import { TrackingWorkoutFacade } from '../tracking-workout/tracking-workout.facade';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';
import { apolloMock } from '../../../../../core/testing/apollo.mock';
import { workoutStoreMock } from '../../../../../core/testing/workout-store.mock';
import { WorkoutSessionVM } from '../../../../interfaces/tracking.interface';

describe('WorkoutSessionEditor', () => {
    let component: WorkoutSessionEditor;
    let fixture: ComponentFixture<WorkoutSessionEditor>;
    let planDaySvc: jasmine.SpyObj<PlanDayService>;
    let planTrackingSvc: jasmine.SpyObj<PlanTrackingService>;
    let facade: jasmine.SpyObj<TrackingWorkoutFacade>;
    let ctxSvc: jasmine.SpyObj<EditorContextService>;

    const sampleWorkout: WorkoutSessionVM = {
        id: 'ws-1',
        date: '2026-10-15',
        exercises: [],
        status: 'not_started',
    };

    beforeEach(async () => {
        planDaySvc = jasmine.createSpyObj('PlanDayService', ['findById', 'updateWorkoutSession']);
        planDaySvc.findById.and.returnValue(of(null));

        planTrackingSvc = jasmine.createSpyObj('PlanTrackingService', ['findById']);
        planTrackingSvc.findById.and.returnValue(of(null));

        facade = jasmine.createSpyObj('TrackingWorkoutFacade', [
            'updateWorkoutSession',
            'workoutVM',
        ]);
        ctxSvc = jasmine.createSpyObj('EditorContextService', [
            'setContext',
            'completeDeferredDayLog',
        ]);

        await TestBed.configureTestingModule({
            imports: [WorkoutSessionEditor],
            providers: [
                provideNoopAnimations(),
                { provide: Apollo, useValue: apolloMock },
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
                { provide: PlanDayService, useValue: planDaySvc },
                { provide: PlanTrackingService, useValue: planTrackingSvc },
                { provide: TrackingWorkoutFacade, useValue: facade },
                { provide: EditorContextService, useValue: ctxSvc },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutSessionEditor);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('editorContext', {
            containerType: 'DEFERRED_DAY_LOG',
            containerId: 'day-1',
        });
        fixture.detectChanges();
    });

    it('should create the editor component', () => {
        expect(component).toBeTruthy();
    });

    it('should render header for DEFERRED_DAY_LOG context', () => {
        const title = fixture.nativeElement.querySelector('h2');
        expect(title.textContent).toContain('Editor de Sesión de Día-Log Diferido');
    });

    it('should render header for WEEK_LOG_DAY context', () => {
        fixture.componentRef.setInput('editorContext', {
            containerType: 'WEEK_LOG_DAY',
            weekLogId: 'week-1',
            dayOrder: 1,
        });
        fixture.detectChanges();

        const title = fixture.nativeElement.querySelector('h2');
        expect(title.textContent).toContain('Editor de Día dentro de Semana');
    });

    it('should call planDaySvc.updateWorkoutSession onSave for DEFERRED_DAY_LOG', () => {
        spyOn(component.save, 'emit');
        component.onSave(sampleWorkout);

        expect(planDaySvc.updateWorkoutSession).toHaveBeenCalledWith(sampleWorkout);
        expect(component.save.emit).toHaveBeenCalled();
    });

    it('should call facade.updateWorkoutSession onSave for WEEK_LOG_DAY', () => {
        fixture.componentRef.setInput('editorContext', {
            containerType: 'WEEK_LOG_DAY',
            weekLogId: 'week-1',
            dayOrder: 1,
        });
        fixture.detectChanges();

        spyOn(component.save, 'emit');
        component.onSave(sampleWorkout);

        expect(facade.updateWorkoutSession).toHaveBeenCalledWith(sampleWorkout);
        expect(component.save.emit).toHaveBeenCalled();
    });

    it('should call ctxSvc.completeDeferredDayLog onCompleteDay for DEFERRED_DAY_LOG', () => {
        spyOn(component.completeDay, 'emit');
        component.onCompleteDay();

        expect(ctxSvc.completeDeferredDayLog).toHaveBeenCalled();
        expect(component.completeDay.emit).toHaveBeenCalled();
    });

    it('should emit close output on closeDialog', () => {
        spyOn(component.closeEditor, 'emit');
        component.closeDialog();

        expect(component.isDialogOpen()).toBe(false);
        expect(component.closeEditor.emit).toHaveBeenCalled();
    });
});
