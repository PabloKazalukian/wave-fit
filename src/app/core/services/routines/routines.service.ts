import { DestroyRef, inject, Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, delay, filter, map, Observable, of, switchMap, tap } from 'rxjs';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { AuthService } from '../auth/auth.service';
import {
    RoutineDay,
    RoutineDayCreate,
    RoutineDayCreateSend,
} from '../../../shared/interfaces/routines.interface';
import { ExerciseCategory, ExerciseSend } from '../../../shared/interfaces/exercise.interface';
import { RoutinesApiService } from './api/routines-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoutinePlanAPI } from '../../../shared/interfaces/api/routines-api.interface';
import { da } from 'date-fns/locale';

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
        if (this.routinesCache$.value && !this.loading) {
            return this.routinesCache$.asObservable() as Observable<any[]>;
        }

        return this.updateAllRoutines();
    }

    updateAllRoutines(): Observable<RoutineDay[] | null> {
        this.loading = true;

        return this.api.getRoutines().pipe(
            delay(2000),
            tap((res) => {
                this.loading = false;
                console.log(res);
                console.log(this.routines$);
                this.routinesCache$.next(res || []);
            }),
            tap((res) => console.log(res)),
            switchMap(() => this.routinesCache$.asObservable()),
            tap((res) => console.log(this.routinesCache$)),
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

    getRoutinesByCategory(category: ExerciseCategory): Observable<RoutineDay[] | null> {
        return this.getAllRoutines().pipe(
            takeUntilDestroyed(this.destroyRef),
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
            .pipe(handleGraphqlError(this.authSvc));
    }

    private createRoutinePayload(data: RoutineDayCreate): RoutineDayCreateSend {
        return {
            title: data.title,
            type: data.type,
            exercises:
                data.exercises?.map((ex, index) => ({ exercise: ex.id!, order: index })) || [],
            planId: data.planId,
        };
    }

    // wrappedRoutineDayToSend(routine: RoutineDayVM[]): RoutineDayCreateSend | null {
    //     return this.getAllRoutines().subscribe((routines) => {
    //         return
    //     });
    // }
}
