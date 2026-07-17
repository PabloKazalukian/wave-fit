import { Component, inject, output, signal } from '@angular/core';
import { AuthService } from '../../../../../../core/services/auth/auth.service';
import { UserProfileService } from '../../../../../../core/services/user/user-profile.service';
import { CoachService } from '../../../../../../core/services/coach/coach.service';
import { BtnComponent } from '../../../../ui/btn/btn';

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
    imports: [BtnComponent],
    templateUrl: './list-plan-trackings.html',
    styles: ``,
})
export class ListPlanTrackings {
    private authService = inject(AuthService);
    private profileUserService = inject(UserProfileService);
    private coachService = inject(CoachService);

    viewPlan = output<string>();

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

    formatDate(createdAt: string): string {
        const date = new Date(createdAt);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
}
