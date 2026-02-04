import { inject, Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';

@Injectable({
    providedIn: 'root',
})
export class PlanTrankingApi {
    private readonly apollo = inject(Apollo);

    getTracking() {
        return this.apollo.query({
            query: gql`
                query {
                    plans {
                        id
                        name
                        description
                        duration
                    }
                }
            `,
            fetchPolicy: 'no-cache',
        });
    }
}
