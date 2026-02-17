import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ExercisePerformanceVM } from '../../../../../interfaces/tracking.interface';
import { WorkoutStateService } from '../../../../../../core/services/workouts/workout-state.service';

interface SetData {
    reps: number;
    weights: number;
}

@Injectable()
export class WorkoutInProgressFacade {
    private workoutState = inject(WorkoutStateService);

    // Signals para manejo interno del acordeón y sets
    private openAccordionIndex = signal<string[]>([]);
    private exerciseSetsData = signal<Map<string, SetData[]>>(new Map());

    // Computed desde el service - única fuente de verdad
    exercises = computed(() => this.workoutState.exercises());

    constructor() {
        // Sincronizar sets data cuando cambien los exercises del service
        effect(() => {
            const exercises = this.exercises();
            if (exercises && exercises.length > 0) {
                this.initializeSetsData(exercises);
            }
        });
    }

    // ===== Accordion Management =====
    isOpen(exerciseId: string): boolean {
        return this.openAccordionIndex().includes(exerciseId);
    }

    toggleAccordion(exerciseId: string): void {
        const current = this.openAccordionIndex();
        const isOpen = current.includes(exerciseId);

        this.openAccordionIndex.set(
            isOpen ? current.filter((id) => id !== exerciseId) : [...current, exerciseId],
        );
    }

    // ===== Sets Data Management =====
    getSets(exerciseId: string): SetData[] {
        return this.exerciseSetsData().get(exerciseId) || [];
    }

    private initializeSetsData(exercises: ExercisePerformanceVM[]): void {
        const newMap = new Map<string, SetData[]>();

        exercises.forEach((ex) => {
            const sets = (ex.sets || []).map((set) => ({
                reps: set.reps,
                weights: set.weights ?? 0,
            }));

            newMap.set(ex.exerciseId, sets);
        });

        this.exerciseSetsData.set(newMap);
    }

    // ===== Reps Operations =====
    incrementReps(exerciseId: string, setIndex: number): void {
        this.updateSetData(exerciseId, setIndex, 'reps', 1);
    }

    decrementReps(exerciseId: string, setIndex: number): void {
        this.updateSetData(exerciseId, setIndex, 'reps', -1);
    }

    updateReps(exerciseId: string, setIndex: number, value: number): void {
        this.updateSetData(exerciseId, setIndex, 'reps', value, true);
    }

    // ===== Weight Operations =====
    incrementWeight(exerciseId: string, setIndex: number): void {
        this.updateSetData(exerciseId, setIndex, 'weights', 2.5);
    }

    decrementWeight(exerciseId: string, setIndex: number): void {
        this.updateSetData(exerciseId, setIndex, 'weights', -2.5);
    }

    updateWeight(exerciseId: string, setIndex: number, value: number): void {
        this.updateSetData(exerciseId, setIndex, 'weights', value, true);
    }

    // ===== Set Management =====
    addSet(exerciseId: string): void {
        const currentMap = new Map(this.exerciseSetsData());
        const sets = currentMap.get(exerciseId) || [];

        sets.push({ reps: 10, weights: 0 });
        currentMap.set(exerciseId, [...sets]);
        this.exerciseSetsData.set(currentMap);

        this.persistExerciseChanges(exerciseId, sets);
    }

    removeSet(exerciseId: string): void {
        const currentMap = new Map(this.exerciseSetsData());
        const sets = currentMap.get(exerciseId) || [];

        if (sets.length > 0) {
            sets.pop();
            currentMap.set(exerciseId, [...sets]);
            this.exerciseSetsData.set(currentMap);
        }

        this.persistExerciseChanges(exerciseId, sets);
    }

    removeExercise(exerciseId: string): void {
        // Obtener ejercicio actual
        const exercise = this.exercises().find((ex) => ex.exerciseId === exerciseId);
        if (!exercise) return;

        // Crear nuevo array sin el ejercicio
        const updatedExercises = this.exercises().filter((ex) => ex.exerciseId !== exerciseId);

        // Actualizar en el service
        this.workoutState.updateExercises(updatedExercises);

        // Limpiar datos locales
        const currentMap = new Map(this.exerciseSetsData());
        currentMap.delete(exerciseId);
        this.exerciseSetsData.set(currentMap);
    }

    // ===== Private Helpers =====
    private updateSetData(
        exerciseId: string,
        setIndex: number,
        field: 'reps' | 'weights',
        value: number,
        isAbsolute = false,
    ): void {
        const currentMap = new Map(this.exerciseSetsData());
        const sets = currentMap.get(exerciseId);

        if (!sets || !sets[setIndex]) return;

        if (isAbsolute) {
            sets[setIndex][field] = Math.max(0, value);
        } else {
            sets[setIndex][field] = Math.max(0, sets[setIndex][field] + value);
        }

        currentMap.set(exerciseId, [...sets]);
        this.exerciseSetsData.set(currentMap);

        this.persistExerciseChanges(exerciseId, sets);
    }

    private persistExerciseChanges(exerciseId: string, sets: SetData[]): void {
        // Obtener ejercicio actual
        const exercise = this.exercises().find((ex) => ex.exerciseId === exerciseId);
        if (!exercise) return;

        // Actualizar el ejercicio con los nuevos sets
        const updatedExercise: ExercisePerformanceVM = {
            ...exercise,
            series: sets.length,
            sets: sets,
        };

        // Actualizar en la lista de ejercicios
        const updatedExercises = this.exercises().map((ex) =>
            ex.exerciseId === exerciseId ? updatedExercise : ex,
        );

        // Persistir en el service
        this.workoutState.updateExercises(updatedExercises);
    }
}
