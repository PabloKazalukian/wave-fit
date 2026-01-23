import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { RoutineDay, RoutineDayVM, RoutinePlanVM } from '../../../../interfaces/routines.interface';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { AuthService } from '../../../../../core/services/auth/auth.service';
import { PlansService } from '../../../../../core/services/plans/plans.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, switchMap, tap } from 'rxjs';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';

type RoutinePlanType = FormControlsOf<RoutinePlanVM>;

@Injectable()
export class RoutinePlanFormFacade {
    private destroyRef = inject(DestroyRef);

    userId = signal<string>('');
    show = signal<boolean>(false);

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

        console.log(this.routineForm);
        //wrapped aqui
        return this.planService.submitPlan(this.routineForm.value);
    }
}
