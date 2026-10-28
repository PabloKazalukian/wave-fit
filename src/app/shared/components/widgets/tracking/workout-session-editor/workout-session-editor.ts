import { Component, input, signal, effect, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackingWorkoutFacade } from '../tracking-workout/tracking-workout.facade';
import { ReactiveFormsModule } from '@angular/forms';
import { BtnComponent } from '../../../ui/btn/btn';
import { ExerciseSelector } from '../../exercises/exercise-selector/exercise-selector';
import { StatusWorkoutSession } from '../../../../interfaces/tracking.interface';

import { EditorContext } from '../../../../../core/services/editor-context/editor-context.interface';
import { EditorContextService } from '../../../../../core/services/editor-context/editor-context.service';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';
import { WorkoutEdition } from '../tracking-workout/workout-edition/workout-edition';
import { Loading } from '../../../ui/loading/loading';

@Component({
    selector: 'app-workout-session-editor',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BtnComponent,
        ExerciseSelector,
        WorkoutEdition,
        Loading,
    ],
    templateUrl: './workout-session-editor.html',
    styles: ``,
})
export class WorkoutSessionEditor {
    editorContext = input.required<EditorContext>();

    private ctxSvc = inject(EditorContextService);
    facade = inject(TrackingWorkoutFacade);
    store = inject(WORKOUT_STORE);
    loading = signal(false);
    destroyRef = inject(DestroyRef);

    workoutSession = this.store.workoutSession;
    selectedDate = this.store.selectedDate;
    exercisesSelected = this.store.exercises;

    isDialogOpen = signal(false);

    constructor() {
        effect(() => {
            const ctx = this.editorContext();
            this.ctxSvc.setContext(ctx);
            this.ctxSvc.loadWorkoutSession().subscribe({
                next: (session) => {
                    if (session && session.length > 0) {
                        this.loading.set(true);
                        this.store.updateExercises(session);
                        this.loading.set(false);
                    }
                },
                error: (err) => {
                    console.error('Error loading workout session:', err);
                    this.loading.set(false);
                },
            });
        });
    }

    openDialog(): void {
        this.isDialogOpen.set(true);
    }

    closeDialog(): void {
        this.isDialogOpen.set(false);
    }

    onSave(): void {
        const currentWorkout = this.facade.workoutVM();
        if (!currentWorkout) return;
        const updatedExercises = this.exercisesSelected()
            ? this.exercisesSelected().map((ex) => ({
                  ...ex,
                  series: ex.sets.length,
                  sets: ex.sets.map((s) => ({ reps: s.reps, weights: s.weights })),
              }))
            : [];
        const updatedWorkout: import('./../../../../interfaces/tracking.interface').WorkoutSessionVM = {
            ...currentWorkout,
            exercises: updatedExercises,
            status: 'complete' as StatusWorkoutSession,
        };
        this.facade.updateWorkoutSession(updatedWorkout);
        this.closeDialog();
    }

    onCompleteDay(): void {
        const ctx = this.editorContext();
        if (ctx.containerType === 'DEFERRED_DAY_LOG') {
            this.ctxSvc.completeDeferredDayLog();
        } else if (ctx.containerType === 'WEEK_LOG_DAY') {
            console.log('Completing week-log day - pending backend dependency (AC-014)');
            // TODO: Cuando backend esté disponible, invocar operación de completion de week-log day
            // Que complete solo el día sin afectar parent week-log ni otros días (BR-009, BR-017)
        }
    }
}