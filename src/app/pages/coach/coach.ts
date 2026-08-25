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
import { ShowUserProfileData } from '../../shared/components/widgets/coach/show-user-profile-data/show-user-profile-data';
import { CoachGeneratePlan } from '../../shared/components/widgets/coach/generate-plan/generate-plan';
import { fadeInOut } from '../../shared/animations/animation';

@Component({
    selector: 'app-coach',
    imports: [
        BtnComponent,
        FormUserProfile,
        InfoCard,
        IconComponent,
        SpinnerComponent,
        Notification,
        ListPlanTraining,
        CoachManage,
        ShowUserProfileData,
        CoachGeneratePlan,
    ],
    templateUrl: './coach.html',
    styles: ``,
    animations: [fadeInOut],
})
export class Coach {
    private authService = inject(AuthService);
    private profileUserService = inject(UserProfileService);
    private coachService = inject(CoachService);

    user = this.authService.user;
    userProfile = this.profileUserService.userProfile;

    deleting = signal(false);
    deleteNotification = signal<'success' | 'error' | null>(null);

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

    /**
     * Flujo principal de la página. Mientras `completeBasicSetup` guarda el
     * setup (savingSetup=true), la vista se queda en 'setup' para que el
     * formulario NO se destruya a mitad del guardado (la antigua carrera de
     * destrucción). Cuando el formulario guarda todo correctamente, se mantiene
     * en 'setup' 3 segundos más (mostrando el éxito sin inputs) y recién ahí
     * pasa a 'ready' (o a 'loading' si el refetch del perfil sigue en curso).
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
}
