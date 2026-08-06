import { Component, inject, computed, signal } from '@angular/core';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { AuthService } from '../../core/services/auth/auth.service';
import { UserProfileService } from '../../core/services/user/user-profile.service';
import { FormUserProfile } from '../../shared/components/widgets/coach/form-user-profile/form-user-profile';
import { Bot } from 'lucide-angular';
import { InfoCard } from '../../shared/components/ui/info-card/info-card';
import { CoachService } from '../../core/services/coach/coach.service';
import { IconComponent } from '../../shared/components/ui/icon/icon';
import { SpinnerComponent } from '../../shared/components/ui/icon/spinner';
import { Notification } from '../../shared/components/ui/notification/notification';
import { ListPlanTraining } from '../../shared/components/widgets/coach/plan-training/list-plan-training/list-plan-training';
import { CoachManage } from '../../shared/components/widgets/coach/coach-manage/coach-manage';
import { CoachManageWithPlan } from '../../shared/components/widgets/coach/coach-manage-with-plan/coach-manage-with-plan';
import { TrainingPlanDetail } from '../../shared/interfaces/coach.interface';
import { FormsModule } from '@angular/forms';
import { ShowUserProfileData } from '../../shared/components/widgets/coach/show-user-profile-data/show-user-profile-data';

@Component({
    selector: 'app-coach',
    imports: [
        BtnComponent,
        FormUserProfile,
        InfoCard,
        FormsModule,
        IconComponent,
        SpinnerComponent,
        Notification,
        ListPlanTraining,
        CoachManage,
        CoachManageWithPlan,
        ShowUserProfileData,
    ],
    templateUrl: './coach.html',
    styles: ``,
})
export class Coach {
    private authService = inject(AuthService);
    private profileUserService = inject(UserProfileService);
    private coachService = inject(CoachService);

    user = this.authService.user;
    userProfile = this.profileUserService.userProfile;

    comment = '';
    loading = signal(false);
    deleting = signal(false);
    errorMessage = signal<string | null>(null);
    deleteNotification = signal<'success' | 'error' | null>(null);
    planResult = signal<TrainingPlanDetail | null>(null);

    selectedPlanId = signal<string | null>(null);
    manageMode = signal(false);

    feature = {
        icon: Bot,
        title: 'Wave-Fit: Tu Coach AI',
        description: `• Genera un plan con IA adaptado a tus necesitades.
         • Completa los datos basicos para poder genera un plan.
         • Podras modificarlo en el proceso. 
        `,
    };

    missingFields = computed(() => {
        const p = this.userProfile();
        if (!p) return ['Cargando perfil...'];

        const missing: string[] = [];
        if (!p.birthDate) missing.push('Fecha de nacimiento');
        if (!p.heightCm) missing.push('Altura');
        if (!p.weightKg) missing.push('Peso');
        if (!p.goal?.primaryGoal) missing.push('Objetivo');
        if (
            !p.schedule?.daysPerWeek &&
            (!p.schedule?.preferredDays || p.schedule.preferredDays.length === 0)
        )
            missing.push('Días disponibles');
        if (!p.goal?.trainingExperience) missing.push('Experiencia');

        return missing;
    });

    onViewPlan(planId: string) {
        this.selectedPlanId.set(planId);
        this.manageMode.set(true);
    }

    onBackToList() {
        this.manageMode.set(false);
        this.selectedPlanId.set(null);
    }

    onDeletePlan() {
        const planId = this.selectedPlanId();
        if (!planId || this.deleting()) return;

        const startedAt = Date.now();
        const MIN_LOADING_MS = 2000;
        const waitRemaining = () => Math.max(0, MIN_LOADING_MS - (Date.now() - startedAt));

        this.deleting.set(true);
        this.deleteNotification.set(null);

        this.coachService.removePlantraningById(planId).subscribe({
            next: () => {
                setTimeout(() => {
                    this.deleting.set(false);
                    this.manageMode.set(false);
                    this.selectedPlanId.set(null);
                    this.deleteNotification.set('success');
                }, waitRemaining());
            },
            error: (err) => {
                console.log(err);
                setTimeout(() => {
                    this.deleting.set(false);
                    this.deleteNotification.set('error');
                }, waitRemaining());
            },
        });
    }

    onClearPlanResult() {
        this.planResult.set(null);
    }

    onSubmit() {
        this.loading.set(true);
        this.errorMessage.set(null);
        this.planResult.set(null);

        this.coachService.generatePlan(this.comment).subscribe({
            next: (data) => {
                this.loading.set(false);
                if (data) {
                    if (data?.aiSnapshot?.rawResponse) {
                        // this.planResult.set(JSON.stringify(data.aiSnapshot.rawResponse, null, 2));
                        this.planResult.set(data);
                    }
                }
            },
            error: (err) => {
                this.loading.set(false);
                const msg = Array.isArray(err)
                    ? err.map((e: { message: string }) => e.message).join(', ')
                    : err?.message || 'Error al generar el plan';
                this.errorMessage.set(msg);
            },
        });
    }
}
