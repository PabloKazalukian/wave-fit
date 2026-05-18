import { Injectable, inject } from '@angular/core';
import { User } from '../../shared/interfaces/token.interface';
import { IndexedDbStorageService } from '../services/storage/indexed-db.service';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
    private indexedDb = inject(IndexedDbStorageService);
    private readonly AUTH_KEY = 'current';

    async getUser(): Promise<User | null> {
        try {
            const authUser = await this.indexedDb.db.authUser.get(this.AUTH_KEY);
            if (authUser) {
                return {
                    id: authUser.userId,
                    name: authUser.name,
                    email: authUser.email,
                    role: authUser.role,
                };
            }
            return null;
        } catch (error) {
            console.error('Error reading user from IndexedDB:', error);
            return null;
        }
    }

    async setUser(user: User | null): Promise<void> {
        try {
            if (user) {
                await this.indexedDb.db.authUser.put({
                    id: this.AUTH_KEY,
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                });
            } else {
                await this.clear();
            }
        } catch (error) {
            console.error('Error saving user to IndexedDB:', error);
        }
    }

    async clear(): Promise<void> {
        try {
            await this.indexedDb.db.authUser.delete(this.AUTH_KEY);
        } catch (error) {
            console.error('Error clearing user from IndexedDB:', error);
        }
    }
}
