import { Injectable, signal, computed } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { tap, Observable, BehaviorSubject, catchError, map, of } from 'rxjs';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';

export interface LoginResponse {
    data: any;
    loading: boolean;
}

export interface MeResponse {
    me: {
        id: string;
        email: string;
        role: string;
    };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private storageKey = 'auth_user';
    private tokenKey = 'token';

    constructor(private apollo: Apollo) {}

    // Signals de estado
    user = signal<any | null>(this.getStoredUser());
    token = signal<string | null>(this.getStoredToken());

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.getAuthenticated());
    isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
    isAuthenticated = computed(() => this.token() !== null);

    private userIdSubject = new BehaviorSubject<string | null>(this.user()?.id || null);
    user$ = this.userIdSubject.asObservable();

    login(identifier: string, password: string) {
        return this.apollo
            .mutate<{ login: string }>({
                mutation: gql`
                    mutation Login($identifier: String!, $password: String!) {
                        login(identifier: $identifier, password: $password)
                    }
                `,
                variables: { identifier, password },
            })
            .pipe(
                tap((res) => {
                    const token = res.data?.login;
                    if (!token) throw new Error('Token no recibido');

                    this.token.set(token);
                    localStorage.setItem(this.tokenKey, token);
                    this.isAuthenticatedSubject.next(true);
                }),
                map(() => true),
                catchError((err) => {
                    return of(false);
                })
            );
    }

    me(): Observable<MeResponse['me'] | undefined> {
        return this.apollo
            .query<{ me: MeResponse['me'] }>({
                query: gql`
                    query Me {
                        me {
                            id
                            email
                            role
                        }
                    }
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                tap(({ data }) => {
                    this.user.set({
                        id: data?.me.id || null,
                        email: data?.me.email || null,
                        role: data?.me.role || null,
                    });
                    this.setStoredUser(this.user());
                }),
                handleGraphqlError(this), // ahora correctamente tipado
                map((res) => {
                    return res.data?.me;
                })
            );
    }

    logout(): void {
        this.clearSession();
    }

    saveToken(s: string) {}

    // ✅ --- Helpers ---
    private getStoredUser(): any | null {
        const data = localStorage.getItem(this.storageKey);
        console.log('Stored user data:', data);
        return data ? JSON.parse(data) : null;
    }

    private setStoredUser(user: any): void {
        localStorage.setItem(this.storageKey, JSON.stringify(user));
    }

    private getStoredToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    private getAuthenticated(): boolean {
        return !!this.getStoredToken();
    }

    private clearSession() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.storageKey);
        this.user.set(null);
        this.token.set(null);
        this.isAuthenticatedSubject.next(false);
    }

    // checkAuth(): Promise<void> {
    //     const token = localStorage.getItem('token');
    //     if (!token) {
    //         console.log('No token found, clearing session.');
    //         this.user.set(null);
    //         return Promise.resolve();
    //     }

    //     return new Promise((resolve) => {
    //         this.apollo
    //             .watchQuery({
    //                 query: gql`
    //                     query Me {
    //                         me {
    //                             id
    //                             email
    //                             role
    //                         }
    //                     }
    //                 `,
    //             })
    //             .valueChanges.subscribe({
    //                 next: (res) => {
    //                     this.user.set(res);
    //                     resolve();
    //                 },
    //                 error: () => {
    //                     localStorage.removeItem('token');
    //                     this.user.set(null);
    //                     resolve();
    //                 },
    //             });
    //     });
    // }
}
