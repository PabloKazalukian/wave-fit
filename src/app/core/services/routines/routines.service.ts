import { DestroyRef, inject, Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, filter, map, Observable, of, switchMap, tap } from 'rxjs';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { AuthService } from '../auth/auth.service';
import {
    RoutineDay,
    RoutineDayCreate,
    RoutineDayCreateSend,
} from '../../../shared/interfaces/routines.interface';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';
import { RoutinesApiService } from './api/routines-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoutinePlanAPI } from '../../../shared/interfaces/api/routines-api.interface';

@Injectable({
    providedIn: 'root',
})
export class RoutinesServices {
    private destroyRef = inject(DestroyRef);

    private routinesCache$ = new BehaviorSubject<RoutineDay[] | null>(null);
    routines$ = this.routinesCache$.pipe(filter((v): v is RoutineDay[] => v !== null));
    private loading = false;

    private readonly apollo = inject(Apollo);
    private readonly authSvc = inject(AuthService);
    private readonly api = inject(RoutinesApiService);

    getAllRoutines(): Observable<RoutineDay[] | null> {
        if (this.routinesCache$.value && this.routinesCache$.value && !this.loading) {
            // this.routines$.subscribe((e) => console.log(e));
            return this.routinesCache$.asObservable() as Observable<any[]>;
        }

        this.loading = true;

        return this.api.getRoutines().pipe(
            tap((res) => {
                this.loading = false;
                this.routinesCache$.next(res || []);
            }),
            switchMap(() => this.routinesCache$.asObservable()),
        );
    }

    //aqui
    getRoutineById(id: string): Observable<RoutineDay | undefined> {
        if (this.routinesCache$.value && !this.loading) {
            return of(this.routinesCache$.value.filter((routine) => routine.id === id)[0]);
        }
        return this.api.getRoutineById(id);
    }

    getRoutinesPlans(): Observable<any> {
        this.authSvc.user$.subscribe();
        return this.apollo
            .query<{ routinePlans: RoutinePlanAPI[] }>({
                query: gql`
                    query {
                        routinePlans {
                            id
                            name
                            description
                            weekly_distribution
                            routineDays {
                                id
                            }
                        }
                    }
                `,
            })
            .pipe(
                // tap(({ data }) => {
                // if (data) this.routinePlans.set(data.routinePlans);
                // }),
                handleGraphqlError(this.authSvc),
                map((res) => res.data?.routinePlans),
            );
    }

    getRoutinePlanById(id: string): Observable<RoutinePlanAPI | undefined> {
        return this.apollo
            .query<{ routinePlan: RoutinePlanAPI }>({
                query: gql`
                    query GetRoutinePlan($id: String!) {
                        routinePlan(id: $id) {
                            id
                            name
                            description
                            weekly_distribution
                        }
                    }
                `,
                variables: { id },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((res) => res.data?.routinePlan),
            );
    }

    // getRoutinesByCategory(category: ExerciseCategory): Observable<any> {
    //     return this.apollo
    //         .query({
    //             query: gql`
    //                 query GetRoutines($category: ExerciseCategory!) {
    //                     routinesByCategory(input: { category: $category }) {
    //                         id
    //                         title
    //                         type
    //                         exercises {
    //                             id
    //                             name
    //                             category
    //                         }
    //                     }
    //                 }
    //             `,
    //             variables: { category },
    //         })
    //         .pipe(
    //             map((res) => res.data),
    //             handleGraphqlError(this.authSvc),
    //         );
    // }

    getRoutinesByCategory(category: ExerciseCategory): Observable<RoutineDay[] | null> {
        return this.getAllRoutines().pipe(
            takeUntilDestroyed(this.destroyRef),
            // tap((e) => {
            //     console.log(e);
            // }),
            switchMap((list) =>
                of(list ? list.filter((r) => r.type?.includes(category) && r !== undefined) : null),
            ),
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

    private createRoutinePayload(data: RoutineDayCreate): RoutineDayCreateSend {
        return {
            title: data.title,
            type: data.type,
            exercises: data.exercises?.map((ex) => ex.id) as string[],
            planId: data.planId,
        };
    }

    // wrappedRoutineDayToSend(routine: RoutineDayVM[]): RoutineDayCreateSend | null {
    //     return this.getAllRoutines().subscribe((routines) => {
    //         return
    //     });
    // }
}
