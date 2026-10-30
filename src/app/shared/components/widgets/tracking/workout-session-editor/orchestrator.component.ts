import { Component, input, output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackingWorkoutFacade } from '../tracking-workout/tracking-workout.facade';
import { ReactiveFormsModule } from '@angular/forms';
import { ExerciseSelector } from '../../exercises/exercise-selector/exercise-selector';
import { WorkoutEdition } from '../tracking-workout/workout-edition/workout-edition';
import { ExtraSessionForm } from '../../extra-session/extra-session-form/extra-session-form';
import { EditorContext } from '../../../../../core/services/editor-context/editor-context.interface';
import { EditorContextService } from '../../../../../core/services/editor-context/editor-context.service';
import { ExercisePerformanceVM, WorkoutSessionVM } from '../../../../interfaces/tracking.interface';

@Component({
    selector: 'app-orchestrator',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ExerciseSelector,
        WorkoutEdition,
        ExtraSessionForm,
    ],
    template: `
        <section class="flex flex-col gap-6">
            <!-- ExerciseSelector: receives exercises via inputs, emits selections -->
            <app-exercise-selector
                [exercises]="exercises()"
                [selectedExercises]="selectedExercises"
                (toggleExerciseChange)="onToggleExercise($event)"
                (exercisesSelectedChange)="onExercisesSelectedChange($event)"
                (categoryToggle)="onCategoryToggle()"
                (favoritesFilterToggle)="onFavoritesFilterToggle()"
            ></app-exercise-selector>

            <!-- WorkoutEdition: receives workoutSession and exercises via inputs -->
            @if (workoutSession()) {
                <app-workout-edition
                    [workoutSession]="workoutSession()!"
                    [exercises]="selectedExercises"
                    (saveWorkoutSession)="onWorkoutSave($event)"
                    (closeEdition)="onClose()"
                ></app-workout-edition>
            }

            <!-- ExtraSessionForm: receives selectedDate, emits save/cancel -->
            <app-extra-session-form
                [selectedDate]="selectedDate()"
                (saveExtraSession)="onExtraSessionSave()"
                (cancelExtraSession)="onExtraSessionCancel()"
            ></app-extra-session-form>
        </section>
    `,
    styles: ``,
})
export class OrchestratorComponent {
    editorContext = input.required<EditorContext>();

    private ctxSvc = inject(EditorContextService);
    facade = inject(TrackingWorkoutFacade);

    // Inputs - provided by parent based on context
    exercises = input<ExercisePerformanceVM[]>([]);
    workoutSession = input<WorkoutSessionVM | null>(null);
    selectedDate = input<string>('');

    // Outputs - emitted to parent
    saveOutput = output<WorkoutSessionVM>();
    closeOutput = output<void>();

    // Internal selected exercises state
    selectedExercises: ExercisePerformanceVM[] = [];

    constructor() {
        effect(() => {
            this.ctxSvc.setContext(this.editorContext());
            this.selectedExercises = [...(this.exercises() || [])];
        });
    }

    // ----- ExerciseSelector output handlers -----

    onToggleExercise(ex: ExercisePerformanceVM) {
        const exists = this.selectedExercises.some((e) => e.exerciseId === ex.exerciseId);
        if (exists) {
            this.selectedExercises = this.selectedExercises.filter(
                (e) => e.exerciseId !== ex.exerciseId,
            );
        } else {
            this.selectedExercises = [...this.selectedExercises, ex];
        }
    }

    onExercisesSelectedChange(exercises: ExercisePerformanceVM[]) {
        this.selectedExercises = exercises || [];
    }

    onCategoryToggle() {
        // Handled by exercise selector internal filter
    }

    onFavoritesFilterToggle() {
        // Handled by exercise selector internal state
    }

    // ----- ExtraSessionForm output handlers -----

    onExtraSessionSave() {
        // Extra session creation is dispatched by ExtraSessionForm
    }

    onExtraSessionCancel() {
        this.closeOutput.emit();
    }

    // ----- WorkoutEdition output handlers -----

    onWorkoutSave(workout: WorkoutSessionVM) {
        this.saveOutput.emit(workout);
    }

    onClose() {
        this.closeOutput.emit();
    }
}
