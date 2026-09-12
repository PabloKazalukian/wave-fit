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
import { TrainingPlanDetail, PlanConfirmationAction, AiUsageStatus } from '../../../../interfaces/coach.interface';
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

    usageStatus = signal<AiUsageStatus | null>(null);
    usageLoading = signal(false);

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
        this.loadUsageStatus();
    }

    loadUsageStatus(): void {
        this.usageLoading.set(true);
        this.coachService.getAiUsageStatus().subscribe({
            next: (status) => {
                this.usageStatus.set(status);
                this.usageLoading.set(false);
            },
            error: () => {
                this.usageLoading.set(false);
            },
        });
    }

    get hasReachedLimit(): boolean {
        const status = this.usageStatus();
        return status ? status.remaining <= 0 : false;
    }

    get nearLimit(): boolean {
        const status = this.usageStatus();
        return status ? status.remaining <= 1 : false;
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
        const plan = this.planData();
        if (!plan || !this.modificationsComment.trim() || this.modifying() || this.hasReachedLimit)
            return;

        this.modifying.set(true);
        this.errorMessage.set(null);

        this.coachService.getPlanTrainingById(plan.id).subscribe({
            next: (fresh) => {
                if (!fresh) {
                    this.modifying.set(false);
                    this.errorMessage.set('No se pudo verificar el plan. Intentá de nuevo.');
                    return;
                }
                if (plan.version !== undefined && fresh.version !== plan.version) {
                    this.modifying.set(false);
                    this.errorMessage.set(
                        'Este plan fue modificado en otra sesión. Recargalo e intentá de nuevo.',
                    );
                    return;
                }

                this.coachService.modifyPlan(plan.id, this.modificationsComment).subscribe({
                    next: (data) => {
                        this.modifying.set(false);
                        if (data?.aiSnapshot?.rawResponse) {
                            this.coachState.setPlan(data);
                            this.planModified.emit(data);
                            this.modificationsComment = '';
                            this.loadUsageStatus();
                        } else {
                            this.errorMessage.set(
                                'La IA no devolvió modificaciones válidas. Intentá de nuevo.',
                            );
                        }
                    },
                    error: (err) => {
                        this.modifying.set(false);
                        this.errorMessage.set(
                            this.extractErrorMessage(err, 'Error al modificar el plan'),
                        );
                        this.loadUsageStatus();
                    },
                });
            },
            error: (err) => {
                this.modifying.set(false);
                this.errorMessage.set(
                    this.extractErrorMessage(err, 'Error al verificar el plan antes de modificar'),
                );
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
