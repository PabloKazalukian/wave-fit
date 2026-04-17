import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { handleGraphqlError } from '../../../../shared/utils/handle-graphql-error';
import { AuthService } from '../../auth/auth.service';
import { ExercisesService } from '../../exercises/exercises.service';
import { WorkoutSessionVM } from '../../../../shared/interfaces/tracking.interface';
import { WorkoutSessionAPI } from '../../../../shared/interfaces/api/tracking-api.interface';
import * as trackingWrappers from '../../../../shared/wrappers/tracking.wrapper';
import { UPDATE_WORKOUT_SESSION } from '../../../apollo/workout.queries';

@Injectable({
    providedIn: 'root',
})
export class WorkoutApi {
    private readonly apollo = inject(Apollo);
    private readonly authSvc = inject(AuthService);
    private readonly exerciseSvc = inject(ExercisesService);

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

    private wrapperWorkoutSessionVMToApi(payload: WorkoutSessionVM, trackingId: string): any {
        return trackingWrappers.wrapperWorkoutSessionVMToApi(payload, trackingId);
    }
}
