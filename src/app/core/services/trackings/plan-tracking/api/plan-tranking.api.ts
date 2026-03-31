import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { handleGraphqlError } from '../../../../../shared/utils/handle-graphql-error';
import { AuthService } from '../../../auth/auth.service';
import { map, Observable, of, switchMap, tap } from 'rxjs';
import {
    StatusWorkoutSessionEnum,
    TrackingVM,
    TrackingVMS,
    WorkoutSessionVM,
} from '../../../../../shared/interfaces/tracking.interface';
import {
    TrackingAPI,
    TrackingCreate,
    UpdateWeekLogDayInput,
    UpdateWeekLogInput,
    WorkoutSessionAPI,
} from '../../../../../shared/interfaces/api/tracking-api.interface';
import * as trackingWrappers from '../../../../../shared/wrappers/tracking.wrapper';
import { ExercisesService } from '../../../exercises/exercises.service';
import {
    CREATE_WEEK_LOG,
    CREATE_WORKOUT_SESSION,
    FIND_ACTIVE_WEEK_LOG,
    FIND_ALL_TRACKING_BY_USER,
    FIND_BY_ID,
    SYNC_WEEK_LOG_DAYS,
    UPDATE_WEEK_LOG,
    UPDATE_WEEK_LOG_DAY,
    REMOVE_WORKOUT_SESSION,
} from '../../../../apollo/tracking.queries';

@Injectable({
    providedIn: 'root',
})
export class PlanTrackingApi {
    private readonly apollo = inject(Apollo);

    authSvc = inject(AuthService);
    exerciseSvc = inject(ExercisesService);

    getTrackingByUser(): Observable<TrackingVM | undefined | null> {
        return this.exerciseSvc.getExercises().pipe(
            switchMap(() =>
                this.apollo
                    .query<{ activeWeekLog: { hasActiveWeek: boolean; week: TrackingAPI } }>({
                        query: FIND_ACTIVE_WEEK_LOG,
                        fetchPolicy: 'no-cache',
                    })
                    .pipe(
                        handleGraphqlError(this.authSvc),
                        map(({ data }) =>
                            data?.activeWeekLog.hasActiveWeek
                                ? trackingWrappers.wrapperTrackingApiToVM(
                                      data.activeWeekLog.week,
                                      this.exerciseSvc.exercises(),
                                  )
                                : null,
                        ),
                    ),
            ),
        );
    }

    createWorkoutSession(
        payload: WorkoutSessionVM,
        weekLogId: string,
    ): Observable<WorkoutSessionVM | undefined | null> {
        let workout = this.wrapperWorkoutSessionVMToApi(payload, weekLogId);
        workout.status = StatusWorkoutSessionEnum.COMPLETE;
        return this.apollo
            .mutate<{ createWorkoutSession: WorkoutSessionAPI }>({
                mutation: CREATE_WORKOUT_SESSION,
                variables: { input: workout },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.createWorkoutSession
                        ? trackingWrappers.wrapperWorkoutSessionApiToVM(
                              data.createWorkoutSession,
                              this.exerciseSvc.exercises(),
                          )
                        : null,
                ),
            );
    }

    updateWorkoutSession(
        payload: WorkoutSessionVM,
        weekLogId: string,
    ): Observable<WorkoutSessionVM | null> {
        // placeholder for future implementation
        return of(null);
    }

    removeWorkoutSession(id: string): Observable<boolean> {
        return this.apollo
            .mutate<{ removeWorkoutSession: { id: string } }>({
                mutation: REMOVE_WORKOUT_SESSION,
                variables: { id },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) => !!data?.removeWorkoutSession)
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
                tap((data) => console.log(data)),
                map(({ data }) =>
                    data?.createWeekLog
                        ? trackingWrappers.wrapperTrackingApiToVM(
                              data.createWeekLog,
                              this.exerciseSvc.exercises(),
                          )
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
                        ? trackingWrappers.wrapperTrackingApiToVMS(
                              data.updateWeekLog,
                              this.exerciseSvc.exercises(),
                          )
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
                        ? trackingWrappers.wrapperTrackingApiToVM(
                              data.updateWeekLogDay,
                              this.exerciseSvc.exercises(),
                          )
                        : null,
                ),
            );
    }

    syncTrackingDays(weekLogId: string): Observable<TrackingVM | null> {
        return this.apollo
            .mutate<{ syncWeekLogDays: TrackingAPI }>({
                mutation: SYNC_WEEK_LOG_DAYS,
                variables: { weekLogId },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.syncWeekLogDays
                        ? trackingWrappers.wrapperTrackingApiToVM(
                              data.syncWeekLogDays,
                              this.exerciseSvc.exercises(),
                          )
                        : null,
                ),
            );
    }

    findAllTrackingByUser(): Observable<TrackingVM[] | null> {
        return this.apollo
            .query<{ findAll: TrackingAPI[] }>({ query: FIND_ALL_TRACKING_BY_USER })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.findAll
                        ? data.findAll.map((tracking) =>
                              trackingWrappers.wrapperTrackingApiToVM(
                                  tracking,
                                  this.exerciseSvc.exercises(),
                              ),
                          )
                        : null,
                ),
            );
    }

    findById(id: string): Observable<TrackingVM | null> {
        return this.apollo
            .query<{ findOne: TrackingAPI }>({ query: FIND_BY_ID, variables: { id } })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.findOne
                        ? trackingWrappers.wrapperTrackingApiToVM(
                              data.findOne,
                              this.exerciseSvc.exercises(),
                          )
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
