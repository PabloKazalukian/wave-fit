import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private storageKey = 'auth_user';
    private tokenKey = 'token';

    constructor(private apollo: Apollo) {}

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
