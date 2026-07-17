import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../../../../core/services/auth/auth.service';
import { UserProfileService } from '../../../../../../core/services/user/user-profile.service';
import { CoachService } from '../../../../../../core/services/coach/coach.service';
import { tap } from 'rxjs';

interface TrainingPlan {
    createdAt: string;
    durationWeeks: number;
    focus: string;
    id: string;
    status: string;
    title: string;
    trainingDaysPerWeek: number;
}

@Component({
    selector: 'app-list-plan-trackings',
    imports: [],
    templateUrl: './list-plan-trackings.html',
    styles: ``,
})
export class ListPlanTrackings {
    private authService = inject(AuthService);
    private profileUserService = inject(UserProfileService);
    private coachService = inject(CoachService);

    planResults = signal<TrainingPlan[] | null>(null);

    user = this.authService.user;
    userProfile = this.profileUserService.userProfile;

    ngOnInit() {
        this.coachService.getPlanTrackings().subscribe({
            next: (data) => {
                if (data) {
                    this.planResults.set(data);
                }
            },
        });
    }
}
