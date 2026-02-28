import { inject, Injectable, signal } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { AuthService } from '../auth/auth.service';
import { map, Observable, of, tap } from 'rxjs';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { Exercise } from '../../../shared/interfaces/exercise.interface';
import { ExercisePerformanceVM } from '../../../shared/interfaces/tracking.interface';
import { CREATE_EXERCISE, GET_EXERCISES } from '../../apollo/exercises.queries';

@Injectable({ providedIn: 'root' })
export class ExercisesService {
    exercises = signal<Exercise[]>([]);

    private readonly apollo = inject(Apollo);
    private readonly authSvc = inject(AuthService);

    getExercises(): Observable<Exercise[]> {
        if (this.exercises().length > 0) {
            return of(this.exercises());
        }

        return this.apollo
            .query<{ exercises: Exercise[] }>({
                query: GET_EXERCISES,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                tap(({ data }) => {
                    if (data) this.exercises.set(data.exercises);
                }),
                handleGraphqlError(this.authSvc),
                map((res) => res.data!.exercises),
            );
    }

    createExercise(exercise: Exercise): Observable<Exercise> {
        return this.apollo
            .mutate<{ createExercise: Exercise }>({
                mutation: CREATE_EXERCISE,
                variables: { input: exercise },
            })
            .pipe(
                map((res) => {
                    const newExercise = res.data?.createExercise;
                    if (newExercise) {
                        this.exercises.set([...this.exercises(), newExercise]);
                    }
                    return newExercise!;
                }),
            );
    }

    wrapperExerciseAPItoVM(): ExercisePerformanceVM[] {
        return this.exercises().map((ex) => ({
            exerciseId: ex.id!,
            name: ex.name,
            series: 0,
            category: ex.category,
            sets: [],
            usesWeight: ex.usesWeight,
        }));
    }
}
