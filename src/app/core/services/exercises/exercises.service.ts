import { Injectable, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { AuthService } from '../auth/auth.service';
import { map, Observable, of, tap } from 'rxjs';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { Exercise } from '../../../shared/interfaces/exercise.interface';

@Injectable({ providedIn: 'root' })
export class ExercisesService {
    exercises = signal<Exercise[]>([]);

    constructor(private apollo: Apollo, private authSvc: AuthService) {}

    getExercises(): Observable<Exercise[]> {
        if (this.exercises().length > 0) {
            return of(this.exercises());
        }

        return this.apollo
            .query<{ exercises: Exercise[] }>({
                query: gql`
                    query {
                        exercises {
                            id
                            name
                            category
                            usesWeight
                        }
                    }
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                tap(({ data }) => {
                    if (data) this.exercises.set(data.exercises);
                }),
                handleGraphqlError(this.authSvc),
                map((res) => res.data!.exercises)
            );
    }

    createExercise(exercise: Partial<Exercise>): Observable<Exercise> {
        return this.apollo
            .mutate<{ createExercise: Exercise }>({
                mutation: gql`
                    mutation CreateExercise($input: ExerciseInput!) {
                        createExercise(input: $input) {
                            id
                            name
                            category
                            usesWeight
                        }`,
                variables: { input: exercise },
            })
            .pipe(
                map((res) => {
                    const newExercise = res.data?.createExercise;
                    if (newExercise) {
                        this.exercises.set([...this.exercises(), newExercise]);
                    }
                    return newExercise!;
                })
            );
    }
}
