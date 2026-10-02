import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { AuthService } from '../auth/auth.service';
import {
    GET_STATS_1RM_WEEKLY,
    GET_STATS_CALORIES_WEEKLY,
    GET_STATS_EXERCISE_TREND,
    GET_STATS_FORGOTTEN_MUSCLES,
    GET_STATS_VOLUME_TOTAL_WEEKLY,
    GET_STATS_VOLUME_WEEKLY,
} from '../../apollo/stats-insights.queries';
import {
    CaloriesWeekAPI,
    ExerciseTrendAPI,
    ForgottenMuscleAPI,
    OneRmExerciseAPI,
    VolumeTotalWeekAPI,
    VolumeWeekAPI,
} from '../../../shared/interfaces/api/stats-charts-api.interface';
import {
    CaloriesWeekVM,
    ExerciseTrendVM,
    ForgottenMuscleVM,
    OneRmExerciseVM,
    StatsInsightsQueryInput,
    VolumeTotalWeekVM,
    VolumeWeekVM,
} from '../../../shared/interfaces/stats-insights.interface';
import {
    wrapperStats1RmWeeklyToVM,
    wrapperStatsCaloriesWeeklyToVM,
    wrapperStatsExerciseTrendToVM,
    wrapperStatsForgottenMusclesToVM,
    wrapperStatsVolumeTotalWeeklyToVM,
    wrapperStatsVolumeWeeklyToVM,
} from '../../../shared/wrappers/stats-insights.wrapper';

/**
 * Seis getters de una línea cada uno, al estilo de `StatsService`.
 *
 * A diferencia de `/stats` (snapshots pre-computados por el worker), estas seis
 * queries se agregan on demand para el rango elegido: por eso todas llevan
 * `fetchPolicy: 'network-only'` y el input del usuario, y por eso no hay
 * `forkJoin` ni patas opcionales — cada sección se carga y falla por separado.
 */
@Injectable({ providedIn: 'root' })
export class StatsInsightsService {
    private readonly apollo = inject(Apollo);
    private readonly authSvc = inject(AuthService);

    getOneRmWeekly(input: StatsInsightsQueryInput): Observable<OneRmExerciseVM[]> {
        return this.apollo
            .query<{ getStats1RmWeekly: OneRmExerciseAPI[] }>({
                query: GET_STATS_1RM_WEEKLY,
                variables: { input },
                fetchPolicy: 'network-only',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((res) => wrapperStats1RmWeeklyToVM(res.data!.getStats1RmWeekly)),
            );
    }

    getVolumeWeekly(input: StatsInsightsQueryInput): Observable<VolumeWeekVM[]> {
        return this.apollo
            .query<{ getStatsVolumeWeekly: VolumeWeekAPI[] }>({
                query: GET_STATS_VOLUME_WEEKLY,
                variables: { input },
                fetchPolicy: 'network-only',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((res) => wrapperStatsVolumeWeeklyToVM(res.data!.getStatsVolumeWeekly)),
            );
    }

    getVolumeTotalWeekly(input: StatsInsightsQueryInput): Observable<VolumeTotalWeekVM[]> {
        return this.apollo
            .query<{ getStatsVolumeTotalWeekly: VolumeTotalWeekAPI[] }>({
                query: GET_STATS_VOLUME_TOTAL_WEEKLY,
                variables: { input },
                fetchPolicy: 'network-only',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((res) =>
                    wrapperStatsVolumeTotalWeeklyToVM(res.data!.getStatsVolumeTotalWeekly),
                ),
            );
    }

    getCaloriesWeekly(input: StatsInsightsQueryInput): Observable<CaloriesWeekVM[]> {
        return this.apollo
            .query<{ getStatsCaloriesWeekly: CaloriesWeekAPI[] }>({
                query: GET_STATS_CALORIES_WEEKLY,
                variables: { input },
                fetchPolicy: 'network-only',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((res) => wrapperStatsCaloriesWeeklyToVM(res.data!.getStatsCaloriesWeekly)),
            );
    }

    getForgottenMuscles(input: StatsInsightsQueryInput): Observable<ForgottenMuscleVM[]> {
        return this.apollo
            .query<{ getStatsForgottenMuscles: ForgottenMuscleAPI[] }>({
                query: GET_STATS_FORGOTTEN_MUSCLES,
                variables: { input },
                fetchPolicy: 'network-only',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((res) => wrapperStatsForgottenMusclesToVM(res.data!.getStatsForgottenMuscles)),
            );
    }

    getExerciseTrend(input: StatsInsightsQueryInput): Observable<ExerciseTrendVM[]> {
        return this.apollo
            .query<{ getStatsExerciseTrend: ExerciseTrendAPI[] }>({
                query: GET_STATS_EXERCISE_TREND,
                variables: { input },
                fetchPolicy: 'network-only',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((res) => wrapperStatsExerciseTrendToVM(res.data!.getStatsExerciseTrend)),
            );
    }
}
