import { inject, Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { USER_PROFILE_CONTEXT } from '../../../apollo/user-profile.queries';
import { handleGraphqlError } from '../../../../shared/utils/handle-graphql-error';
import { AuthService } from '../../auth/auth.service';
import { ProfileUser } from '../../../../shared/utils/profile.types';

@Injectable({
    providedIn: 'root',
})
export class UserProfileApiService {
    private apollo = inject(Apollo);
    authSvc = inject(AuthService);

    getUserProfileContext(): Observable<ProfileUser> {
        return this.apollo
            .query<{ userProfileContext: ProfileUser }>({
                query: gql`
                    ${USER_PROFILE_CONTEXT}
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                map((res) => res.data?.userProfileContext || ({} as ProfileUser)),
                handleGraphqlError(this.authSvc),
            );
    }
}
