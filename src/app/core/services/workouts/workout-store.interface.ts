import { InjectionToken, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import {
    ExercisePerformanceVM,
    LocalDate,
    StatusWorkoutSession,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { RoutineDayAPI } from '../../../shared/interfaces/api/routines-api.interface';

/**
 * Contrato comun de un store de entrenamiento del dia.
 * Implementado por el modo week (`WorkoutStateService`) y el modo day (`DayWorkoutStore`)
 * para que los widgets day-level se reutilicen en ambos flujos sin depender de un servicio concreto.
 */
export interface WorkoutStore {
    selectedDate: Signal<LocalDate | null>;
    workoutSession: Signal<WorkoutSessionVM | null>;
    exercises: Signal<ExercisePerformanceVM[]>;
    outOfDateRange: Signal<boolean>;
    loadingWorkoutCreation: Signal<{ date: LocalDate; state: boolean }>;
    loadingStatusWorkout: Signal<boolean>;
    loading: Signal<boolean>;

    setDate(date: LocalDate): void;
    updateExercises(exercises: ExercisePerformanceVM[]): void;

    createWorkout(date: LocalDate): Observable<unknown>;
    setRestDay(
        date: LocalDate,
        workout: WorkoutSessionVM,
        status: StatusWorkoutSession,
    ): Observable<unknown>;
    setRemoveAllExercises(date: LocalDate): void;
    updateWorkoutStatus(date: LocalDate, status: StatusWorkoutSession): void;
    updateWorkoutSession(date: LocalDate, workout: WorkoutSessionVM): void;
    removeWorkoutSession(date: LocalDate, id: string): Observable<boolean>;
    createWorkoutWithRoutine(routineDayId: string, date: LocalDate): Observable<unknown>;
    createRoutineFromWorkout(
        title: string,
        exerciseIds: string[],
    ): Observable<RoutineDayAPI | null>;
}

export const WORKOUT_STORE = new InjectionToken<WorkoutStore>('WORKOUT_STORE');
