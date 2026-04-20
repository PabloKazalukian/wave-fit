import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { handleGraphqlError } from '../../../../../shared/utils/handle-graphql-error';
import { AuthService } from '../../../auth/auth.service';
import { map, Observable, switchMap } from 'rxjs';
import {
    TrackingVM,
    TrackingVMS,
    WeekLogDayVM,
} from '../../../../../shared/interfaces/tracking.interface';
import {
    TrackingAPI,
    WeekLogDayAPI,
    TrackingCreate,
    UpdateWeekLogDayUnifiedInput,
    UpdateWeekLogInput,
} from '../../../../../shared/interfaces/api/tracking-api.interface';
import * as trackingWrappers from '../../../../../shared/wrappers/tracking.wrapper';
import { ExercisesService } from '../../../exercises/exercises.service';
import {
    CREATE_WEEK_LOG,
    FIND_ACTIVE_WEEK_LOG,
    FIND_ALL_TRACKING_BY_USER,
    FIND_BY_ID,
    SYNC_WEEK_LOG_DAYS,
    UPDATE_WEEK_LOG_DAY,
    ASSIGN_ROUTINE_TO_DAY,
    UPDATE_WEEK_LOG,
    REMOVE_EXTRA_SESSION_FROM_DAY,
    CREATE_ROUTINE_BY_WORKOUT,
    REMOVE_WORKOUT_SESSION_FROM_DAY,
    UPDATE_DAY_WORKOUT_STATUS,
} from '../../../../apollo/tracking.queries';
import { DateService } from '../../../date.service';
import { RoutineDayAPI } from '../../../../../shared/interfaces/api/routines-api.interface';

@Injectable({
    providedIn: 'root',
})
export class PlanTrackingApi {
    private readonly apollo = inject(Apollo);

    authSvc = inject(AuthService);
    exerciseSvc = inject(ExercisesService);
    dateSvc = inject(DateService);

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
                variables: { input: payload },
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

    updateTrackingDay(payload: UpdateWeekLogDayUnifiedInput): Observable<WeekLogDayVM | null> {
        console.log(payload);
        return this.apollo
            .mutate<{ updateDay: WeekLogDayAPI }>({
                mutation: UPDATE_WEEK_LOG_DAY,
                variables: { input: payload },
                fetchPolicy: 'no-cache',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.updateDay
                        ? trackingWrappers.wrapperWeekLogDayApiToVM(
                              data.updateDay,
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
                fetchPolicy: 'no-cache',
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

    assignRoutineToDay(routineDayId: string, date: string): Observable<WeekLogDayVM | null> {
        return this.apollo
            .mutate<{ assignRoutineToDay: WeekLogDayAPI }>({
                mutation: ASSIGN_ROUTINE_TO_DAY,
                variables: { routineDayId, date }, // date es LocalDate string
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.assignRoutineToDay
                        ? trackingWrappers.wrapperWeekLogDayApiToVM(
                              data.assignRoutineToDay,
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

    removeExtraSession(date: string, extraSessionId: string): Observable<WeekLogDayVM | null> {
        return this.apollo
            .mutate<{
                removeExtraSessionFromDay: WeekLogDayAPI;
            }>({ mutation: REMOVE_EXTRA_SESSION_FROM_DAY, variables: { date, extraSessionId } })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.removeExtraSessionFromDay
                        ? trackingWrappers.wrapperWeekLogDayApiToVM(
                              data.removeExtraSessionFromDay,
                              this.exerciseSvc.exercises(),
                          )
                        : null,
                ),
            );
    }

    removeWorkoutSession(date: string, workoutSessionId: string): Observable<WeekLogDayVM | null> {
        return this.apollo
            .mutate<{
                removeWorkoutSessionFromDay: WeekLogDayAPI;
            }>({ mutation: REMOVE_WORKOUT_SESSION_FROM_DAY, variables: { date, workoutSessionId } })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.removeWorkoutSessionFromDay
                        ? trackingWrappers.wrapperWeekLogDayApiToVM(
                              data.removeWorkoutSessionFromDay,
                              this.exerciseSvc.exercises(),
                          )
                        : null,
                ),
            );
    }

    createRoutineByWorkout(title: string, exerciseIds: string[]): Observable<RoutineDayAPI | null> {
        return this.apollo
            .mutate<{
                createRoutineByWorkout: RoutineDayAPI;
            }>({
                mutation: CREATE_ROUTINE_BY_WORKOUT,
                variables: { title, exerciseIds },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) => data?.createRoutineByWorkout ?? null),
            );
    }

    updateDayWorkoutStatus(date: string, isRest: boolean): Observable<WeekLogDayVM | null> {
        return this.apollo
            .mutate<{ updateDayWorkoutStatus: WeekLogDayAPI }>({
                mutation: UPDATE_DAY_WORKOUT_STATUS,
                variables: { input: { date, isRest } },
                fetchPolicy: 'no-cache',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.updateDayWorkoutStatus
                        ? trackingWrappers.wrapperWeekLogDayApiToVM(
                              data.updateDayWorkoutStatus,
                              this.exerciseSvc.exercises(),
                          )
                        : null,
                ),
            );
    }
}
