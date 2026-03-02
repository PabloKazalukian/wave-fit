import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { SelectTypeInput } from '../../../../interfaces/input.interface';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { FormControl, FormGroup } from '@angular/forms';
import { RoutineDay, RoutineDayVM, DayIndex } from '../../../../interfaces/routines.interface';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { PlansService } from '../../../../../core/services/plans/plans.service';
import { ExerciseCategory } from '../../../../interfaces/exercise.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { noEmpty } from '../../../../validators/no-empty.validator';
import { DayPlanStateService } from '../../../../../core/services/plans/day-plan-state.service';

export type ExerciseType = FormControlsOf<SelectTypeInput>;

@Injectable()
export class RoutineListBoxFacade {
    private destroyRef = inject(DestroyRef);

    private readonly routinesSvc = inject(RoutinesServices);
    private readonly planSvc = inject(PlansService);
    private readonly state = inject(DayPlanStateService);

    private day = signal<RoutineDayVM | null>(null);
    private isInitialized = false;

    exerciseForm = new FormGroup<ExerciseType>({
        option: new FormControl('', {
            validators: [noEmpty],
            nonNullable: true,
        }),
    });

    routineSelected = this.state.routineSelected;
    routinesDays = this.state.routinesDays;

    openIndex = signal<number | null>(null);
    isSelected = signal<boolean | null>(null);

    setDay(day: RoutineDayVM) {
        this.day.set(day);

        // Asignamos el dia seleccionado numericamente al indexState
        this.state.setDay(day.day as DayIndex);

        if (day.type && day.type.length > 0) {
            this.exerciseForm.patchValue({ option: day.type[0] }, { emitEvent: false });
            this.state.setCategory(day.type[0]);
        }

        if (!this.isInitialized) {
            this.isInitialized = true;
            this.setupFormListener();
        }
    }

    private setupFormListener() {
        this.exerciseForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (newValue) => {
                const day = this.day();
                if (!day || newValue.option === undefined) return;

                if (newValue.option === '') {
                    this.state.setCategory(null);
                    const newDay = { ...day, type: undefined };
                    this.planSvc.setDayRoutine(day.day - 1, newDay);
                    return;
                }

                const exerCat = ExerciseCategory;

                if (Object.keys(exerCat).includes(newValue.option)) {
                    this.state.setCategory(newValue.option as ExerciseCategory);
                    this.planSvc.setDayRoutine(day.day - 1, {
                        ...day,
                        type: [newValue.option as ExerciseCategory],
                    });
                }
            },
        });
    }

    addRoutine(routine: RoutineDay) {
        const day = this.day();
        if (!day) return;

        const index = this.routinesDays().findIndex((r) => r.id === routine.id);
        this.openIndex.set(index);

        const routineToSave: RoutineDayVM = {
            ...routine,
            id: routine.id,
            kind: 'WORKOUT',
            day: day.day,
            expanded: true,
            type: routine.type,
        };

        this.planSvc.setDayRoutine(day.day - 1, routineToSave);
    }

    removeRoutine() {
        const value = this.routineSelected();
        const day = this.day();

        if (!value || !day) return;

        this.openIndex.set(null);

        this.planSvc.setDayRoutine(day.day - 1, {
            ...day,
            id: undefined,
        });

        this.planSvc.removeDayRoutine(day.day);
    }
}
