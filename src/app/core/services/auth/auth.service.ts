import { Injectable, signal, computed, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { tap, Observable, BehaviorSubject, catchError, map, of } from 'rxjs';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { LoginWithGoogle } from '../../../shared/interfaces/auth.interface';

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

    private apollo = inject(Apollo);

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
                }),
            );
    }

    logout(): void {
        this.clearSession();
    }

    // saveToken(s: string) {}

    loginWithGoogle(code: string, codeVerifier: string) {
        // return true;
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
                    localStorage.setItem(this.tokenKey, token);
                    this.isAuthenticatedSubject.next(true);
                }),
                handleGraphqlError(this),
                catchError(() => {
                    // console.error(err);
                    return of(false);
                }),
            );
    }

    // ✅ --- Helpers ---
    private getStoredUser(): any | null {
        const data = localStorage.getItem(this.storageKey);
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
}
