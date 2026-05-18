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
import { User } from '../../../shared/interfaces/token.interface';
import { Router } from '@angular/router';

export interface LoginResponse {
    login: boolean;
    loading?: boolean;
}

export interface CreateUserResponse {
    id: string;
    name: string;
    email: string;
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
    private readonly router = inject(Router);

    user = signal<User | null>(null);

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
    isAuthenticated = computed(() => this.user() !== null);

    private userIdSubject = new BehaviorSubject<string | null>(null);
    user$ = this.userIdSubject.asObservable();

    async initializeUserFromStorage() {
        const storedUser = await this.tokenStorage.getUser();
        if (storedUser) {
            this.user.set(storedUser);
            this.userIdSubject.next(storedUser.id);
            this.isAuthenticatedSubject.next(true);
        }
    }

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

    me(): Observable<MeResponse['me'] | null | undefined> {
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
                timeout(2000),
                switchMap(async (res) => {
                    console.log(res);
                    const me = res.data?.me ?? null;
                    this.user.set(me);
                    this.userIdSubject.next(me?.id ?? null);
                    await this.tokenStorage.setUser(me);
                    this.isAuthenticatedSubject.next(me !== null);
                    return me;
                }),
                catchError((err) => {
                    // Solo limpiamos la sesión si es un error de autenticación explícito (ej: 401, UNAUTHORIZED, UNAUTHENTICATED)
                    // Si es un error de red, de timeout o cualquier otro error temporal, mantenemos el estado actual para modo offline.
                    // El errorLink global en main.ts ya se encarga de hacer logout y clearSession si detecta 401/UNAUTHORIZED real.
                    const isExplicitUnauthorized = 
                        err?.message?.includes('UNAUTHENTICATED') || 
                        err?.message?.includes('UNAUTHORIZED') || 
                        err?.networkError?.status === 401 ||
                        err?.graphQLErrors?.some((gErr: any) => 
                            gErr.extensions?.code === 'UNAUTHENTICATED' || 
                            gErr.extensions?.code === 'UNAUTHORIZED'
                        );

                    if (isExplicitUnauthorized) {
                        console.error('Explicit auth error in me(), clearing session:', err);
                        this.clearSession();
                        return throwError(() => err);
                    }

                    console.warn('Non-auth or network/timeout/SW error in me(), keeping offline session:', err);
                    return of(this.user() || undefined);
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
                next: async () => {
                    await this.clearSession();
                    this.router.navigate(['/auth/login']);
                },
                error: async () => {
                    await this.clearSession();
                    this.router.navigate(['/auth/login']);
                },
            });
    }

    register(name: string, email: string, password: string): Observable<boolean> {
        return this.apollo
            .mutate<{ createUser: CreateUserResponse }>({
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
                switchMap(async (res) => {
                    const user = res.data?.loginWithGoogle.user ?? null;
                    if (user) {
                        this.user.set(user);
                        this.userIdSubject.next(user.id);
                        await this.tokenStorage.setUser(user);
                        this.isAuthenticatedSubject.next(true);
                    }
                    return res;
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

    async clearSession() {
        await this.tokenStorage.clear();
        this.user.set(null);
        this.isAuthenticatedSubject.next(false);
    }
}
