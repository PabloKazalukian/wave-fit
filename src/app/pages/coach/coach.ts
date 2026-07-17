import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { AuthService } from '../../core/services/auth/auth.service';
import { UserProfileService } from '../../core/services/user/user-profile.service';
import { DataSection } from '../../shared/components/ui/data-section/data-section';
import { FormUserProfile } from '../../shared/components/widgets/coach/form-user-profile/form-user-profile';
import { Bot } from 'lucide-angular';
import { InfoCard } from '../../shared/components/ui/info-card/info-card';
import { CoachService } from '../../core/services/coach/coach.service';
import { IconComponent } from '../../shared/components/ui/icon/icon';
import { SpinnerComponent } from '../../shared/components/ui/icon/spinner';
import { ListPlanTrackings } from '../../shared/components/widgets/coach/plan-trackings/list-plan-trackings/list-plan-trackings';

@Component({
    selector: 'app-coach',
    imports: [
        BtnComponent,
        DataSection,
        FormsModule,
        FormUserProfile,
        InfoCard,
        IconComponent,
        SpinnerComponent,
        ListPlanTrackings,
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
    errorMessage = signal<string | null>(null);
    planResult = signal<string | null>(null);

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

    onSubmit() {
        this.loading.set(true);
        this.errorMessage.set(null);
        this.planResult.set(null);

        this.coachService.generatePlan().subscribe({
            next: (data) => {
                this.loading.set(false);
                if (data?.aiSnapshot?.rawResponse) {
                    this.planResult.set(JSON.stringify(data.aiSnapshot.rawResponse, null, 2));
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
