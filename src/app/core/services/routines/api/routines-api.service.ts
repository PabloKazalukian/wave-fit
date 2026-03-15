import { inject, Injectable } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable, tap } from 'rxjs';
import { handleGraphqlError } from '../../../../shared/utils/handle-graphql-error';
import {
    KindEnum,
    RoutineDay,
    RoutineDayCreate,
    RoutineDayCreateSend,
} from '../../../../shared/interfaces/routines.interface';
import { ExerciseCategory } from '../../../../shared/interfaces/exercise.interface';
import { RoutineDayAPI } from '../../../../shared/interfaces/api/routines-api.interface';
import {
    wrapperRoutineDayAPItoRoutineDay,
    wrapperRoutineDayCreateToPayload,
} from '../../../../shared/wrappers/routines.wrapper';

@Injectable({
    providedIn: 'root',
})
export class RoutinesApiService {
    private readonly apollo = inject(Apollo);
    private readonly authSvc = inject(AuthService);

    getRoutines(): Observable<RoutineDay[] | undefined> {
        return this.apollo
            .query<{ routineDays: RoutineDayAPI[] }>({
                query: gql`
                    query {
                        routineDays {
                            id
                            title
                            type
                            exercises {
                                order
                                exercise {
                                    id
                                    name
                                    category
                                }
                            }
                        }
                    }
                `,
                fetchPolicy: 'network-only',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((data) => this.wrapperRoutineDayAPItoRoutineDay(data.data?.routineDays!)),
            );
    }

    getRoutineById(id: string): Observable<RoutineDay | undefined> {
        return this.apollo
            .query<{ routineDay: RoutineDay }>({
                query: gql`
                    query GetRoutineDay($id: String!) {
                        routineDay(id: $id) {
                            id
                            title
                            type
                            exercises {
                                order
                                exercise {
                                    id
                                    name
                                    category
                                }
                            }
                        }
                    }
                `,
                variables: {
                    id: id,
                },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((data) => {
                    return data.data?.routineDay;
                }),
            );
    }

    getRoutinesPlans(): Observable<any> {
        this.authSvc.user$.subscribe();
        return this.apollo.query({
            query: gql`
                query {
                    routinePlans {
                        id
                    }
                }
            `,
            fetchPolicy: 'network-only',
        });
    }

    getRoutinesByCategory(category: ExerciseCategory): Observable<any> {
        return this.apollo
            .query({
                query: gql`
                    query GetRoutines($category: ExerciseCategory!) {
                        routinesByCategory(input: { category: $category }) {
                            id
                            title
                            type
                        }
                    }
                `,
                variables: { category },
                fetchPolicy: 'network-only',
            })
            .pipe(
                map((res) => res.data),
                handleGraphqlError(this.authSvc),
            );
    }

    createRoutine(data: RoutineDayCreate): Observable<any> {
        const payload: RoutineDayCreateSend = this.createRoutinePayload(data);
        return this.apollo
            .mutate<RoutineDayCreate>({
                mutation: gql`
                    mutation createRoutineDay($createRoutineDayInput: CreateRoutineDayInput!) {
                        createRoutineDay(createRoutineDayInput: $createRoutineDayInput) {
                            id
                            title
                            type
                        }
                    }
                `,
                variables: {
                    createRoutineDayInput: payload,
                },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                tap((res) => console.log('Routine created successfully:', res)),
                // map((res) => res.data),
            );
    }

    wrapperRoutineDayAPItoRoutineDay(data: RoutineDayAPI[]): RoutineDay[] {
        return wrapperRoutineDayAPItoRoutineDay(data);
    }

    private createRoutinePayload(data: RoutineDayCreate): RoutineDayCreateSend {
        return wrapperRoutineDayCreateToPayload(data);
    }
}
