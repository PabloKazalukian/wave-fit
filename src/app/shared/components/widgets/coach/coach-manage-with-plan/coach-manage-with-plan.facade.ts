import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ExerciseCategory } from '../../../../interfaces/exercise.interface';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { DateService } from '../../../../../core/services/date.service';
import { CoachService } from '../../../../../core/services/coach/coach.service';
import { PlanTrackingService } from '../../../../../core/services/trackings/plan-tracking.service';
import {
    ExercisePerformanceVM,
    TrackingVM,
    WorkoutSessionVM,
} from '../../../../interfaces/tracking.interface';
import {
    ConfirmPlanOutput,
    PlanConfirmationAction,
    TrainingPlanDetail,
} from '../../../../interfaces/coach.interface';
import {
    AiPlanDay,
    AiPlanExercise,
    AiPlanResponse,
} from '../../../../interfaces/ai-plan.interface';

@Injectable()
export class CoachManageWithPlanFacade {
    private readonly dateService = inject(DateService);
    private readonly exercisesService = inject(ExercisesService);
    private readonly coachService = inject(CoachService);
    private readonly planTrackingSvc = inject(PlanTrackingService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    readonly trackingVM = signal<TrackingVM | null>(null);
    readonly selectedWorkout = signal<WorkoutSessionVM | null>(null);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    readonly planId = signal<string | null>(null);
    readonly hasActiveWeek = computed(() => !!this.planTrackingSvc.tracking());

    readonly confirmingAction = signal<PlanConfirmationAction | null>(null);
    readonly confirmError = signal<string | null>(null);

    /**
     * Debe llamarse en ngOnInit del componente padre para precargar los ejercicios.
     */
    init(): void {
        this.exercisesService.getExercises().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }

    readonly exercisesGrouped = computed(() => {
        const workout = this.selectedWorkout();
        if (!workout || !workout.exercises.length) return [];

        return Object.entries(
            workout.exercises
                .sort((a, b) => a.name.localeCompare(b.name))
                .reduce(
                    (acc, item) => {
                        if (!acc[item.category]) acc[item.category] = [];
                        acc[item.category].push(item);
                        return acc;
                    },
                    {} as Record<string, ExercisePerformanceVM[]>,
                ),
        );
    });

    /**
     * Carga el plan por ID desde la API y construye el TrackingVM.
     * Usado por CoachManage (vista de plan ya guardado).
     */
    loadPlanById(planId: string): void {
        this.loading.set(true);
        this.error.set(null);

        this.coachService
            .getPlanTrainingById(planId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    if (data) {
                        this.planId.set(data.id);
                        this.buildTrackingVM(data);
                    }
                    this.loading.set(false);
                },
                error: () => {
                    this.error.set('Error al cargar el plan');
                    this.loading.set(false);
                },
            });
    }

    /**
     * Construye el TrackingVM a partir de un TrainingPlanDetail ya disponible.
     * Usado por CoachManageWithPlan (el plan recién generado viene como input).
     */
    buildFromPlan(plan: TrainingPlanDetail): void {
        this.planId.set(plan.id);
        this.buildTrackingVM(plan);
    }

    onDaySelected(workout: WorkoutSessionVM | null): void {
        this.selectedWorkout.set(workout);
    }

    confirmPlan(action: PlanConfirmationAction): void {
        const planId = this.planId();
        if (!planId || this.confirmingAction()) return;

        this.confirmingAction.set(action);
        this.confirmError.set(null);

        this.coachService
            .confirmPlan(planId, action)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (output) => this.onConfirmSuccess(action, output),
                error: (err) => {
                    this.confirmError.set(this.mapConfirmError(err, action));
                    this.confirmingAction.set(null);
                },
            });
    }

    private onConfirmSuccess(
        action: PlanConfirmationAction,
        output: ConfirmPlanOutput | null,
    ): void {
        this.confirmingAction.set(null);

        if (action === 'CREATE_WEEK_LOG') {
            // Refrescar la semana activa antes de navegar a Mi Semana
            this.planTrackingSvc
                .reloadTracking()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(() => this.router.navigate(['/my-week']));
            return;
        }

        if (action === 'CREATE_ROUTINE_PLAN') {
            const routinePlanId =
                output?.routinePlan?.id ?? output?.trainingPlan.resultingRoutinePlanId ?? null;
            if (routinePlanId) {
                this.router.navigate(['/routines/show', routinePlanId]);
            }
            return;
        }
    }

    private mapConfirmError(err: unknown, action: PlanConfirmationAction): string {
        const { code, message } = this.extractError(err);
        const lower = message.toLowerCase();

        if (
            code === 'NOT_IMPLEMENTED' ||
            lower.includes('not implemented') ||
            lower.includes('no implementad')
        ) {
            return 'Adaptar la semana activa todavía no está disponible. Mientras tanto podés guardar el plan como rutina semanal.';
        }

        if (code === 'CONFLICT' || lower.includes('conflict')) {
            const activeWeekConflict =
                action === 'CREATE_WEEK_LOG' &&
                (lower.includes('semana') || lower.includes('week'));
            if (activeWeekConflict) {
                return 'Ya tenés una semana activa. Podés guardar el plan como rutina semanal o finalizar tu semana actual e intentarlo de nuevo.';
            }
            return 'Este plan ya fue confirmado anteriormente.';
        }

        if (
            code === 'BAD_REQUEST' ||
            code === 'BAD_USER_INPUT' ||
            lower.includes('día de entrenamiento') ||
            lower.includes('dias de entrenamiento')
        ) {
            return 'El plan no tiene días de entrenamiento suficientes para crear una rutina.';
        }

        if (!message || message === 'UNAUTHORIZED') return message || 'Error desconocido';
        return message;
    }

    private extractError(err: unknown): { code: string; message: string } {
        if (Array.isArray(err)) {
            const first = (err[0] ?? {}) as {
                message?: string;
                extensions?: { code?: string };
            };
            return {
                code: first.extensions?.code ?? '',
                message: first.message ?? '',
            };
        }
        const e = err as { code?: string; message?: string };
        return { code: e?.code ?? '', message: e?.message ?? '' };
    }

    private buildTrackingVM(plan: TrainingPlanDetail): void {
        const rawResponse = plan.aiSnapshot.rawResponse;
        const parsed: AiPlanResponse =
            typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;

        // El backend devuelve los 7 días directamente en la raíz
        const planDays: AiPlanDay[] = parsed.days ?? [];
        if (!planDays.length) return;

        const exercisesMap = new Map<
            string,
            { id: string; category: ExerciseCategory; usesWeight: boolean }
        >();
        for (const ex of this.exercisesService.exercises()) {
            if (!ex.id) continue;
            exercisesMap.set(ex.id, {
                id: ex.id,
                category: ex.category,
                usesWeight: ex.usesWeight ?? true,
            });
        }

        const startDate = plan.startDate || this.dateService.todayLocalDate();
        const workouts: WorkoutSessionVM[] = [];

        for (let i = 0; i < 7; i++) {
            const dayDate = this.dateService.addDaysToLocalDate(startDate, i);
            const planDay = planDays[i];

            if (planDay && !planDay.isRest && planDay.exercises.length > 0) {
                const exercises: ExercisePerformanceVM[] = planDay.exercises.map(
                    (ex: AiPlanExercise) => {
                        const catalogEntry = exercisesMap.get(ex.exerciseId);
                        const sets = ex.plannedSets ?? 3;
                        const repsNum = this.parseReps(ex.plannedReps);

                        return {
                            exerciseId: ex.exerciseId,
                            name: ex.name,
                            series: sets,
                            category: catalogEntry?.category ?? this.guessCategory(ex.name),
                            sets: Array.from({ length: sets }, () => ({
                                reps: repsNum,
                                weights: 0,
                            })),
                            usesWeight: catalogEntry?.usesWeight ?? true,
                            notes: ex.notes ?? undefined,
                        };
                    },
                );

                workouts.push({
                    date: dayDate,
                    exercises,
                    status: 'not_started',
                    notes: planDay.focus ?? undefined,
                });
            } else {
                workouts.push({
                    date: dayDate,
                    exercises: [],
                    status: 'rest',
                });
            }
        }

        const tracking: TrackingVM = {
            id: plan.id,
            userId: '',
            startDate,
            endDate: this.dateService.addDaysToLocalDate(startDate, 6),
            workouts,
            planId: plan.id,
            completed: false,
            active: false,
        };

        console.log('tracking', tracking);
        this.trackingVM.set(tracking);

        // Seleccionar el primer día de entrenamiento (no descanso)
        const firstTrainingDay = workouts.find((w) => w.status !== 'rest');
        this.selectedWorkout.set(firstTrainingDay ?? workouts[0] ?? null);
    }

    private parseReps(reps: string | null | undefined): number {
        if (!reps) return 10;
        const match = reps.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : 10;
    }

    private guessCategory(name: string): ExerciseCategory {
        const lower = name.toLowerCase();
        if (lower.includes('press') || lower.includes('banca') || lower.includes('pecho'))
            return ExerciseCategory.CHEST;
        if (lower.includes('remo') || lower.includes('dominada') || lower.includes('espalda'))
            return ExerciseCategory.BACK;
        if (
            lower.includes('sentadilla') ||
            lower.includes('pierna') ||
            lower.includes('prensa') ||
            lower.includes('extensiones de pierna')
        )
            return ExerciseCategory.LEGS;
        if (lower.includes('curl') || lower.includes('bíceps') || lower.includes('biceps'))
            return ExerciseCategory.BICEPS;
        if (lower.includes('tríceps') || lower.includes('triceps') || lower.includes('fondos'))
            return ExerciseCategory.TRICEPS;
        if (lower.includes('hombro') || lower.includes('elevacion'))
            return ExerciseCategory.SHOULDERS;
        if (lower.includes('plancha') || lower.includes('russian') || lower.includes('core'))
            return ExerciseCategory.CORE;
        return ExerciseCategory.CHEST;
    }
}
