import { Component, DestroyRef, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { AuthService } from '../../core/services/auth/auth.service';
import { UserProfileService } from '../../core/services/user/user-profile.service';
import { Router } from '@angular/router';
import { DataSection } from '../../shared/components/ui/data-section/data-section';
import { FormUserProfile } from '../../shared/components/widgets/coach/form-user-profile/form-user-profile';
import { Bot } from 'lucide-angular';
import { InfoCard } from '../../shared/components/ui/info-card/info-card';

@Component({
    selector: 'app-coach',
    imports: [BtnComponent, DataSection, FormsModule, FormUserProfile, InfoCard],
    templateUrl: './coach.html',
    styles: ``,
})
export class Coach {
    private destroyRef = inject(DestroyRef);
    private authService = inject(AuthService);
    private router = inject(Router);
    private profileUserService = inject(UserProfileService);

    user = this.authService.user;
    userProfile = this.profileUserService.userProfile;

    comment = '';

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
        console.log(p);
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

    ngOnInit(): void {}
}
