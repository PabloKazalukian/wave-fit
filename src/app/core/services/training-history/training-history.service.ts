import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map, tap } from 'rxjs';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { AuthService } from '../auth/auth.service';
import { GET_TRAINING_CALENDAR } from '../../apollo/training-history.queries';
import {
    TrainingCalendarResponse,
    TrainingCalendarInput,
} from '../../../shared/interfaces/training-history.interface';

@Injectable({ providedIn: 'root' })
export class TrainingHistoryService {
    private readonly apollo = inject(Apollo);
    private readonly authSvc = inject(AuthService);

    getTrainingCalendar(year: number, month: number): Observable<TrainingCalendarResponse> {
        const input: TrainingCalendarInput = {
            year,
            month: month + 1,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        return this.apollo
            .query<{ trainingCalendar: TrainingCalendarResponse }>({
                query: GET_TRAINING_CALENDAR,
                variables: { input },
                fetchPolicy: 'network-only',
            })
            .pipe(
                tap((res) => console.log(res)),
                handleGraphqlError(this.authSvc),
                map((res) => res.data!.trainingCalendar),
            );
    }
}
