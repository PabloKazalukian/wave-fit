import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
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
import { catchError, EMPTY, map, Observable, of, switchMap, tap, timer } from 'rxjs';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import {
    notificationEnum,
    notificationType,
} from '../../exercises/exercise-create/exercise-create.facade';
import { routineDaysValidator } from '../../../../validators/routine-days.validator';

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
        name: new FormControl('', {
            nonNullable: true,
            validators: [
                Validators.required,
                Validators.minLength(3),
                Validators.pattern(/^[a-zA-Z0-9\s]+$/),
            ],
            asyncValidators: [this.validateTitleUniqueForm.bind(this)],
            updateOn: 'blur',
        }),
        description: new FormControl('', { nonNullable: true }),
        weekly_distribution: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
        routineDays: new FormControl<RoutineDayVM[]>(Array(7).fill(''), {
            nonNullable: true,
            validators: [routineDaysValidator()],
        }),
        createdBy: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    });

    constructor(
        private authSvc: AuthService,
        private planService: PlansService,
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
    submitPlan(): Observable<void> {
        this.routineForm.markAllAsTouched();

        if (this.routineForm.invalid) {
            return EMPTY;
        }

        const businessErrors = this.validateBusinessRules();
        if (businessErrors.length) {
            this.notification.set({
                show: true,
                type: notificationEnum.error,
                message: businessErrors.join(' | '),
            });
            return EMPTY;
        }

        this.loading.set(true);

        return timer(2000).pipe(
            // loading mínimo 2s ✔️
            switchMap(() => this.planService.submitPlan(this.routineForm.getRawValue())),
            tap({
                next: () => {
                    this.loading.set(false);
                    this.notification.set({
                        show: true,
                        type: notificationEnum.success,
                        message: 'Rutina creada correctamente',
                    });
                },
                error: () =>
                    this.notification.set({
                        show: true,
                        type: notificationEnum.error,
                        message: 'Error al crear la rutina',
                    }),
                finalize: () => this.loading.set(false),
            }),
        );
    }

    private validateBusinessRules(): string[] {
        const { weekly_distribution, routineDays } = this.routineForm.getRawValue();

        const workoutCount = routineDays.filter((d) => d.kind === KindEnum.workout).length;

        if (+weekly_distribution !== workoutCount) {
            return [
                `La distribución semanal no coincide con los días de entrenamiento (${workoutCount})`,
            ];
        }

        return [];
    }

    //Validators Form

    private validateTitleUniqueForm(control: AbstractControl) {
        const title = control.value;
        console.log(title);
        if (title) {
            return this.planService.validateTitleUnique(title).pipe(
                map((isValid) => {
                    return isValid ? null : { titleExist: true };
                }),
                catchError((error) => {
                    return of(null);
                }),
            );
        }
        return of(null);
    }
}
