import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { handleGraphqlError } from '../../../../../shared/utils/handle-graphql-error';
import { AuthService } from '../../../auth/auth.service';
import { map, Observable, switchMap } from 'rxjs';
import { ExercisesService } from '../../../exercises/exercises.service';
import { RoutineDayAPI } from '../../../../../shared/interfaces/api/routines-api.interface';
import { WorkoutSessionVM } from '../../../../../shared/interfaces/tracking.interface';
import {
    ExercisePerformanceAPI,
    WorkoutSessionAPI,
} from '../../../../../shared/interfaces/api/tracking-api.interface';
import { DayLogVM, DayLogSummaryVM } from '../../../../../shared/interfaces/day-log.interface';
import {
    AssignRoutineToDayLogResultAPI,
    CreateDayLogInput,
    DayLogAPI,
    DayLogSummaryAPI,
    RemoveExtraSessionFromDayLogResultAPI,
    RemoveWorkoutSessionFromDayLogResultAPI,
    UpdateDayLogInput,
    UpdateDayLogResultAPI,
    UpdateDayLogStatusResultAPI,
} from '../../../../../shared/interfaces/api/day-log-api.interface';
import { PlanDayStateService } from '../../plan-day.state';
import {
    patchDayLog,
    wrapperAssignRoutineToDayLogApiToVM,
    wrapperDayLogApiToVM,
    wrapperDayLogSummaryApiToVM,
    wrapperRemoveExtraSessionFromDayLogApiToVM,
    wrapperRemoveWorkoutSessionFromDayLogApiToVM,
    wrapperUpdateDayLogApiToVM,
    wrapperUpdateDayLogStatusApiToVM,
} from '../../../../../shared/wrappers/day-log.wrapper';
import { wrapperWorkoutSessionApiToVM } from '../../../../../shared/wrappers/tracking.wrapper';
import {
    ACTIVE_DAY_LOG,
    ASSIGN_ROUTINE_TO_DAY_LOG,
    CREATE_DAY_LOG,
    DAY_LOGS,
    FIND_DAY_LOG_BY_ID,
    REMOVE_DAY_LOG,
    REMOVE_EXTRA_SESSION_FROM_DAY_LOG,
    REMOVE_WORKOUT_SESSION_FROM_DAY_LOG,
    UPDATE_DAY_LOG,
    UPDATE_DAY_LOG_STATUS,
} from '../../../../apollo/day-log.queries';
import { UPDATE_WORKOUT_SESSION } from '../../../../apollo/workout.queries';
import { CREATE_ROUTINE_BY_WORKOUT } from '../../../../apollo/tracking.queries';

@Injectable({
    providedIn: 'root',
})
export class PlanDayApi {
    private readonly apollo = inject(Apollo);

    authSvc = inject(AuthService);
    exerciseSvc = inject(ExercisesService);
    private state: PlanDayStateService = inject(PlanDayStateService);

    getActiveDayLog(): Observable<DayLogVM | null> {
        return this.exerciseSvc.getExercises().pipe(
            switchMap(() =>
                this.apollo
                    .query<{
                        activeDayLog: { hasActiveDay: boolean; day: DayLogAPI | null };
                    }>({
                        query: ACTIVE_DAY_LOG,
                        fetchPolicy: 'no-cache',
                    })
                    .pipe(
                        handleGraphqlError(this.authSvc),
                        map(({ data }) =>
                            data?.activeDayLog?.hasActiveDay
                                ? wrapperDayLogApiToVM(
                                      data.activeDayLog.day!,
                                      this.exerciseSvc.exercises(),
                                  )
                                : null,
                        ),
                    ),
            ),
        );
    }

    createDayLog(payload: CreateDayLogInput): Observable<DayLogVM | null> {
        return this.exerciseSvc.getExercises().pipe(
            switchMap(() =>
                this.apollo
                    .mutate<{ createDayLog: DayLogAPI }>({
                        mutation: CREATE_DAY_LOG,
                        variables: { input: payload },
                    })
                    .pipe(
                        handleGraphqlError(this.authSvc),
                        map(({ data }) =>
                            data?.createDayLog
                                ? wrapperDayLogApiToVM(
                                      data.createDayLog,
                                      this.exerciseSvc.exercises(),
                                  )
                                : null,
                        ),
                    ),
            ),
        );
    }

    updateDayLog(payload: UpdateDayLogInput): Observable<DayLogVM | null> {
        return this.apollo
            .mutate<{ updateDayLog: UpdateDayLogResultAPI }>({
                mutation: UPDATE_DAY_LOG,
                variables: { input: payload },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    patchDayLog(
                        this.state.getDayLogValue(),
                        wrapperUpdateDayLogApiToVM(data?.updateDayLog ?? null),
                    ),
                ),
            );
    }

    updateWorkoutSession(workout: WorkoutSessionVM): Observable<WorkoutSessionVM | null> {
        const input: WorkoutSessionAPI = {
            id: workout.id,
            date: workout.date,
            exercises: workout.exercises.map((e) => ({
                exerciseId: e.exerciseId,
                series: e.series,
                sets: e.sets.map((s) => ({ reps: s.reps, weights: s.weights })),
                notes: e.notes,
            })) as ExercisePerformanceAPI[],
            status: workout.status,
            notes: workout.notes,
        };

        return this.exerciseSvc.getExercises().pipe(
            switchMap(() =>
                this.apollo
                    .mutate<{ updateWorkoutSession: WorkoutSessionAPI }>({
                        mutation: UPDATE_WORKOUT_SESSION,
                        variables: { updateWorkoutSessionInput: input },
                    })
                    .pipe(
                        handleGraphqlError(this.authSvc),
                        map(({ data }) =>
                            data?.updateWorkoutSession
                                ? wrapperWorkoutSessionApiToVM(
                                      data.updateWorkoutSession,
                                      this.exerciseSvc.exercises(),
                                  )
                                : null,
                        ),
                    ),
            ),
        );
    }

    updateDayLogStatus(date: string, isRest: boolean): Observable<DayLogVM | null> {
        return this.apollo
            .mutate<{ updateDayLogStatus: UpdateDayLogStatusResultAPI }>({
                mutation: UPDATE_DAY_LOG_STATUS,
                variables: { date, isRest },
                fetchPolicy: 'no-cache',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    patchDayLog(
                        this.state.getDayLogValue(),
                        wrapperUpdateDayLogStatusApiToVM(data?.updateDayLogStatus ?? null),
                    ),
                ),
            );
    }

    assignRoutineToDayLog(routineDayId: string, date: string): Observable<DayLogVM | null> {
        return this.apollo
            .mutate<{ assignRoutineToDayLog: AssignRoutineToDayLogResultAPI }>({
                mutation: ASSIGN_ROUTINE_TO_DAY_LOG,
                variables: { routineDayId, date },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    patchDayLog(
                        this.state.getDayLogValue(),
                        wrapperAssignRoutineToDayLogApiToVM(
                            data?.assignRoutineToDayLog ?? null,
                            this.exerciseSvc.exercises(),
                        ),
                    ),
                ),
            );
    }

    removeWorkoutSessionFromDayLog(workoutSessionId: string): Observable<DayLogVM | null> {
        return this.apollo
            .mutate<{ removeWorkoutSessionFromDayLog: RemoveWorkoutSessionFromDayLogResultAPI }>({
                mutation: REMOVE_WORKOUT_SESSION_FROM_DAY_LOG,
                variables: { workoutSessionId },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    patchDayLog(
                        this.state.getDayLogValue(),
                        wrapperRemoveWorkoutSessionFromDayLogApiToVM(
                            data?.removeWorkoutSessionFromDayLog ?? null,
                        ),
                    ),
                ),
            );
    }

    removeExtraSessionFromDayLog(extraSessionId: string): Observable<DayLogVM | null> {
        return this.apollo
            .mutate<{ removeExtraSessionFromDayLog: RemoveExtraSessionFromDayLogResultAPI }>({
                mutation: REMOVE_EXTRA_SESSION_FROM_DAY_LOG,
                variables: { extraSessionId },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    patchDayLog(
                        this.state.getDayLogValue(),
                        wrapperRemoveExtraSessionFromDayLogApiToVM(
                            data?.removeExtraSessionFromDayLog ?? null,
                        ),
                    ),
                ),
            );
    }

    createRoutineByWorkout(title: string, exerciseIds: string[]): Observable<RoutineDayAPI | null> {
        return this.apollo
            .mutate<{ createRoutineByWorkout: RoutineDayAPI }>({
                mutation: CREATE_ROUTINE_BY_WORKOUT,
                variables: { title, exerciseIds },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) => data?.createRoutineByWorkout ?? null),
            );
    }

    findAllDayLogs(limit = 5, offset = 0): Observable<DayLogSummaryVM[] | null> {
        return this.apollo
            .query<{ dayLogFindAll: DayLogSummaryAPI[] }>({
                query: DAY_LOGS,
                variables: { limit, offset },
                fetchPolicy: 'no-cache',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.dayLogFindAll
                        ? data.dayLogFindAll.map((d) => wrapperDayLogSummaryApiToVM(d))
                        : null,
                ),
            );
    }

    findDayLogById(id: string): Observable<DayLogVM | null> {
        return this.apollo
            .query<{ dayLogFindOne: DayLogAPI }>({ query: FIND_DAY_LOG_BY_ID, variables: { id } })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.dayLogFindOne
                        ? wrapperDayLogApiToVM(data.dayLogFindOne, this.exerciseSvc.exercises())
                        : null,
                ),
            );
    }

    removeDayLog(id: string): Observable<boolean> {
        return this.apollo
            .mutate<{ removeDayLog: { id: string } }>({
                mutation: REMOVE_DAY_LOG,
                variables: { id },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) => !!data),
            );
    }
}
