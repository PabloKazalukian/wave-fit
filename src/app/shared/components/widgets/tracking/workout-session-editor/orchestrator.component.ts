import { Component, input, output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackingWorkoutFacade } from '../tracking-workout/tracking-workout.facade';
import { ReactiveFormsModule } from '@angular/forms';
import { BtnComponent } from '../../../ui/btn/btn';
import { ExerciseSelector } from '../../exercises/exercise-selector/exercise-selector';
import { WorkoutEdition } from '../tracking-workout/workout-edition/workout-edition';
import { Loading } from '../../../ui/loading/loading';
import { ExtraSessionForm } from '../../extra-session/extra-session-form/extra-session-form';
import { EditorContext } from '../../../../../core/services/editor-context/editor-context.interface';
import { EditorContextService } from '../../../../../core/services/editor-context/editor-context.service';

@Component({
    selector: 'app-orchestrator',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BtnComponent,
        ExerciseSelector,
        WorkoutEdition,
        Loading,
        ExtraSessionForm,
    ],
    template: `
        <!-- ExerciseSelector: receives exercises via inputs, emits selections -->
        <app-exercise-selector
            [exercises]="exercises"
            [selectedExercises]="selectedExercises"
        ></app-exercise-selector>

        <!-- ExtraSessionForm: receives selectedDate, emits save/cancel -->
        <app-extra-session-form
            [selectedDate]="selectedDate"
        ></app-extra-session-form>

        <!-- WorkoutEdition: receives workoutSession and exercises via inputs -->
        <app-workout-edition
            [workoutSession]="workoutSession"
            [exercises]="exercises"
        ></app-workout-edition>
    `,
    styles: ``,
})
export class OrchestratorComponent {
    editorContext = input.required<EditorContext>();

    private ctxSvc = inject(EditorContextService);
    facade = inject(TrackingWorkoutFacade);

    // Inputs - provided by parent based on context
    exercises = input<any[]>([]);
    workoutSession = input<any>({});
    selectedDate = input<string>('');

    // Outputs - emitted to parent
    saveOutput = output<void>();
    closeOutput = output<void>();

    // Internal selected exercises state
    selectedExercises: any[] = [];

    constructor() {
        effect(() => {
            this.ctxSvc.setContext(this.editorContext());
            // Load session data based on context - simplified
            // The parent (WorkoutSessionEditor) handles the actual data loading
            // based on containerType in onSave/onCompleteDay
            this.selectedExercises = this.exercises() || [];
        });
    }

    // ----- ExerciseSelector output handlers -----

    onToggleExercise(ex: any) {
        const exists = this.selectedExercises?.some((e) => e.exerciseId === ex.exerciseId);
        if (exists) {
            this.selectedExercises = this.selectedExercises?.filter((e) => e.exerciseId !== ex.exerciseId) || [];
        } else {
            this.selectedExercises = [...(this.selectedExercises || []), ex];
        }
    }

    onExercisesSelectedChange(exercises: any[]) {
        this.selectedExercises = exercises || [];
    }

    onCategoryToggle(category: string) {
        if (this.selectedExercises?.some((e) => e.category === category)) {
            this.selectedExercises = this.selectedExercises?.filter((e) => e.category !== category) || [];
        }
    }

    onFavoritesFilterToggle() {
        // Managed by component internal state
    }

    // ----- ExtraSessionForm output handlers -----

    onExtraSessionSave() {
        this.saveOutput.emit();
    }

    onExtraSessionCancel() {
        this.closeOutput.emit();
    }

    onCategoryClear() {
        // Clear category filter
    }

    onDisciplineClear() {
        // Clear discipline selection
    }

    // ----- WorkoutEdition output handlers -----

    onWorkoutSave() {
        // Delegate to parent WorkoutSessionEditor for API calls
        this.saveOutput.emit();
    }

    onClose() {
        this.closeOutput.emit();
    }
}