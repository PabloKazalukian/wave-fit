import { DestroyRef, inject, Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, delay, filter, map, Observable, of, switchMap, tap, from, firstValueFrom } from 'rxjs';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { AuthService } from '../auth/auth.service';
import {
    RoutineDay,
    RoutineDayCreate,
    RoutineDayCreateSend,
} from '../../../shared/interfaces/routines.interface';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';
import { RoutinesApiService } from './api/routines.api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoutinePlanAPI } from '../../../shared/interfaces/api/routines-api.interface';
import { NetworkStatusService } from '../network/network-status.service';
import { SyncQueueService } from '../sync/sync-queue.service';
import { IndexedDbStorageService } from '../storage/indexed-db.service';

@Injectable({
    providedIn: 'root',
})
export class RoutinesService {
    private destroyRef = inject(DestroyRef);

    private routinesCache$ = new BehaviorSubject<RoutineDay[] | null>(null);
    routines$ = this.routinesCache$.pipe(filter((v): v is RoutineDay[] => v !== null));
    private loading = false;
    private loadingRoutines$ = new BehaviorSubject<boolean>(false);

    private readonly apollo = inject(Apollo);
    private readonly authSvc = inject(AuthService);
    private readonly api = inject(RoutinesApiService);
    private readonly networkSvc = inject(NetworkStatusService);
    private readonly syncQueue = inject(SyncQueueService);
    private readonly idb = inject(IndexedDbStorageService);

    constructor() {
        this.syncQueue.registerHandler('CreateRoutineDay', async (mutation) => {
            const input = mutation.variables.createRoutineDayInput;
            const res = await firstValueFrom(this.apollo.mutate<{ createRoutineDay: RoutineDayCreate }>({
                mutation: gql`
                    mutation createRoutineDay($createRoutineDayInput: CreateRoutineDayInput!) {
                        createRoutineDay(createRoutineDayInput: $createRoutineDayInput) {
                            id
                            title
                            type
                        }
                    }
                `,
                variables: { createRoutineDayInput: input },
            }));
            return res.data?.createRoutineDay;
        });
    }

    private generateObjectId(): string {
        const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
        const randomHex = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => Math.floor(Math.random() * 16).toString(16));
        return (timestamp + randomHex).toLowerCase();
    }

    getAllRoutines(): Observable<RoutineDay[] | null> {
        this.loadingRoutines$.next(true);
        if (this.routinesCache$.value && !this.loading) {
            this.loadingRoutines$.next(false);
            return this.routinesCache$.asObservable();
        }

        return this.updateAllRoutines();
    }

    updateAllRoutines(): Observable<RoutineDay[] | null> {
        this.loading = true;

        return this.api.getRoutines().pipe(
            delay(500),
            tap((res) => {
                this.loading = false;
                this.loadingRoutines$.next(false);
                this.routinesCache$.next(res || []);
                if (res) this.idb.saveRoutines(res);
            }),
            switchMap(() => this.routinesCache$.asObservable()),
        );
    }

    get loadingRoutines(): Observable<boolean> {
        return this.loadingRoutines$.asObservable();
    }

    //aqui
    getRoutineById(id: string): Observable<RoutineDay | undefined> {
        if (this.routinesCache$.value && !this.loading) {
            return of(this.routinesCache$.value.filter((routine) => routine.id === id)[0]);
        }
        return this.api.getRoutineById(id);
    }

    getRoutinesPlans(): Observable<RoutinePlanAPI[] | undefined> {
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

    createRoutine(data: RoutineDayCreate): Observable<RoutineDayCreate | null | undefined> {
        const payload: RoutineDayCreateSend = this.createRoutinePayload(data);
        const newId = data.id || this.generateObjectId();

        if (this.networkSvc.isOnline()) {
            return this.apollo
                .mutate<{ createRoutineDay: RoutineDayCreate }>({
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
                    map((res) => res.data?.createRoutineDay),
                    tap((res) => {
                        if (res && this.routinesCache$.value) {
                            const current = this.routinesCache$.value;
                            this.routinesCache$.next([...current, res as any]);
                        }
                    })
                );
        } else {
            const pending = {
                id: newId,
                operationName: 'CreateRoutineDay',
                variables: { createRoutineDayInput: payload },
                status: 'pending' as const,
                createdAt: Date.now()
            };
            
            const optimisticRes = { ...data, id: newId };
            return from(this.syncQueue.enqueue(pending).then(() => {
                if (this.routinesCache$.value) {
                    const current = this.routinesCache$.value;
                    this.routinesCache$.next([...current, optimisticRes as any]);
                }
                return optimisticRes;
            }));
        }
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
