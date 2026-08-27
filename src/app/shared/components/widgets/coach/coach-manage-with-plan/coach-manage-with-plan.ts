import {
    Component,
    effect,
    inject,
    input,
    output,
    OnInit,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, CalendarPlus, Save, Wand2, PlusCircle, Trash2, Edit3, CheckCircle } from 'lucide-angular';
import { CoachNavigatorWeek } from '../coach-navigator-week/coach-navigator-week';
import { CoachShowWorkout } from '../coach-show-workout/coach-show-workout';
import { BtnComponent } from '../../../ui/btn/btn';
import { DialogComponent } from '../../../ui/dialog/dialog';
import { InfoCard } from '../../../ui/info-card/info-card';
import { SpinnerComponent } from '../../../ui/icon/spinner';
import { TrainingPlanDetail, PlanConfirmationAction } from '../../../../interfaces/coach.interface';
import { CoachManageWithPlanFacade } from './coach-manage-with-plan.facade';
import { WorkoutSessionVM } from '../../../../interfaces/tracking.interface';
import { CoachService } from '../../../../../core/services/coach/coach.service';
import { CoachState } from '../../../../../core/services/coach/coach.state';

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
    private coachService = inject(CoachService);
    private coachState = inject(CoachState);

    planData = input.required<TrainingPlanDetail>();

    createNewPlan = output<void>();
    planDeleted = output<void>();
    planModified = output<TrainingPlanDetail>();

    deleting = signal(false);
    modifying = signal(false);
    errorMessage = signal<string | null>(null);

    showConfirmDialog = signal(false);

    readonly icons = {
        plus: PlusCircle,
        trash: Trash2,
        edit: Edit3,
        check: CheckCircle,
    };

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

    onCreateNewPlan(): void {
        this.coachState.clearPlan();
        this.createNewPlan.emit();
    }

    onDeletePlan(): void {
        const plan = this.planData();
        if (!plan || this.deleting()) return;

        this.deleting.set(true);
        this.errorMessage.set(null);

        this.coachService.removePlantraningById(plan.id).subscribe({
            next: () => {
                this.deleting.set(false);
                this.coachState.clearPlan();
                this.planDeleted.emit();
            },
            error: (err) => {
                this.deleting.set(false);
                this.errorMessage.set(this.extractErrorMessage(err, 'Error al borrar el plan'));
            },
        });
    }

    onModifyPlan(): void {
        if (!this.canModify || this.modifying()) return;

        this.modifying.set(true);
        this.errorMessage.set(null);

        this.coachService.generatePlan(this.modificationsComment).subscribe({
            next: (data) => {
                this.modifying.set(false);
                if (data?.aiSnapshot?.rawResponse) {
                    this.coachState.setPlan(data);
                    this.planModified.emit(data);
                    this.modificationsComment = '';
                } else {
                    this.errorMessage.set('La IA no devolvió modificaciones válidas. Intentá de nuevo.');
                }
            },
            error: (err) => {
                this.modifying.set(false);
                this.errorMessage.set(this.extractErrorMessage(err, 'Error al modificar el plan'));
            },
        });
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

    private extractErrorMessage(err: unknown, fallback: string): string {
        if (Array.isArray(err)) {
            return (
                err
                    .map((e: { message?: string }) => e.message || '')
                    .filter(Boolean)
                    .join(', ') || fallback
            );
        }
        return (err as { message?: string })?.message || fallback;
    }
}
