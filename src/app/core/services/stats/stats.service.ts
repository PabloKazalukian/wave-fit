import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { AuthService } from '../auth/auth.service';
import { RoutinesService } from '../routines/routines.service';
import {
    GET_ADHERENCE,
    GET_PERSONAL_RECORDS,
    GET_TOP_EXERCISES,
    GET_TOP_ROUTINES,
} from '../../apollo/stats.queries';
import {
    AdherenceStatsAPI,
    PersonalRecordsStatsAPI,
    TopExercisesStatsAPI,
    TopRoutinesStatsAPI,
} from '../../../shared/interfaces/api/stats-api.interface';
import {
    AdherenceVM,
    PersonalRecordsVM,
    TopExercisesVM,
    TopRoutinesVM,
} from '../../../shared/interfaces/stats.interface';
import {
    resolveRoutineNames,
    wrapperAdherenceApiToVM,
    wrapperPersonalRecordsApiToVM,
    wrapperTopExercisesApiToVM,
    wrapperTopRoutinesApiToVM,
} from '../../../shared/wrappers/stats.wrapper';

@Injectable({ providedIn: 'root' })
export class StatsService {
    private readonly apollo = inject(Apollo);
    private readonly authSvc = inject(AuthService);
    private readonly routinesSvc = inject(RoutinesService);

    getTopExercises(): Observable<TopExercisesVM> {
        return this.apollo
            .query<{ getTopExercises: TopExercisesStatsAPI }>({
                query: GET_TOP_EXERCISES,
                fetchPolicy: 'network-only',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((res) => wrapperTopExercisesApiToVM(res.data!.getTopExercises)),
            );
    }

    getTopRoutines(): Observable<TopRoutinesVM> {
        return forkJoin({
            stats: this.apollo
                .query<{ getTopRoutines: TopRoutinesStatsAPI }>({
                    query: GET_TOP_ROUTINES,
                    fetchPolicy: 'network-only',
                })
                .pipe(handleGraphqlError(this.authSvc)),
            plans: this.routinesSvc.getRoutinesPlans().pipe(catchError(() => of(undefined))),
        }).pipe(
            map(({ stats, plans }) => {
                const vm = wrapperTopRoutinesApiToVM(stats.data!.getTopRoutines);
                return { ...vm, routines: resolveRoutineNames(vm.routines, plans) };
            }),
        );
    }

    getPersonalRecords(): Observable<PersonalRecordsVM> {
        return this.apollo
            .query<{ getPersonalRecords: PersonalRecordsStatsAPI }>({
                query: GET_PERSONAL_RECORDS,
                fetchPolicy: 'network-only',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((res) => wrapperPersonalRecordsApiToVM(res.data!.getPersonalRecords)),
            );
    }

    getAdherence(): Observable<AdherenceVM> {
        return this.apollo
            .query<{ getAdherence: AdherenceStatsAPI }>({
                query: GET_ADHERENCE,
                fetchPolicy: 'network-only',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((res) => wrapperAdherenceApiToVM(res.data!.getAdherence)),
            );
    }
}
