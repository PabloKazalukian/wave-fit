import { Component, inject, signal, DestroyRef, OnInit } from '@angular/core';
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

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControlsOf } from '../../../shared/utils/form-types.util';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox/checkbox';

export interface ProfileVisibilityForm {
    weight: boolean;
    strengthMetrics: boolean;
    resource: boolean;
    trainingPreference: boolean;
    healthConstraints: boolean;
    schedule: boolean;
    goals: boolean;
}

type ProfileVisibilityFormType = FormControlsOf<ProfileVisibilityForm>;

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
        ReactiveFormsModule,
        CheckboxComponent,
    ],
    templateUrl: './profile.html',
    styles: ``,
})
export class Profile implements OnInit {
    private destroyRef = inject(DestroyRef);
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
    avatarFile: File | null = null;
    showProfileModal = signal<boolean>(false);

    visibilityForm!: FormGroup<ProfileVisibilityFormType>;

    ngOnInit(): void {
        this.visibilityForm = this.initVisibilityForm();

        this.visibilityForm.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                if (!value.weight) this.profile.weightLogs = [];
                if (!value.strengthMetrics) this.profile.strengthMetrics = [];
                if (!value.resource) this.profile.resource = null;
                if (!value.trainingPreference) this.profile.trainingPreference = null;
                if (!value.healthConstraints) this.profile.healthConstraints = null;
                if (!value.schedule) this.profile.schedule = null;
                if (!value.goals) this.profile.goal = null;
            });

        this.authService.me().subscribe();
    }

    initVisibilityForm(): FormGroup<ProfileVisibilityFormType> {
        return new FormGroup<ProfileVisibilityFormType>({
            weight: new FormControl(true, { nonNullable: true }),
            strengthMetrics: new FormControl(true, { nonNullable: true }),
            resource: new FormControl(true, { nonNullable: true }),
            trainingPreference: new FormControl(true, { nonNullable: true }),
            healthConstraints: new FormControl(true, { nonNullable: true }),
            schedule: new FormControl(true, { nonNullable: true }),
            goals: new FormControl(true, { nonNullable: true }),
        });
    }

    get weightControl(): FormControl<boolean> {
        return this.visibilityForm.get('weight')! as FormControl<boolean>;
    }

    get strengthMetricsControl(): FormControl<boolean> {
        return this.visibilityForm.get('strengthMetrics')! as FormControl<boolean>;
    }

    get resourceControl(): FormControl<boolean> {
        return this.visibilityForm.get('resource')! as FormControl<boolean>;
    }

    get trainingPreferenceControl(): FormControl<boolean> {
        return this.visibilityForm.get('trainingPreference')! as FormControl<boolean>;
    }

    get healthConstraintsControl(): FormControl<boolean> {
        return this.visibilityForm.get('healthConstraints')! as FormControl<boolean>;
    }

    get scheduleControl(): FormControl<boolean> {
        return this.visibilityForm.get('schedule')! as FormControl<boolean>;
    }

    get goalsControl(): FormControl<boolean> {
        return this.visibilityForm.get('goals')! as FormControl<boolean>;
    }

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
