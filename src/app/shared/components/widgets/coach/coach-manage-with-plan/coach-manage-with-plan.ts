import { Component, effect, inject, input, output, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, CalendarPlus, Save, Wand2 } from 'lucide-angular';
import { CoachNavigatorWeek } from '../coach-navigator-week/coach-navigator-week';
import { CoachShowWorkout } from '../coach-show-workout/coach-show-workout';
import { BtnComponent } from '../../../ui/btn/btn';
import { DialogComponent } from '../../../ui/dialog/dialog';
import { InfoCard } from '../../../ui/info-card/info-card';
import { SpinnerComponent } from '../../../ui/icon/spinner';
import { TrainingPlanDetail, PlanConfirmationAction } from '../../../../interfaces/coach.interface';
import { CoachManageWithPlanFacade } from './coach-manage-with-plan.facade';
import { WorkoutSessionVM } from '../../../../interfaces/tracking.interface';

@Component({
    selector: 'app-coach-manage-with-plan',
    imports: [
        CoachNavigatorWeek,
        CoachShowWorkout,
        FormsModule,
        BtnComponent,
        DialogComponent,
        InfoCard,
        LucideAngularModule,
        SpinnerComponent,
    ],
    providers: [CoachManageWithPlanFacade],
    templateUrl: './coach-manage-with-plan.html',
    styles: ``,
})
export class CoachManageWithPlan implements OnInit {
    readonly facade = inject(CoachManageWithPlanFacade);

    planData = input.required<TrainingPlanDetail>();

    /** True mientras el padre está eliminando el plan en el backend. */
    deletingPlan = input<boolean>(false);

    deletePlan = output<void>();
    modifyPlan = output<string>();

    showConfirmDialog = signal(false);

    confirmationActions = [
        {
            action: 'CREATE_WEEK_LOG' as PlanConfirmationAction,
            icon: CalendarPlus,
            title: 'Empezar mi semana',
            description:
                'Crea tu semana en "Mi Semana" con los días y ejercicios de este plan,\nlista para registrar tus entrenamientos.',
        },
        {
            action: 'CREATE_ROUTINE_PLAN' as PlanConfirmationAction,
            icon: Save,
            title: 'Guardar como rutina semanal',
            description:
                'Guarda el plan como plantilla privada en tus rutinas semanales\n(sin pesos registrados), para reutilizarla cuando quieras.',
        },
        {
            action: 'ADAPT_ACTIVE_WEEK' as PlanConfirmationAction,
            icon: Wand2,
            title: 'Adaptar mi semana actual',
            description:
                'Ajusta tu semana en curso con este plan, manteniendo el progreso\nque ya registraste.',
        },
    ];

    modificationsComment = '';

    get canModify(): boolean {
        return this.modificationsComment.trim().split(/\s+/).filter(Boolean).length >= 10;
    }

    constructor() {
        effect(() => {
            const plan = this.planData();
            if (plan) {
                this.facade.buildFromPlan(plan);
            }
        });
    }

    ngOnInit(): void {
        this.facade.init();
    }

    onDaySelected(workout: WorkoutSessionVM | null): void {
        this.facade.onDaySelected(workout);
    }

    openConfirmDialog(): void {
        this.facade.confirmError.set(null);
        this.showConfirmDialog.set(true);
    }

    closeConfirmDialog(): void {
        if (this.facade.confirmingAction()) return;
        this.showConfirmDialog.set(false);
    }

    onConfirmAction(action: PlanConfirmationAction): void {
        this.facade.confirmPlan(action);
    }
}
