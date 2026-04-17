import { Injectable } from '@angular/core';
import { User } from '../../shared/interfaces/token.interface';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
    private readonly userKey = 'auth_user';

    getUser(): User | null {
        const data = localStorage.getItem(this.userKey);
        try {
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    setUser(user: User | null): void {
        if (user) {
            localStorage.setItem(this.userKey, JSON.stringify(user));
        } else {
            this.clear();
        }
    }

    clear(): void {
        localStorage.removeItem(this.userKey);
    }
}
