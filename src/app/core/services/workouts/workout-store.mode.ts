import { computed, inject } from '@angular/core';
import { ActiveTrackingService } from '../trackings/active-tracking.service';
import { WorkoutStateService } from './workout.state';
import { DayWorkoutStore } from './day-workout.store';
import { WorkoutStore } from './workout-store.interface';

/**
 * Factory raiz del token WORKOUT_STORE.
 * Devuelve un store virtual cuya delegacion es DINAMICA: cada señal es un `computed`
 * que lee el target actual (`ActiveTrackingService.isDayLogActive()` -> `DayWorkoutStore`
 * si hay day-log, `WorkoutStateService` si hay week-log o nada).
 *
 * No usa `Proxy` porque los facades capturan referencias a las señales una sola vez
 * (ej: `workoutVM = this.store.workoutSession`); un proxy solo delegaria en el momento
 * de la lectura inicial, dejando el workout roto al cambiar de modo a mitad de sesion.
 */
export function workoutStoreByMode(): WorkoutStore {
    const activeSvc = inject(ActiveTrackingService);
    const weekStore = inject(WorkoutStateService);
    const dayStore = inject(DayWorkoutStore);

    const target = (): WorkoutStore => (activeSvc.isDayLogActive() ? dayStore : weekStore);

    return {
        selectedDate: computed(() => target().selectedDate()),
        workoutSession: computed(() => target().workoutSession()),
        exercises: computed(() => target().exercises()),
        outOfDateRange: computed(() => target().outOfDateRange()),
        loadingWorkoutCreation: computed(() => target().loadingWorkoutCreation()),
        loadingStatusWorkout: computed(() => target().loadingStatusWorkout()),
        loading: computed(() => target().loading()),
        setDate: (date) => target().setDate(date),
        updateExercises: (exercises) => target().updateExercises(exercises),
        createWorkout: (date) => target().createWorkout(date),
        setRestDay: (date, workout, status) => target().setRestDay(date, workout, status),
        setRemoveAllExercises: (date) => target().setRemoveAllExercises(date),
        updateWorkoutStatus: (date, status) => target().updateWorkoutStatus(date, status),
        updateWorkoutSession: (date, workout) => target().updateWorkoutSession(date, workout),
        removeWorkoutSession: (date, id) => target().removeWorkoutSession(date, id),
        createWorkoutWithRoutine: (routineDayId, date) =>
            target().createWorkoutWithRoutine(routineDayId, date),
        createRoutineFromWorkout: (title, exerciseIds) =>
            target().createRoutineFromWorkout(title, exerciseIds),
    };
}