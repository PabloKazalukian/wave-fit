import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { handleGraphqlError } from '../../../../../shared/utils/handle-graphql-error';
import { AuthService } from '../../../auth/auth.service';
import { map, Observable, of, switchMap, tap } from 'rxjs';
import { TrackingVM, TrackingVMS } from '../../../../../shared/interfaces/tracking.interface';
import {
    TrackingAPI,
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
} from '../../../../apollo/tracking.queries';
import { DateService } from '../../../date.service';

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
                        tap((data) => console.log(data)),
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
            .mutate<{ updateDay: TrackingAPI }>({
                mutation: UPDATE_WEEK_LOG,
                variables: { input: payload },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.updateDay
                        ? trackingWrappers.wrapperTrackingApiToVMS(
                              data.updateDay,
                              this.exerciseSvc.exercises(),
                          )
                        : null,
                ),
            );
    }

    updateTrackingDay(payload: UpdateWeekLogDayUnifiedInput): Observable<TrackingVM | null> {
        console.log('aca', payload);
        return this.apollo
            .mutate<{ updateDay: TrackingAPI }>({
                mutation: UPDATE_WEEK_LOG_DAY,
                variables: { input: payload },
                fetchPolicy: 'no-cache',
            })
            .pipe(
                tap((data) => console.log(data)),
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.updateDay
                        ? trackingWrappers.wrapperTrackingApiToVM(
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
                tap((data) => console.log('aca', data)),
            );
    }

    assignRoutineToDay(routineDayId: string, date: string): Observable<TrackingVM | null> {
        const searchDate = this.dateSvc.parseLocalDate(date);
        console.log('aca', searchDate);
        console.log('date:', date);
        return this.apollo
            .mutate<{ assignRoutineToDay: TrackingAPI }>({
                mutation: ASSIGN_ROUTINE_TO_DAY,
                variables: { routineDayId, date },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                tap((data) => console.log(data)),
                map(({ data }) =>
                    data?.assignRoutineToDay
                        ? trackingWrappers.wrapperTrackingApiToVM(
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

    removeExtraSession(date: Date, extraSessionId: string): Observable<TrackingVM | null> {
        return this.apollo
            .mutate<{
                removeExtraSessionFromDay: TrackingAPI;
            }>({ mutation: REMOVE_EXTRA_SESSION_FROM_DAY, variables: { date, extraSessionId } })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.removeExtraSessionFromDay
                        ? trackingWrappers.wrapperTrackingApiToVM(
                              data.removeExtraSessionFromDay,
                              this.exerciseSvc.exercises(),
                          )
                        : null,
                ),
            );
    }
    createRoutineByWorkout(title: string, exerciseIds: string[]): Observable<any> {
        return this.apollo
            .mutate({
                mutation: CREATE_ROUTINE_BY_WORKOUT,
                variables: { title, exerciseIds },
            })
            .pipe(handleGraphqlError(this.authSvc));
    }
}
