import { inject, Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private readonly apollo = inject(Apollo);

    getAllUsers(): Observable<any> {
        return this.apollo.query({
            query: gql`
                query GetAllUsers {
                    users {
                        id
                        name
                        email
                    }
                }
            `,
        });
    }
}
