import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed } from '@angular/core';
import { tap, switchMap, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private storageKey = 'auth_user';
    private tokenKey = 'token';

    constructor(private http: HttpClient) {}

    // Signals de estado
    user = signal<any | null>(this.getStoredUser());
    token = signal<string | null>(this.getStoredToken());
    isAuthenticated = computed(() => this.token() !== null);

    // Login local (mock)
    login(username: string, password: string): boolean {
        if (username === 'admin' && password === '1234') {
            const userData = { username };
            localStorage.setItem(this.storageKey, JSON.stringify(userData));
            this.user.set(userData);
            this.token.set('fake-token'); // simula un token válido
            localStorage.setItem(this.tokenKey, this.token()!);
            return true;
        }
        return false;
    }

    logout(): void {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.tokenKey);
        this.user.set(null);
        this.token.set(null);
    }

    // Llamada al backend con RxJS, resultado impacta en Signals
    getUser(): Observable<string> {
        return this.http.get('https://wavefit.test/sanctum/csrf-cookie').pipe(
            switchMap(() =>
                this.http.get('https://wavefit.test/api/user', {
                    headers: { Authorization: `Bearer ${this.token()}` },
                })
            ),
            tap((data: any) => {
                this.user.set(data);
            })
        );
    }

    saveToken(s: string) {}

    // Helpers privados
    private getStoredUser() {
        return JSON.parse(localStorage.getItem(this.storageKey) || 'null');
    }

    private getStoredToken() {
        return localStorage.getItem(this.tokenKey);
    }
}
