import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { handleGraphqlError } from '../../../../../shared/utils/handle-graphql-error';
import { AuthService } from '../../../auth/auth.service';
import { catchError, delay, map, Observable, of, tap } from 'rxjs';
import {
    ExercisePerformanceVM,
    ExtraActivityVM,
    StatusWorkoutSession,
    StatusWorkoutSessionEnum,
    TrackingVM,
    TrackingVMS,
    WorkoutSessionVM,
} from '../../../../../shared/interfaces/tracking.interface';
import {
    DayStatusAPI,
    ExercisePerformanceAPI,
    ExtraSessionAPI,
    TrackingAPI,
    TrackingCreate,
    UpdateWeekLogDayInput,
    UpdateWeekLogInput,
    WeekLogDayAPI,
    WeekLogDayVM,
    WorkoutSessionAPI,
} from '../../../../../shared/interfaces/api/tracking-api.interface';
import { ExercisesService } from '../../../exercises/exercises.service';
import { ExerciseCategory } from '../../../../../shared/interfaces/exercise.interface';
import {
    CREATE_WEEK_LOG,
    CREATE_WORKOUT_SESSION,
    FIND_ACTIVE_WEEK_LOG,
    UPDATE_WEEK_LOG,
    UPDATE_WEEK_LOG_DAY,
} from '../../../../apollo/tracking.queries';

@Injectable({
    providedIn: 'root',
})
export class PlanTrankingApi {
    private readonly apollo = inject(Apollo);

    authSvc = inject(AuthService);
    exerciseSvc = inject(ExercisesService);

    getTrackingByUser(): Observable<TrackingVM | undefined | null> {
        return this.apollo
            .query<{ activeWeekLog: { hasActiveWeek: boolean; week: TrackingAPI } }>({
                query: FIND_ACTIVE_WEEK_LOG,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                tap((res) => console.log(res)),
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.activeWeekLog.hasActiveWeek
                        ? this.wrapperTrackingApiToVM(data.activeWeekLog.week)
                        : null,
                ),
            );
    }

    createWorkoutSession(
        payload: WorkoutSessionVM,
        weekLogId: string,
    ): Observable<WorkoutSessionVM | undefined | null> {
        const workout = this.wrapperWorkoutSessionVMToApi(payload, weekLogId);
        console.log('transformado', workout);
        return this.apollo
            .mutate<{ createWorkoutSession: WorkoutSessionAPI }>({
                mutation: CREATE_WORKOUT_SESSION,
                variables: { input: workout },
            })
            .pipe(
                tap((res) => console.log(res)),
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.createWorkoutSession
                        ? this.wrapperWorkoutSessionApiToVM(data.createWorkoutSession)
                        : null,
                ),
                tap((res) => console.log(res)),
                catchError((err) => {
                    return of(null);
                }),
            );
    }

    createTracking(payload: TrackingCreate): Observable<TrackingVM | undefined | null> {
        return this.apollo
            .mutate<{ createWeekLog: TrackingAPI }>({
                mutation: CREATE_WEEK_LOG,
                variables: { input: payload },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.createWeekLog ? this.wrapperTrackingApiToVM(data.createWeekLog) : null,
                ),
            );
    }

    updateTracking(payload: UpdateWeekLogInput): Observable<TrackingVMS | null> {
        return this.apollo
            .mutate<{ updateWeekLog: TrackingAPI }>({
                mutation: UPDATE_WEEK_LOG,
                variables: { updateWeekLogInput: payload },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.updateWeekLog ? this.wrapperTrackingApiToVMS(data.updateWeekLog) : null,
                ),
            );
    }

    // ─── Update de un día individual ─────────────────────────────────────────────

    updateTrackingDay(payload: UpdateWeekLogDayInput): Observable<TrackingVM | null> {
        return this.apollo
            .mutate<{ updateWeekLogDay: TrackingAPI }>({
                mutation: UPDATE_WEEK_LOG_DAY,
                variables: { input: payload },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.updateWeekLogDay
                        ? this.wrapperTrackingApiToVM(data.updateWeekLogDay)
                        : null,
                ),
            );
    }

    //WRAPPERS

    private wrapperTrackingApiToVMS(payload: TrackingAPI): TrackingVMS {
        return {
            id: payload.id,
            userId: payload.userId,
            startDate: new Date(payload.startDate),
            endDate: new Date(payload.endDate),
            planId: payload.planId,
            notes: payload.notes,
            completed: payload.completed,
            days: payload.days?.map((d) => this.wrapperWeekLogDayApiToVM(d)) ?? [],
        };
    }

    private wrapperTrackingApiToVM(payload: TrackingAPI): TrackingVM {
        console.log(payload);
        return {
            id: payload.id,
            userId: payload.userId,
            startDate: new Date(payload.startDate),
            endDate: new Date(payload.endDate),
            planId: payload.planId,
            notes: payload.notes,
            completed: payload.completed,
            workouts: payload.days.map((d) => this.wrapperWeekLogDayVMToWorkoutVM(d)),
            extras: [],
        };
    }

    // ─── WeekLogDayAPI → WeekLogDayVM ────────────────────────────────────────────

    private wrapperWeekLogDayApiToVM(payload: WeekLogDayAPI): WeekLogDayVM {
        return {
            order: payload.order,
            date: new Date(payload.date),
            isRest: payload.isRest,
            workoutSessionId: payload.workoutSessionId ?? null,
            extraSessionIds: payload.extraSessionIds ?? [],
            status: payload.status,
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

    private wrapperWorkoutSessionVMToApi(
        payload: WorkoutSessionVM,
        trackingId: string,
    ): WorkoutSessionAPI {
        return {
            // id: payload.id,
            weekLogId: trackingId,
            date: payload.date,
            exercises: this.wrapperExercisePerformanceVMToApi(payload.exercises),
            status: payload.status,
            notes: payload.notes,
        };
    }

    private wrapperExercisePerformanceVMToApi(
        payload: ExercisePerformanceVM[],
    ): ExercisePerformanceAPI[] {
        return payload.map((e) => ({
            exerciseId: e.exerciseId,
            series: e.series,
            sets: e.sets.map((s) => ({
                reps: s.reps,
                weights: s.weights,
            })),
            notes: e.notes,
        }));
    }

    private wrapperExercisePerformanceApiToVM(
        payload: ExercisePerformanceAPI[],
    ): ExercisePerformanceVM[] {
        if (payload.length === 0) return [];

        const allExercises = this.exerciseSvc.exercises();

        const exercisesMap = new Map(allExercises.map((ex) => [ex.id, ex]));

        return payload.map((performance) => {
            const exercise = exercisesMap.get(performance.exerciseId);
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

    private wrapperWeekLogDayVMToWorkoutVM(payload: WeekLogDayAPI): WorkoutSessionVM {
        return {
            id: payload.workoutSessionId ?? '',
            date: new Date(payload.date),
            exercises: [],
            status: this.wrapperDayStatusApiToStatusWorkoutSession(payload.status),
            notes: '',
        };
    }

    wrapperDayStatusApiToStatusWorkoutSession(payload: DayStatusAPI): StatusWorkoutSession {
        switch (payload) {
            case 'pending':
                return StatusWorkoutSessionEnum.NOT_STARTED;
            case 'complete':
                return StatusWorkoutSessionEnum.COMPLETE;
            case 'skipped':
                return StatusWorkoutSessionEnum.REST;
        }
    }
}
