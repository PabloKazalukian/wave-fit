import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { AuthService } from '../auth/auth.service';
import {
    DayPlan,
    RoutineDayCreate,
    RoutineDayCreateSend,
} from '../../../shared/interfaces/routines.interface';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';

@Injectable({
    providedIn: 'root',
})
export class RoutinesServices {
    constructor(private apollo: Apollo, private authSvc: AuthService) {}

    getRoutinesPlans(): Observable<any> {
        this.authSvc.user$.subscribe((userId) => {});
        return this.apollo.query({
            query: gql`
                query {
                    routinePlans {
                        id
                    }
                }
            `,
        });
    }

    getRoutines(): Observable<any> {
        return this.apollo
            .query({
                query: gql``,
            })
            .pipe(handleGraphqlError(this.authSvc));
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
            })
            .pipe(
                map((res) => res.data),
                handleGraphqlError(this.authSvc)
            );
    }

    createRoutinePlan(data: any): Observable<any> {
        return this.apollo.mutate({
            mutation: gql`
            mutation {
            
            }
            `,
        });
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
                tap((res) => console.log('Routine created successfully:', res))
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

    // Contrato: GET /api/routines?type=CHEST
    getRoutinesByType(type: string): Observable<any[]> {
        if (!type) return of([]);
        // Descomentar request real cuando exista:
        // return this.http.get<RoutineSummary[]>(`/api/routines?type=${type}`);

        // MOCK:
        const mock: any[] = [
            {
                id: 'r1',
                title: 'Pecho volumen - 45min',
                type: 'CHEST',
                durationMinutes: 45,
                difficulty: 'medium',
            },
            {
                id: 'r2',
                title: 'Pecho fuerza - 60min',
                type: 'CHEST',
                durationMinutes: 60,
                difficulty: 'hard',
            },
        ];
        return of(mock).pipe(
            map((list) => list.filter((l) => l.type === type)),
            catchError(() => of([]))
        );
    }

    saveWeeklyPlan(payload: { name: string; description?: string; days: DayPlan[] }) {
        // POST /api/weekly-plans
        // return this.http.post('/api/weekly-plans', payload);
        return of({ ok: true, id: 'new-plan-id' });
    }
}
