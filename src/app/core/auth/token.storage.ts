import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
    private readonly tokenKey = 'token';
    private readonly userKey = 'auth_user';

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    setToken(token: string): void {
        localStorage.setItem(this.tokenKey, token);
    }

    getUser(): any | null {
        const data = localStorage.getItem(this.userKey);
        try {
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    setUser(user: any): void {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    clear(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    hasToken(): boolean {
        return !!this.getToken();
    }
}
