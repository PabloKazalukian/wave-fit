import { inject, Injectable } from '@angular/core';
import { ApolloErrorMessageHandler } from '@apollo/client/utilities/invariant';
import { AuthService } from '../auth/auth.service';
import { map, Observable, tap } from 'rxjs';
import { Apollo } from 'apollo-angular';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { GENERATE_PLAN } from '../../apollo/coach.query';

@Injectable({
    providedIn: 'root',
})
export class CoachService {
    private readonly apollo = inject(Apollo);

    authSvc = inject(AuthService);

    generatePlan(): Observable<any | undefined | null> {
        console.log('woek');
        return this.apollo
            .mutate<{ generatePlan: any }>({
                mutation: GENERATE_PLAN,
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                tap({ next: (data) => console.log(data) }),
                map(({ data }) => (data?.generatePlan ? data.generatePlan : null)),
            );
    }
}
