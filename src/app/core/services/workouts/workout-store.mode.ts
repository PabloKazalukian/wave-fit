import { inject } from '@angular/core';
import { ActiveTrackingService } from '../trackings/active-tracking.service';
import { WorkoutStateService } from './workout.state';
import { DayWorkoutStore } from './day-workout.store';
import { WorkoutStore } from './workout-store.interface';

/**
 * Factory raiz del token WORKOUT_STORE.
 * Devuelve un `Proxy` que delega cada acceso al store del modo activo segun
 * `ActiveTrackingService.mode()`: day-log -> `DayWorkoutStore`, week-log -> `WorkoutStateService`.
 * No se resuelve una sola vez (el modo puede cambiar en sesion), por eso la delegacion
 * ocurre en cada lectura/llamada y tambien reenvia las props privadas de metodos (this.x).
 */
export function workoutStoreByMode(): WorkoutStore {
    const activeSvc = inject(ActiveTrackingService);
    const weekStore = inject(WorkoutStateService);
    const dayStore = inject(DayWorkoutStore);

    const target = (): WorkoutStore => (activeSvc.isDayLogActive() ? dayStore : weekStore);

    return new Proxy({} as WorkoutStore, {
        get: (_target, prop) => Reflect.get(target(), prop),
    });
}