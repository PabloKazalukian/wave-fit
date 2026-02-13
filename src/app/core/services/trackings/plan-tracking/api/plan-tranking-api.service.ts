import { inject, Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { handleGraphqlError } from '../../../../../shared/utils/handle-graphql-error';
import { AuthService } from '../../../auth/auth.service';
import { map, Observable, tap } from 'rxjs';
import {
    ExercisePerformanceVM,
    ExtraActivityVM,
    StatusWorkoutSessionEnum,
    TrackingVM,
    WorkoutSessionVM,
} from '../../../../../shared/interfaces/tracking.interface';
import {
    ExercisePerformanceAPI,
    ExtraSessionAPI,
    TrackingAPI,
    TrackingCreate,
    WorkoutSessionAPI,
} from '../../../../../shared/interfaces/api/tracking-api.interface';
import { ExercisesService } from '../../../exercises/exercises.service';
import { ExerciseCategory } from '../../../../../shared/interfaces/exercise.interface';

@Injectable({
    providedIn: 'root',
})
export class PlanTrankingApi {
    private readonly apollo = inject(Apollo);

    authSvc = inject(AuthService);
    exerciseSvc = inject(ExercisesService);

    getTrackingByUser(): Observable<TrackingVM | undefined | null> {
        return this.apollo
            .query<{ activeWeekLog: TrackingAPI }>({
                query: gql`
                    query findActiveWeekLog {
                        activeWeekLog {
                            id
                            startDate
                            endDate
                            userId
                            workouts {
                                id
                                date
                                routineDayId
                                exercises {
                                    exerciseId
                                    sets {
                                        weights
                                        reps
                                    }
                                    series
                                    notes
                                }
                                notes
                            }
                            extras {
                                id
                                type
                                discipline
                                duration
                                intensityLevel
                                calories
                                notes
                            }
                            planId
                            notes
                            completed
                        }
                    }
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.activeWeekLog ? this.wrapperTrackingApiToVM(data.activeWeekLog) : null,
                ),
            );
    }

    createTracking(payload: TrackingCreate): Observable<TrackingVM | undefined | null> {
        return this.apollo
            .mutate<{ createWeekLog: TrackingAPI }>({
                mutation: gql`
                    mutation CreateWeekLog($input: CreateWeekLogInput!) {
                        createWeekLog(createWeekLogInput: $input) {
                            id
                            startDate
                            endDate
                            userId
                            workouts {
                                id
                                date
                                routineDayId
                                exercises {
                                    exerciseId
                                    sets {
                                        weights
                                        reps
                                    }
                                    series
                                    notes
                                }
                                notes
                            }
                            extras {
                                id
                                type
                                discipline
                                duration
                                intensityLevel
                                calories
                                notes
                            }
                            planId
                            notes
                            completed
                        }
                    }
                `,
                variables: { input: payload },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.createWeekLog ? this.wrapperTrackingApiToVM(data.createWeekLog) : null,
                ),
            );
    }

    private wrapperTrackingApiToVM(payload: TrackingAPI): TrackingVM {
        return {
            id: payload.id,
            userId: payload.userId,
            startDate: new Date(payload.startDate),
            endDate: new Date(payload.endDate),
            workouts: payload.workouts?.map((w) => this.wrapperWorkoutSessionApiToVM(w)) ?? [],
            extras: payload.extras?.map((e) => this.wrapperExtraSessionApiToVM(e)) ?? [],
            planId: payload.planId,
            notes: payload.notes,
            completed: payload.completed,
        };
    }

    // Wrapper: WorkoutSessionAPI -> WorkoutSessionVM
    private wrapperWorkoutSessionApiToVM(payload: WorkoutSessionAPI): WorkoutSessionVM {
        // Determinar el status basado en la información disponible
        let status: StatusWorkoutSessionEnum;
        !payload.exercises || payload.exercises.length === 0
            ? (status = StatusWorkoutSessionEnum.NOT_STARTED)
            : (status = StatusWorkoutSessionEnum.COMPLETE);

        return {
            id: payload.id,
            date: payload.date ? new Date(payload.date) : new Date(),
            exercises: this.wrapperExercisePerformanceApiToVM(payload.exercises || []),
            status,
            notes: payload.notes,
        };
    }

    // Wrapper: ExercisePerformanceAPI[] -> ExercisePerformanceVM[]
    private wrapperExercisePerformanceApiToVM(
        payload: ExercisePerformanceAPI[],
    ): ExercisePerformanceVM[] {
        if (payload.length === 0) return [];

        // Obtener todos los ejercicios una sola vez
        const allExercises = this.exerciseSvc.exercises();

        // Crear un Map para búsqueda rápida por ID
        const exercisesMap = new Map(allExercises.map((ex) => [ex.id, ex]));

        // Mapear cada ExercisePerformanceAPI a ExercisePerformanceVM
        return payload.map((performance) => {
            // Buscar el ejercicio correspondiente
            const exercise = exercisesMap.get(performance.exerciseId);

            // Si no se encuentra el ejercicio, usar valores por defecto
            const name = exercise?.name || 'Ejercicio desconocido';
            const usesWeight = exercise?.usesWeight || false;
            const category = exercise?.category || ExerciseCategory.CARDIO;

            return {
                exerciseId: performance.exerciseId,
                name,
                category,
                series: performance.series,
                sets: performance.sets.map((set) => ({
                    reps: set.reps,
                    weights: set.weights,
                })),
                usesWeight,
                notes: performance.notes,
            };
        });
    }

    // Wrapper: ExtraSessionAPI -> ExtraActivityVM
    private wrapperExtraSessionApiToVM(payload: ExtraSessionAPI): ExtraActivityVM {
        // Mapear el tipo de actividad desde la API al VM
        let type: 'running' | 'yoga' | 'cycling' | 'other';

        switch (payload.discipline.toLowerCase()) {
            case 'running':
            case 'correr':
                type = 'running';
                break;
            case 'yoga':
                type = 'yoga';
                break;
            case 'bicicleta':
            case 'cycling':
            case 'ciclismo':
                type = 'cycling';
                break;
            default:
                type = 'other';
        }

        return {
            id: payload.id,
            type,
            duration: payload.duration,
            distance: undefined, // No está en la API, podrías calcularlo o agregarlo
        };
    }
}
