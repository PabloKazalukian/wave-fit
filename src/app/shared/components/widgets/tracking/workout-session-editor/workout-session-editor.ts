import { Component, input, output, signal, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { EditorContext } from '../../../../../core/services/editor-context/editor-context.interface';
import { EditorContextService } from '../../../../../core/services/editor-context/editor-context.service';
import { ExercisePerformanceVM, WorkoutSessionVM } from '../../../../interfaces/tracking.interface';
import {
    CreateExtraSessionForm,
    ExtraSession,
    ExtraSessionDisciplineConfig,
} from '../../../../interfaces/extra-session.interface';
import { BtnComponent } from '../../../ui/btn/btn';
import { Loading } from '../../../ui/loading/loading';
import { DialogComponent } from '../../../ui/dialog/dialog';
import { IconComponent } from '../../../ui/icon/icon';
import { ExerciseSelector } from '../../exercises/exercise-selector/exercise-selector';
import { WorkoutEdition } from '../tracking-workout/workout-edition/workout-edition';
import { ExtraSessionForm } from '../../extra-session/extra-session-form/extra-session-form';
import { ExtraSessionCard } from '../../extra-session/extra-session-content/extra-session-card/extra-session-card';

// Raw form value emitted by ExtraSessionForm (not FormControls)
interface ExtraSessionFormValue {
    category: string;
    discipline: string;
    workoutSessionId: string;
    date: Date;
    duration: number;
    intensityLevel: number;
    calories: number;
    notes: string;
}

@Component({
    selector: 'app-workout-session-editor',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        Loading,
        BtnComponent,
        DialogComponent,
        IconComponent,
        ExerciseSelector,
        WorkoutEdition,
        ExtraSessionForm,
        ExtraSessionCard,
    ],
    templateUrl: './workout-session-editor.html',
    styles: ``,
})
export class WorkoutSessionEditor implements OnChanges {
    // --- Inputs (all data provided by parent DayDeferred) ---
    editorContext = input.required<EditorContext>();
    workoutSession = input<WorkoutSessionVM | null>(null);
    exercises = input<ExercisePerformanceVM[]>([]);
    selectedDate = input<string>('');
    extraSessions = input<ExtraSession[]>([]);
    disciplines = input<ExtraSessionDisciplineConfig[]>([]);

    // --- Outputs (emitted to parent DayDeferred for mutation routing) ---
    save = output<WorkoutSessionVM>();
    extraSessionSave = output<CreateExtraSessionForm>();
    extraSessionUpdate = output<{
        id: string;
        duration: number;
        intensityLevel: number;
        calories?: number;
        notes?: string;
    }>();
    extraSessionDelete = output<string>();
    closeEditor = output<void>();
    completeDay = output<void>();

    private ctxSvc = inject(EditorContextService);

    // --- Local UI state only (no service writes here) ---
    loading = signal(false);
    isDialogOpen = signal(false);
    isExerciseSelectorOpen = signal(false);
    isExtraSessionOpen = signal(false);

    selectedExercises = signal<ExercisePerformanceVM[]>([]);

    // Exercises exposed to ExerciseSelector (empty = selector loads all from service)
    allExercises = signal<ExercisePerformanceVM[]>([]);

    ngOnChanges(changes: SimpleChanges): void {
        // Keep ctxSvc in sync (called once per distinct context, not in a loop)
        if (changes['editorContext']) {
            this.ctxSvc.setContext(this.editorContext());
        }

        // Initialize selectedExercises from exercises input when it changes
        if (changes['exercises']) {
            this.selectedExercises.set([...(this.exercises() ?? [])]);
        }
    }

    // ----- Dialog handlers -----

    openExerciseSelector(): void {
        this.isExerciseSelectorOpen.set(true);
    }

    closeExerciseSelector(): void {
        this.isExerciseSelectorOpen.set(false);
    }

    openExtraSession(): void {
        this.isExtraSessionOpen.set(true);
    }

    closeExtraSession(): void {
        this.isExtraSessionOpen.set(false);
    }

    openDialog(): void {
        this.isDialogOpen.set(true);
    }

    closeDialog(): void {
        this.isDialogOpen.set(false);
        this.closeEditor.emit();
    }

    // ----- ExerciseSelector output handlers -----

    onToggleExercise(ex: ExercisePerformanceVM): void {
        this.selectedExercises.update((current) => {
            const exists = current.some((e) => e.exerciseId === ex.exerciseId);
            return exists
                ? current.filter((e) => e.exerciseId !== ex.exerciseId)
                : [...current, ex];
        });
    }

    onExercisesSelectedChange(exercises: ExercisePerformanceVM[]): void {
        this.selectedExercises.set(exercises ?? []);
    }

    // ----- WorkoutEdition output handler -----
    // Emits save output upward; parent DayDeferred routes to correct mutation.

    onWorkoutSave(workout: WorkoutSessionVM): void {
        this.save.emit(workout);
    }

    // ----- ExtraSessionForm output handler -----
    // Converts the raw form value and emits extraSessionSave upward.
    // Parent DayDeferred routes to correct service (deferred-safe).

    onExtraSessionSave(event: unknown): void {
        const formValue = event as ExtraSessionFormValue;

        const extraSession: CreateExtraSessionForm = {
            date:
                formValue.date instanceof Date
                    ? formValue.date.toISOString().split('T')[0]
                    : (formValue.date as string),
            discipline: formValue.discipline,
            duration: formValue.duration,
            intensityLevel: formValue.intensityLevel,
            calories: formValue.calories,
            notes: formValue.notes,
        };

        this.extraSessionSave.emit(extraSession);
        this.closeExtraSession();
    }

    onExtraSessionUpdate(data: {
        id: string;
        duration: number;
        intensityLevel: number;
        calories?: number;
        notes?: string;
    }): void {
        this.extraSessionUpdate.emit(data);
    }

    onExtraSessionDelete(id: string): void {
        this.extraSessionDelete.emit(id);
    }

    // ----- Complete Day -----

    onCompleteDay(): void {
        this.completeDay.emit();
    }
}
