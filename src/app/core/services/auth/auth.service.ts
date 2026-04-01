import { Injectable, signal, computed, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import {
    tap,
    Observable,
    BehaviorSubject,
    catchError,
    map,
    of,
    throwError,
    timeout,
    switchMap,
} from 'rxjs';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { LoginWithGoogle } from '../../../shared/interfaces/auth.interface';
import { TokenStorage } from '../../auth/token.storage';

export interface LoginResponse {
    data: any;
    loading: boolean;
}

export interface MeResponse {
    me: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private apollo = inject(Apollo);
    private tokenStorage = inject(TokenStorage);

    user = signal<any | null>(this.tokenStorage.getUser());

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.user() !== null);
    isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
    isAuthenticated = computed(() => this.user() !== null);

    private userIdSubject = new BehaviorSubject<string | null>(this.user()?.id || null);
    user$ = this.userIdSubject.asObservable();

    login(identifier: string, password: string) {
        return this.apollo
            .mutate<{ login: boolean }>({
                mutation: gql`
                    mutation Login($identifier: String!, $password: String!) {
                        login(identifier: $identifier, password: $password)
                    }
                `,
                variables: { identifier, password },
            })
            .pipe(
                switchMap((res) => {
                    const success = res.data?.login;
                    if (!success) throw new Error('Login fallido');
                    this.isAuthenticatedSubject.next(true);
                    return this.me();
                }),
                map(() => true),
                catchError((err) => {
                    console.error('Login error:', err);
                    return of(false);
                }),
            );
    }

    me(): Observable<MeResponse['me'] | undefined> {
        return this.apollo
            .query<{ me: MeResponse['me'] }>({
                query: gql`
                    query Me {
                        me {
                            id
                            name
                            email
                            role
                        }
                    }
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                timeout(5000),
                tap(({ data }) => {
                    this.user.set(data?.me ?? null);
                    this.userIdSubject.next(data?.me?.id ?? null);
                    this.tokenStorage.setUser(this.user());
                    this.isAuthenticatedSubject.next(this.user() !== null);
                }),
                map((res) => res.data?.me),
                catchError((err) => {
                    this.clearSession();
                    return throwError(() => err);
                }),
            );
    }

    logout(): void {
        this.apollo
            .mutate({
                mutation: gql`
                    mutation Logout {
                        logout
                    }
                `,
            })
            .subscribe({
                next: () => this.clearSession(),
                error: () => this.clearSession(),
            });
    }

    register(name: string, email: string, password: string): Observable<boolean> {
        return this.apollo
            .mutate<{ createUser: any }>({
                mutation: gql`
                    mutation CreateUser($createUserInput: CreateUserInput!) {
                        createUser(createUserInput: $createUserInput) {
                            id
                            name
                            email
                        }
                    }
                `,
                variables: { createUserInput: { name, email, password } },
            })
            .pipe(
                handleGraphqlError(this),
                tap(() => {
                    // After registration, we might need a login or the backend might set the cookie automatically
                    // Assuming for now the user needs to login or we call me()
                }),
                map(() => true),
                catchError(() => {
                    return of(false);
                }),
            );
    }

    isEmailAvailable(email: string): Observable<boolean | undefined> {
        return this.apollo
            .query<{ isEmailAvailable: boolean }>({
                query: gql`
                    query IsEmailAvailable($email: String!) {
                        isEmailAvailable(email: $email)
                    }
                `,
                variables: { email },
            })
            .pipe(
                handleGraphqlError(this),
                map((res) => res.data?.isEmailAvailable),
            );
    }

    loginWithGoogle(code: string, codeVerifier: string) {
        return this.apollo
            .mutate<{ loginWithGoogle: LoginWithGoogle }>({
                mutation: gql`
                    mutation LoginWithGoogle($code: String!, $codeVerifier: String!) {
                        loginWithGoogle(code: $code, codeVerifier: $codeVerifier) {
                            user {
                                id
                                name
                                email
                            }
                        }
                    }
                `,
                variables: {
                    code,
                    codeVerifier,
                },
            })
            .pipe(
                tap((res) => {
                    const user = res.data?.loginWithGoogle.user!;
                    this.userIdSubject.next(user?.id);
                    this.tokenStorage.setUser(user);
                    this.user.set(user);
                    this.isAuthenticatedSubject.next(true);
                }),
                handleGraphqlError(this),
                catchError(() => {
                    return of(false);
                }),
            );
    }

    hasSession(): boolean {
        return this.user() !== null;
    }

    clearSession() {
        this.tokenStorage.clear();
        this.user.set(null);
        this.isAuthenticatedSubject.next(false);
    }
}
