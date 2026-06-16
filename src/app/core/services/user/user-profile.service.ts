import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { UserProfileDomainService } from './user-profile.domain';
import { UserProfileStateService } from './user-profile.state';
import { AuthService } from '../auth/auth.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ProfileUser } from '../../../shared/utils/profile.types';

@Injectable({
    providedIn: 'root',
})
export class UserProfileService {
    private destroyRef = inject(DestroyRef);
    private domain = inject(UserProfileDomainService);
    private state = inject(UserProfileStateService);
    private authService = inject(AuthService);

    user$ = toSignal(this.authService.user$);

    readonly userProfile = this.state.userProfile;
    readonly userProfile$ = this.state.userProfile$;
    readonly loading = this.state.loading;
    readonly error = this.state.error;

    constructor() {
        effect(() => {
            const user = this.user$();
            if (user) {
                this.initUserProfile();
            } else {
                this.state.setUserProfile(null);
            }
        });
    }

    private initUserProfile() {
        if (this.state.getUserProfile()) {
            return;
        }

        this.domain.initUserProfile()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }
    
    // For manual refreshing if needed
    fetchUserProfile(): Observable<ProfileUser | null> {
        return this.domain.initUserProfile();
    }
}
