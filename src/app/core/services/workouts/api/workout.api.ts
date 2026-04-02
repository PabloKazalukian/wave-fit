import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map, Observable, tap } from 'rxjs';
import { handleGraphqlError } from '../../../../shared/utils/handle-graphql-error';
import { AuthService } from '../../auth/auth.service';
import { ExercisesService } from '../../exercises/exercises.service';
import {
    StatusWorkoutSessionEnum,
    WorkoutSessionVM,
} from '../../../../shared/interfaces/tracking.interface';
import { WorkoutSessionAPI } from '../../../../shared/interfaces/api/tracking-api.interface';
import * as trackingWrappers from '../../../../shared/wrappers/tracking.wrapper';
import {
    CREATE_WORKOUT_SESSION,
    UPDATE_WORKOUT_SESSION,
    REMOVE_WORKOUT_SESSION,
    ASSIGN_ROUTINE_TO_DAY,
} from '../../../apollo/workout.queries';

@Injectable({
    providedIn: 'root',
})
export class WorkoutApi {
    private readonly apollo = inject(Apollo);
    private readonly authSvc = inject(AuthService);
    private readonly exerciseSvc = inject(ExercisesService);

    createWorkoutSession(
        payload: WorkoutSessionVM,
        weekLogId: string,
    ): Observable<WorkoutSessionVM | undefined | null> {
        const workout = this.wrapperWorkoutSessionVMToApi(payload, weekLogId);
        workout.status = StatusWorkoutSessionEnum.COMPLETE;
        return this.apollo
            .mutate<{ createWorkoutSession: WorkoutSessionAPI }>({
                mutation: CREATE_WORKOUT_SESSION,
                variables: { createWorkoutSessionInput: workout },
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
        const workout = this.wrapperWorkoutSessionVMToApi(payload, weekLogId);
        return this.apollo
            .mutate<{ updateWorkoutSession: WorkoutSessionAPI }>({
                mutation: UPDATE_WORKOUT_SESSION,
                variables: { updateWorkoutSessionInput: workout },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) =>
                    data?.updateWorkoutSession
                        ? trackingWrappers.wrapperWorkoutSessionApiToVM(
                              data.updateWorkoutSession,
                              this.exerciseSvc.exercises(),
                          )
                        : null,
                ),
            );
    }

    removeWorkoutSession(id: string): Observable<boolean> {
        return this.apollo
            .mutate<{ removeWorkoutSession: { id: string } }>({
                mutation: REMOVE_WORKOUT_SESSION,
                variables: { id },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) => !!data?.removeWorkoutSession),
            );
    }

    assignRoutineToDay(
        routineDayId: string,
        date: string,
    ): Observable<WorkoutSessionVM | undefined | null> {
        return this.apollo
            .mutate<{ assignRoutineToDay: WorkoutSessionAPI }>({
                mutation: ASSIGN_ROUTINE_TO_DAY,
                variables: { routineDayId, date },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                tap((res) => console.log('assignRoutineToDay', res)),
                map(({ data }) =>
                    data?.assignRoutineToDay
                        ? trackingWrappers.wrapperWorkoutSessionApiToVM(
                              data.assignRoutineToDay,
                              this.exerciseSvc.exercises(),
                          )
                        : null,
                ),
            );
    }

    private wrapperWorkoutSessionVMToApi(payload: WorkoutSessionVM, trackingId: string): any {
        return trackingWrappers.wrapperWorkoutSessionVMToApi(payload, trackingId);
    }
}
