import { Component, inject, OnInit, output, signal } from '@angular/core';
import { AuthService } from '../../../../../../core/services/auth/auth.service';
import { UserProfileService } from '../../../../../../core/services/user/user-profile.service';
import { CoachService } from '../../../../../../core/services/coach/coach.service';
import { BtnComponent } from '../../../../ui/btn/btn';
import { NumericPagination } from '../../../../ui/numeric-pagination/numeric-pagination';
import { TrainingPlanListItem } from '../../../../../interfaces/coach.interface';

@Component({
    selector: 'app-list-plan-training',
    imports: [BtnComponent, NumericPagination],
    templateUrl: './list-plan-training.html',
    styles: ``,
})
export class ListPlanTraining implements OnInit {
    private authService = inject(AuthService);
    private profileUserService = inject(UserProfileService);
    private coachService = inject(CoachService);

    viewPlan = output<string>();

    planResults = signal<TrainingPlanListItem[] | null>(null);
    totalItems = signal(0);
    totalPages = signal(0);
    currentPage = signal(1);
    readonly pageSize = 5;

    user = this.authService.user;
    userProfile = this.profileUserService.userProfile;

    ngOnInit() {
        this.loadPage(1);
    }

    loadPage(page: number): void {
        const offset = (page - 1) * this.pageSize;
        this.coachService.getPlanTrainings(this.pageSize, offset).subscribe({
            next: (data) => {
                if (data) {
                    this.planResults.set(data.items);
                    this.totalItems.set(data.total);
                    this.totalPages.set(data.totalPages);
                    this.currentPage.set(page);
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
