import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { ProfileUser } from '../../../shared/utils/profile.types';

@Component({
    selector: 'app-profile',
    imports: [],
    templateUrl: './profile.html',
    styles: ``,
})
export class Profile {
    private authService = inject(AuthService);
    private router = inject(Router);

    user = this.authService.user;
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
