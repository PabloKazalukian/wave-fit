import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { catchError, map, Observable, of } from 'rxjs';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { AuthService } from '../auth/auth.service';
import { DayPlan } from '../../../shared/interfaces/routines.interface';

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
    getRoutinesByCategory(category: string): Observable<any> {
        return this.apollo
            .query({
                query: gql`
                    query {
                        routinesByCategory(input: { category: "${category}" }) {
                            id
                            title
                            type
                        }
                    }
                `,
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
