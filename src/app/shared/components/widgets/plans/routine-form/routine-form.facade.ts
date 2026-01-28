import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
    KindEnum,
    RoutineDay,
    RoutineDayVM,
    RoutinePlanVM,
} from '../../../../interfaces/routines.interface';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { AuthService } from '../../../../../core/services/auth/auth.service';
import { PlansService } from '../../../../../core/services/plans/plans.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of, switchMap, tap } from 'rxjs';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import {
    notificationEnum,
    notificationType,
} from '../../exercises/exercise-create/exercise-create.facade';

type RoutinePlanType = FormControlsOf<RoutinePlanVM>;
export type typeNotification = { show: boolean; type: notificationType; message: string };
export const initValueNotification = {
    show: false,
    type: notificationEnum.success,
    message: '',
};

@Injectable()
export class RoutinePlanFormFacade {
    private destroyRef = inject(DestroyRef);

    userId = signal<string>('');
    show = signal<boolean>(false);
    loading = signal<boolean>(false);
    notification = signal<typeNotification>(initValueNotification);

    routineForm = new FormGroup<RoutinePlanType>({
        name: new FormControl('', { nonNullable: true }),
        description: new FormControl('', { nonNullable: true }),
        weekly_distribution: new FormControl('', { nonNullable: true }),
        routineDays: new FormControl<RoutineDayVM[]>(Array(7).fill(''), { nonNullable: true }),
        createdBy: new FormControl('', { nonNullable: true }),
    });

    constructor(
        private authSvc: AuthService,
        private planService: PlansService,
        private routinesSvc: RoutinesServices,
    ) {}

    initFacade() {
        this.authSvc
            .me()
            .pipe(
                takeUntilDestroyed(this.destroyRef),

                tap((user) => {
                    this.userId.set(user?.id ?? '');
                    this.routineForm.patchValue({ createdBy: this.userId() });

                    if (this.userId) {
                        this.planService.initPlanForUser(this.userId());
                    }
                }),

                switchMap(() => this.planService.routinePlanVM$),

                tap((plan) => {
                    if (plan.weekly_distribution) this.show.set(true);
                    this.routineForm.patchValue(plan, { emitEvent: false });
                }),

                switchMap(() =>
                    this.routineForm.valueChanges.pipe(
                        tap((formValue) => {
                            const current = this.planService.currentValue();
                            this.planService.setRoutinePlan({ ...current, ...formValue });
                        }),
                    ),
                ),
            )
            .subscribe();
    }

    submitPlan(): Observable<any> {
        this.routineForm.markAllAsTouched();

        const syncErrors = this.validateFormSync();

        if (syncErrors) {
            this.notification.set({
                show: true,
                type: notificationEnum.error,
                message: syncErrors.join(' | '),
            });
            return new Observable(); // corta flujo
        }

        this.loading.set(true);
        console.log(this.validateTitleUnique(this.routineForm.value.name!));
        return new Observable(); // corta flujo

        return this.validateTitleUnique(this.routineForm.value.name!).pipe(
            switchMap((isValid) => {
                if (!isValid) {
                    this.loading.set(false);
                    this.notification.set({
                        show: true,
                        type: notificationEnum.error,
                        message: 'El nombre de la rutina ya existe',
                    });
                    return new Observable();
                }

                return this.planService.submitPlan(this.routineForm.value);
            }),
            tap(() => {
                this.loading.set(false);
                this.notification.set({
                    show: true,
                    type: notificationEnum.success,
                    message: 'Rutina creada correctamente',
                });
            }),
        );
    }

    private validateTitleUnique(title: string): Observable<boolean | undefined> {
        return this.planService.validateTitleUnique(title);
        // .pipe(takeUntilDestroyed(this.destroyRef))
    }

    private validateFormSync(): string[] | null {
        const errors: string[] = [];
        const value = this.routineForm.getRawValue();

        // 1. title obligatorio
        if (!value.name || !value.name.trim()) {
            errors.push('El título es obligatorio');
        }

        // 2. routineDays length
        if (!Array.isArray(value.routineDays) || value.routineDays.length !== 7) {
            errors.push('La rutina debe tener exactamente 7 días');
            return errors;
        }

        // 3. validación de días
        const invalidDays: number[] = [];
        let workoutCount = 0;

        value.routineDays.forEach((day, index) => {
            if (!day?.kind) {
                invalidDays.push(index + 1);
                return;
            }

            if (day.kind === KindEnum.workout) {
                workoutCount++;

                if (!day.id || !day.type) {
                    invalidDays.push(index + 1);
                }
            }
        });

        if (invalidDays.length) {
            errors.push(`Días mal configurados: ${invalidDays.join(' ')}`);
        }

        // 4. weekly_distribution
        if (+value.weekly_distribution !== workoutCount) {
            errors.push(
                `La distribución semanal no coincide con los días de entrenamiento (${workoutCount})`,
            );
        }

        return errors.length ? errors : null;
    }
}
