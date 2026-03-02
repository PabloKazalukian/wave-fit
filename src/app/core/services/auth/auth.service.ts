import { Injectable, signal, computed, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { tap, Observable, BehaviorSubject, catchError, map, of, throwError, timeout } from 'rxjs';
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
        email: string;
        role: string;
    };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private apollo = inject(Apollo);
    private tokenStorage = inject(TokenStorage);

    // Signals de estado
    user = signal<any | null>(this.tokenStorage.getUser());
    token = signal<string | null>(this.tokenStorage.getToken());

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.tokenStorage.hasToken());
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
                    this.tokenStorage.setToken(token);
                    this.isAuthenticatedSubject.next(true);
                }),
                map(() => true),
                catchError(() => {
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
                            email
                            role
                        }
                    }
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                timeout(5000), // 5 segundos máximo
                tap(({ data }) => {
                    this.user.set(data?.me ?? null);
                    this.tokenStorage.setUser(this.user());
                }),
                map((res) => res.data?.me),
                catchError((err) => {
                    return throwError(() => err);
                }),
            );
    }

    logout(): void {
        this.clearSession();
    }

    register(name: string, email: string, password: string) {
        return this.apollo
            .mutate<{ register: string }>({
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
                tap((res) => {
                    const token = res.data?.register;
                    if (!token) throw new Error('Token no recibido');

                    this.token.set(token);
                    this.tokenStorage.setToken(token);
                    this.isAuthenticatedSubject.next(true);
                }),
                map(() => true),
                catchError(() => {
                    return of(false);
                }),
            );
    }

    isEmailAvailable(email: string) {
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
                            access_token
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
                    const token = res.data?.loginWithGoogle.access_token;
                    if (!token) throw new Error('Token no recibido');

                    this.token.set(token);
                    this.tokenStorage.setToken(token);
                    this.isAuthenticatedSubject.next(true);
                }),
                handleGraphqlError(this),
                catchError(() => {
                    return of(false);
                }),
            );
    }

    hasToken(): boolean {
        return this.tokenStorage.hasToken();
    }

    clearSession() {
        this.tokenStorage.clear();
        this.user.set(null);
        this.token.set(null);
        this.isAuthenticatedSubject.next(false);
    }
}
