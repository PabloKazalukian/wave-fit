import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
    KindEnum,
    RoutineDayVM,
    RoutinePlan,
    RoutinePlanVM,
} from '../../../../interfaces/routines.interface';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { AuthService } from '../../../../../core/services/auth/auth.service';
import { PlansService } from '../../../../../core/services/plans/plans.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    catchError,
    debounceTime,
    distinctUntilChanged,
    EMPTY,
    filter,
    map,
    Observable,
    of,
    switchMap,
    tap,
    timer,
} from 'rxjs';
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

    complete = signal<boolean>(false);

    routineForm = new FormGroup<RoutinePlanType>({
        name: new FormControl('', {
            nonNullable: true,
            validators: [
                Validators.required,
                Validators.minLength(3),
                Validators.pattern(/^[a-zA-Z0-9\s]+$/),
            ],
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

    private readonly authSvc = inject(AuthService);
    private readonly planService = inject(PlansService);

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
        this.routineForm
            .get('name')!
            .valueChanges.pipe(
                takeUntilDestroyed(this.destroyRef),
                debounceTime(400),
                distinctUntilChanged(),
                filter((title) => !!title && title.length >= 3),
                switchMap((title) =>
                    this.planService.validateTitleUnique(title).pipe(
                        map((isValid) => (isValid ? null : { titleExist: true })),
                        catchError(() => of(null)),
                    ),
                ),
            )
            .subscribe((error) => {
                const control = this.routineForm.get('name');
                if (error) {
                    control?.setErrors(error);
                } else {
                    const errors = control?.errors;
                    if (errors?.['titleExist']) {
                        delete errors['titleExist'];
                        control?.setErrors(Object.keys(errors).length ? errors : null);
                    }
                }
            });
    }

    submitPlan(): Observable<RoutinePlan> {
        this.routineForm.markAllAsTouched();

        this.routineForm.patchValue({ name: this.routineForm.get('name')?.value });
        if (this.routineForm.invalid) return EMPTY;

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

        const currentName = this.routineForm.get('name')?.value || '';

        // return timer(2000).pipe(
        //     map(() => {
        //         this.loading.set(false);
        //         this.notification.set({
        //             show: true,
        //             type: notificationEnum.success,
        //             message: 'Rutina creada correctamente',
        //         });
        //         this.complete.set(true);
        //     }),
        // );

        return this.planService.validateTitleUnique(currentName).pipe(
            switchMap((isValid) => {
                if (!isValid) {
                    this.loading.set(false);
                    this.routineForm.get('name')?.setErrors({ titleExist: true });
                    this.notification.set({
                        show: true,
                        type: notificationEnum.error,
                        message: 'El nombre de la rutina ya existe',
                    });
                    return EMPTY;
                }

                return timer(2000).pipe(
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
                        error: () => {
                            this.loading.set(false);
                            this.notification.set({
                                show: true,
                                type: notificationEnum.error,
                                message: 'Error al crear la rutina',
                            });
                        },
                    }),
                );
            }),
            catchError(() => {
                this.loading.set(false);
                this.notification.set({
                    show: true,
                    type: notificationEnum.error,
                    message: 'Error al validar el nombre',
                });
                return EMPTY;
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

    handleCloseNotification() {
        this.notification.set(initValueNotification);
    }
}
