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
import * as trackingWrappers from '../../../../../shared/wrappers/tracking.wrapper';
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
                        ? trackingWrappers.wrapperTrackingApiToVM(data.activeWeekLog.week)
                        : null,
                ),
            );
    }

    createWorkoutSession(
        payload: WorkoutSessionVM,
        weekLogId: string,
    ): Observable<WorkoutSessionVM | undefined | null> {
        let workout = this.wrapperWorkoutSessionVMToApi(payload, weekLogId);
        workout.status = StatusWorkoutSessionEnum.COMPLETE;
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
                        ? trackingWrappers.wrapperWorkoutSessionApiToVM(
                              data.createWorkoutSession,
                              this.exerciseSvc.exercises(),
                          )
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
                    data?.createWeekLog
                        ? trackingWrappers.wrapperTrackingApiToVM(data.createWeekLog)
                        : null,
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
                    data?.updateWeekLog
                        ? trackingWrappers.wrapperTrackingApiToVMS(data.updateWeekLog)
                        : null,
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
                        ? trackingWrappers.wrapperTrackingApiToVM(data.updateWeekLogDay)
                        : null,
                ),
            );
    }

    private wrapperWorkoutSessionVMToApi(
        payload: WorkoutSessionVM,
        trackingId: string,
    ): WorkoutSessionAPI {
        return trackingWrappers.wrapperWorkoutSessionVMToApi(payload, trackingId);
    }
}
