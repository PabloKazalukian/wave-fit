import { Component, inject, computed, signal, viewChild } from '@angular/core';
import { AuthService } from '../../core/services/auth/auth.service';
import { UserProfileService } from '../../core/services/user/user-profile.service';
import { FormUserProfile } from '../../shared/components/widgets/coach/form-user-profile/form-user-profile';
import { Bot } from 'lucide-angular';
import { InfoCard } from '../../shared/components/ui/info-card/info-card';
import { CoachService } from '../../core/services/coach/coach.service';
import { CoachState } from '../../core/services/coach/coach.state';
import { SpinnerComponent } from '../../shared/components/ui/icon/spinner';
import { Notification } from '../../shared/components/ui/notification/notification';
import { ListPlanTraining } from '../../shared/components/widgets/coach/plan-training/list-plan-training/list-plan-training';
import { ShowUserProfileData } from '../../shared/components/widgets/coach/show-user-profile-data/show-user-profile-data';
import { CoachGeneratePlan } from '../../shared/components/widgets/coach/generate-plan/generate-plan';
import { CoachManageWithPlan } from '../../shared/components/widgets/coach/coach-manage-with-plan/coach-manage-with-plan';
import { fadeInOut } from '../../shared/animations/animation';
import { TrainingPlanDetail } from '../../shared/interfaces/coach.interface';

@Component({
    selector: 'app-coach',
    imports: [
        FormUserProfile,
        InfoCard,
        SpinnerComponent,
        Notification,
        ListPlanTraining,
        ShowUserProfileData,
        CoachGeneratePlan,
        CoachManageWithPlan,
    ],
    templateUrl: './coach.html',
    styles: ``,
    animations: [fadeInOut],
})
export class Coach {
    private authService = inject(AuthService);
    private profileUserService = inject(UserProfileService);
    private coachService = inject(CoachService);
    readonly coachState = inject(CoachState);

    readonly listPlanTraining = viewChild(ListPlanTraining);

    user = this.authService.user;
    userProfile = this.profileUserService.userProfile;

    loadingPlan = signal(false);
    notification = signal<{ type: 'success' | 'error'; message: string } | null>(null);

    feature = {
        icon: Bot,
        title: 'Wave-Fit: Tu Coach AI',
        description: `• Genera un plan con IA adaptado a tus necesidades.
• Completa los datos básicos para poder generar un plan.
• Podrás visualizarlo, modificarlo o confirmarlo en el proceso.`,
    };

    /**
     * Flujo principal de la página. Mientras `completeBasicSetup` guarda el
     * setup (savingSetup=true), la vista se queda en 'setup'.
     */
    coachStep = computed<'loading' | 'setup' | 'ready'>(() => {
        if (this.profileUserService.savingSetup()) return 'setup';
        if (this.setupCompletedHold()) return 'setup';
        if (this.profileUserService.loading()) return 'loading';
        return this.missingFields().length === 0 ? 'ready' : 'setup';
    });

    /** Retiene el paso 'setup' durante la transición post-guardado exitoso. */
    private setupCompletedHold = signal(false);

    onSetupCompleted(): void {
        this.setupCompletedHold.set(true);
        setTimeout(() => this.setupCompletedHold.set(false), 3000);
    }

    missingFields = computed(() => {
        const p = this.userProfile();
        if (!p) return this.profileUserService.loading() ? [] : ['Perfil no disponible'];

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
        if (this.loadingPlan()) return;
        this.loadingPlan.set(true);

        this.coachService.getPlanTrainingById(planId).subscribe({
            next: (plan) => {
                this.loadingPlan.set(false);
                if (plan) {
                    this.coachState.setPlan(plan, true);
                } else {
                    this.notification.set({
                        type: 'error',
                        message: 'No se pudo cargar el plan seleccionado.',
                    });
                }
            },
            error: () => {
                this.loadingPlan.set(false);
                this.notification.set({
                    type: 'error',
                    message: 'Error al obtener los detalles del plan.',
                });
            },
        });
    }

    onNewPlan(): void {
        this.coachState.clearPlan();
    }

    onPlanGenerated(plan: TrainingPlanDetail): void {
        console.log(plan);
        this.coachState.setPlan(plan, true);
        this.listPlanTraining()?.reload();
        this.notification.set({
            type: 'success',
            message: '¡Plan generado exitosamente con IA!',
        });
    }

    onPlanModified(plan: TrainingPlanDetail): void {
        this.coachState.setPlan(plan, true);
        this.listPlanTraining()?.reload();
        this.notification.set({
            type: 'success',
            message: '¡Plan modificado correctamente!',
        });
    }

    onPlanDeleted(): void {
        this.coachState.clearPlan();
        this.listPlanTraining()?.reload();
        this.notification.set({
            type: 'success',
            message: 'Plan eliminado correctamente.',
        });
    }
}
