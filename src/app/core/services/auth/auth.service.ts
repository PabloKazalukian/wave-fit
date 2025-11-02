import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { tap, switchMap, Observable, BehaviorSubject, catchError, map, of } from 'rxjs';

export interface LoginResponse {
    data: any;
    loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private storageKey = 'auth_user';
    private tokenKey = 'token';

    // constructor(private http: HttpClient) {}
    constructor(private apollo: Apollo) {}

    // Signals de estado
    user = signal<any | null>(this.getStoredUser());
    token = signal<string | null>(this.getStoredToken());
    // isAuthenticated = signal<boolean>(this.getAuthenticated());
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.getAuthenticated());
    isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
    isAuthenticated = computed(() => this.token() !== null);

    // Login local (mock)
    // login(username: string, password: string): boolean {
    //     if (username === 'admin' && password === '1234') {
    //         const userData = { username };
    //         localStorage.setItem(this.storageKey, JSON.stringify(userData));
    //         this.user.set(userData);
    //         this.token.set('fake-token'); // simula un token válido
    //         localStorage.setItem(this.tokenKey, this.token()!);
    //         this.isAuthenticatedSubject.next(true);

    //         return true;
    //     }
    //     return false;
    // }

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
                    console.error('Error en login GraphQL:', err);
                    return of(false);
                })
            );
    }

    logout(): void {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.tokenKey);
        this.user.set(null);
        this.token.set(null);
        this.isAuthenticatedSubject.next(false);
    }

    // Llamada al backend con RxJS, resultado impacta en Signals
    // getUser(): Observable<string> {
    //     return this.http.get('https://wavefit.test/sanctum/csrf-cookie').pipe(
    //         switchMap(() =>
    //             this.http.get('https://wavefit.test/api/user', {
    //                 headers: { Authorization: `Bearer ${this.token()}` },
    //             })
    //         ),
    //         tap((data: any) => {
    //             this.user.set(data);
    //         })
    //     );
    // }

    saveToken(s: string) {}

    // // Helpers privados
    // private getStoredUser() {
    //     return JSON.parse(localStorage.getItem(this.storageKey) || 'null');
    // }

    // private getAuthenticated() {
    //     return this.token() !== null;
    // }

    // private getStoredToken() {
    //     return localStorage.getItem(this.tokenKey);
    // }

    // ✅ --- Helpers ---
    private getStoredUser(): any | null {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
    }

    private getStoredToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    private getAuthenticated(): boolean {
        return !!this.getStoredToken();
    }

    clearSession() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.storageKey);
        this.user.set(null);
        this.token.set(null);
        this.isAuthenticatedSubject.next(false);
    }
}
