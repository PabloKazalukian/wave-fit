import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { SelectTypeInput } from '../../../../interfaces/input.interface';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { FormControl, FormGroup } from '@angular/forms';
import { DayPlan, RoutineDay } from '../../../../interfaces/routines.interface';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { PlansService } from '../../../../../core/services/plans/plans.service';
import { ExerciseCategory } from '../../../../interfaces/exercise.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { noEmpty } from '../../../../validators/no-empty.validator';

export type ExerciseType = FormControlsOf<SelectTypeInput>;

@Injectable()
export class RoutineListBoxFacade {
    private destroyRef = inject(DestroyRef);

    private day = signal<DayPlan | null>(null);

    exerciseForm = new FormGroup<ExerciseType>({
        option: new FormControl('', {
            validators: [noEmpty],
            nonNullable: true,
        }),
    });

    routineSelected = signal<RoutineDay | null>(null);
    routinesDays = signal<RoutineDay[]>([]);

    openIndex = signal<number | null>(null);

    isSelected = signal<boolean | null>(null);

    constructor(
        private routinesSvc: RoutinesServices,
        private planSvc: PlansService,
    ) {}

    setDay(day: DayPlan) {
        this.day.set(day);

        if (day.routineId) {
            this.loadRoutineById(day.routineId);
        }
        this.exerciseForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (newValue) => {
                const exerCat = ExerciseCategory;
                if (newValue.option !== undefined)
                    if (Object.keys(exerCat).includes(newValue.option)) {
                        this.routinesSvc
                            .getRoutinesByCategory(newValue.option as ExerciseCategory)
                            .pipe(takeUntilDestroyed(this.destroyRef))
                            .subscribe({
                                next: (value) => {
                                    if (value && this.routineSelected() === null)
                                        this.routinesDays.set(value);
                                },
                                error: (err) => {
                                    console.log(err);
                                },
                            });
                    }
            },
            error: (err) => {},
        });
    }

    private loadRoutineById(id: string) {
        this.routinesSvc.getRoutineById(id).subscribe((value: RoutineDay | undefined) => {
            if (!value) return;
            this.routineSelected.set(value);
            this.routinesDays.set([value]);

            if (value.type) this.exerciseForm.patchValue({ option: value.type[0] });
        });
    }

    addRoutine(day: RoutineDay) {
        this.routineSelected.set(day);

        const index = this.routinesDays().findIndex((r) => r.id === day.id);
        this.openIndex.set(index); // ahora sí coincide con el accordion
        this.planSvc.setRoutineDay(day);
    }

    removeRoutine() {
        const value = this.routineSelected();
        console.log(value);
        if (value) this.planSvc.removeDayRoutine(value);
        this.routineSelected.set(null);
        this.openIndex.set(null);
    }
}
