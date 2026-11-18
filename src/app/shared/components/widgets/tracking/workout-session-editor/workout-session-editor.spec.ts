import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Apollo } from 'apollo-angular';
import { WorkoutSessionEditor } from './workout-session-editor';
import { EditorContextService } from '../../../../../core/services/editor-context/editor-context.service';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';
import { apolloMock } from '../../../../../core/testing/apollo.mock';
import { workoutStoreMock } from '../../../../../core/testing/workout-store.mock';
import { WorkoutSessionVM } from '../../../../interfaces/tracking.interface';
import { EditorContext } from '../../../../../core/services/editor-context/editor-context.interface';
import { ExtraSession } from '../../../../interfaces/extra-session.interface';

describe('WorkoutSessionEditor (pure coordinator)', () => {
    let component: WorkoutSessionEditor;
    let ctxSvc: jasmine.SpyObj<EditorContextService>;

    const sampleWorkout: WorkoutSessionVM = {
        id: 'ws-1',
        date: '2026-10-15',
        exercises: [],
        status: 'not_started',
    };

    const deferredCtx: EditorContext = {
        containerType: 'DEFERRED_DAY_LOG',
        containerId: 'day-1',
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

    beforeEach(async () => {
        ctxSvc = jasmine.createSpyObj('EditorContextService', ['setContext']);

        await TestBed.configureTestingModule({
            providers: [
                provideNoopAnimations(),
                { provide: Apollo, useValue: apolloMock },
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
                { provide: EditorContextService, useValue: ctxSvc },
            ],
        }).compileComponents();

        const fixture = TestBed.createComponent(WorkoutSessionEditor);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('editorContext', deferredCtx);
        fixture.componentRef.setInput('workoutSession', sampleWorkout);
        fixture.componentRef.setInput('exercises', []);
        fixture.componentRef.setInput('selectedDate', '2026-10-15');
        fixture.componentRef.setInput('extraSessions', [sampleExtra]);
        fixture.detectChanges();
    });

    it('should create the editor component', () => {
        expect(component).toBeTruthy();
    });

    it('should emit save output on onWorkoutSave without calling services directly', () => {
        spyOn(component.save, 'emit');
        component.onWorkoutSave(sampleWorkout);

        expect(component.save.emit).toHaveBeenCalledWith(sampleWorkout);
    });

    it('should emit extraSessionSave on onExtraSessionSave', () => {
        spyOn(component.extraSessionSave, 'emit');
        component.onExtraSessionSave({
            category: 'CARDIO',
            discipline: 'swimming',
            workoutSessionId: 'ws-1',
            date: new Date('2026-10-15T00:00:00Z'),
            duration: 45,
            intensityLevel: 4,
            calories: 300,
            notes: 'pool laps',
        });

        expect(component.extraSessionSave.emit).toHaveBeenCalledWith(
            jasmine.objectContaining({
                discipline: 'swimming',
                duration: 45,
                intensityLevel: 4,
                calories: 300,
                notes: 'pool laps',
            }),
        );
    });

    it('should emit extraSessionUpdate on onExtraSessionUpdate', () => {
        spyOn(component.extraSessionUpdate, 'emit');
        const updatePayload = {
            id: 'es-1',
            duration: 40,
            intensityLevel: 4,
            calories: 320,
            notes: 'Updated note',
        };
        component.onExtraSessionUpdate(updatePayload);

        expect(component.extraSessionUpdate.emit).toHaveBeenCalledWith(updatePayload);
    });

    it('should emit extraSessionDelete on onExtraSessionDelete', () => {
        spyOn(component.extraSessionDelete, 'emit');
        component.onExtraSessionDelete('es-1');

        expect(component.extraSessionDelete.emit).toHaveBeenCalledWith('es-1');
    });

    it('should emit completeDay output on onCompleteDay', () => {
        spyOn(component.completeDay, 'emit');
        component.onCompleteDay();

        expect(component.completeDay.emit).toHaveBeenCalled();
    });

    it('should emit closeEditor output on closeDialog', () => {
        spyOn(component.closeEditor, 'emit');
        component.closeDialog();

        expect(component.isDialogOpen()).toBe(false);
        expect(component.closeEditor.emit).toHaveBeenCalled();
    });

    it('should toggle exercise selection locally', () => {
        const ex = {
            exerciseId: 'ex-1',
            name: 'Bench Press',
            category: 'CHEST',
            series: 3,
            sets: [],
        };
        component.onToggleExercise(ex as any);
        expect(component.selectedExercises().length).toBe(1);

        component.onToggleExercise(ex as any);
        expect(component.selectedExercises().length).toBe(0);
    });
});
