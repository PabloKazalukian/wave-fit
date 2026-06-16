import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { ProfileUser } from '../../../shared/utils/profile.types';
import { UserProfileService } from '../../../core/services/user/user-profile.service';
import { UserProfile } from '../../../shared/components/widgets/users/profile/user-profile/user-profile';
import { Weight } from '../../../shared/components/widgets/users/profile/weight/weight';
import { StrengthMetrics } from '../../../shared/components/widgets/users/profile/strength-metrics/strength-metrics';
import { Resource } from '../../../shared/components/widgets/users/profile/resource/resource';
import { TrainingPerformance } from '../../../shared/components/widgets/users/profile/training-performance/training-performance';
import { HealthConstraints } from '../../../shared/components/widgets/users/profile/health-constraints/health-constraints';
import { Schedule } from '../../../shared/components/widgets/users/profile/schedule/schedule';
import { Goals } from '../../../shared/components/widgets/users/profile/goals/goals';

@Component({
    selector: 'app-profile',
    imports: [
        UserProfile,
        Weight,
        StrengthMetrics,
        Resource,
        TrainingPerformance,
        HealthConstraints,
        Schedule,
        Goals,
    ],
    templateUrl: './profile.html',
    styles: ``,
})
export class Profile {
    private authService = inject(AuthService);
    private router = inject(Router);
    private profileUserService = inject(UserProfileService);

    user = this.authService.user;
    userProfile = this.profileUserService.userProfile;
    profile: ProfileUser = {
        _id: '',
        userId: '',
        gender: 'M',
        birthDate: '',
        heightCm: 0,
        weightKg: 0,
        distributionDays: 'Week-log',
        unitsPreference: 'metric',
        createdAt: '',
        updatedAt: '',
        goal: null,
        healthConstraints: null,
        schedule: null,
        trainingPreference: null,
        resource: null,
        strengthMetrics: [],
        weightLogs: [],
    };
    avatarUrl = this.authService.avatarUrl;
    showAvatarDialog = signal<boolean>(false);

    ngOnInit(): void {
        this.authService.me().subscribe();
        // this.profileUserService.userProfileContext().subscribe((data) => {
        //     console.log(data);
        //     // this.profile = data;
        // });
    }
    avatarFile: File | null = null;
    showProfileModal = signal<boolean>(false);

    openAvatarUpload() {
        this.showAvatarDialog.set(true);
    }
    openProfileModal() {
        this.showProfileModal.set(true);
    }
    editProfile() {
        this.showProfileModal.set(true);
    }
}
