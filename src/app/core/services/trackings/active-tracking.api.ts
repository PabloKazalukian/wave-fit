import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { AuthService } from '../auth/auth.service';
import { ActiveTrackingAPI } from '../../../shared/interfaces/api/day-log-api.interface';
import { ActiveTrackingVM } from '../../../shared/interfaces/day-log.interface';
import { wrapperActiveTrackingApiToVM } from '../../../shared/wrappers/day-log.wrapper';
import { ACTIVE_TRACKING } from '../../apollo/day-log.queries';

/**
 * Fuente de verdad de arranque compartida entre week-log y day-log.
 * `activeTracking` responde si hay un tracking activo y de qué tipo
 * ("WEEK_LOG" | "DAY_LOG") con el contenedor correspondiente.
 */
@Injectable({
    providedIn: 'root',
})
export class ActiveTrackingApi {
    private readonly apollo = inject(Apollo);
    private readonly authSvc = inject(AuthService);

    getActiveTracking(): Observable<ActiveTrackingVM> {
        return this.apollo
            .query<{ activeTracking: ActiveTrackingAPI }>({
                query: ACTIVE_TRACKING,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) => wrapperActiveTrackingApiToVM(data?.activeTracking)),
            );
    }
}
