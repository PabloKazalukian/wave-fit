import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProfileUser } from '../../../shared/utils/profile.types';

@Injectable({
    providedIn: 'root',
})
export class UserProfileStateService {
    private userProfileSubject = new BehaviorSubject<ProfileUser | null>(null);
    readonly userProfile$ = this.userProfileSubject.asObservable();
    readonly userProfile = toSignal(this.userProfile$, { initialValue: null });

    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    getUserProfile(): ProfileUser | null {
        return this.userProfileSubject.value;
    }

    setUserProfile(profile: ProfileUser | null): void {
        this.userProfileSubject.next(profile);
    }

    setLoading(isLoading: boolean): void {
        this.loading.set(isLoading);
    }

    setError(error: string | null): void {
        this.error.set(error);
    }
}
