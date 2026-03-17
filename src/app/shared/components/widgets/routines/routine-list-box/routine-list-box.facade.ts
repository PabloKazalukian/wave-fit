import { DestroyRef, inject, Injectable, signal, effect, computed } from '@angular/core';
import { SelectTypeInput } from '../../../../interfaces/input.interface';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { FormControl, FormGroup } from '@angular/forms';
import { RoutineDay, RoutineDayVM, DayIndex } from '../../../../interfaces/routines.interface';
import { PlansService } from '../../../../../core/services/plans/plans.service';
import { ExerciseCategory } from '../../../../interfaces/exercise.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { noEmpty } from '../../../../validators/no-empty.validator';
import { DayPlanStateService } from '../../../../../core/services/plans/day-plan-state.service';

export type ExerciseType = FormControlsOf<SelectTypeInput>;

@Injectable()
export class RoutineListBoxFacade {
    private destroyRef = inject(DestroyRef);

    private readonly planSvc = inject(PlansService);
    private readonly state = inject(DayPlanStateService);

    constructor() {
        effect(() => {
            const routine = this.state.routinaDay();
            if (routine?.type && routine.type.length > 0) {
                const currentVal = this.exerciseForm.get('option')?.value;
                if (currentVal !== routine.type[0]) {
                    this.exerciseForm.patchValue({ option: routine.type[0] }, { emitEvent: false });
                }
            } else {
                this.exerciseForm.patchValue({ option: '' }, { emitEvent: false });
            }
        });
    }

    exerciseForm = new FormGroup<ExerciseType>({
        option: new FormControl('', {
            validators: [noEmpty],
            nonNullable: true,
        }),
    });

    readonly routinesByCategory = this.state.routinesByCategory;
    readonly routineSelected = this.state.routinaDay;

    isRoutine = computed(() => {
        const routine = this.state.routinaDay();
        return routine?.id === undefined || routine?.id === null;
    });

    creatingRoutine = signal<boolean>(false);

    openIndex = signal<number | null>(null);
    isSelected = signal<boolean | null>(null);

    init() {
        const routine = this.state.routinaDay();
        if (routine?.type) {
            if (routine.type.length > 0) {
                this.exerciseForm.patchValue({ option: routine.type[0] }, { emitEvent: false });
            }
        } else {
            this.exerciseForm.patchValue({ option: '' }, { emitEvent: false });
        }
        this.setupFormListener();
    }

    private setupFormListener() {
        this.exerciseForm
            .get('option')
            ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (newValue) => {
                    const dayIdx = this.state.indexDay();
                    if (!dayIdx || newValue === undefined) return;

                    if (newValue === '') {
                        this.state.clearRoutine();
                        this.exerciseForm.patchValue({ option: '' }, { emitEvent: false });
                        this.creatingRoutine.set(false);
                        return;
                    }
                    const routine = this.state.routinaDay();
                    if (!routine) return;
                    this.planSvc.setDayRoutine(dayIdx - 1, {
                        ...routine,
                        type: [newValue as ExerciseCategory],
                    });
                },
            });
    }

    addRoutine(routine: RoutineDay) {
        const dayIdx = this.state.indexDay();
        const currentDay = this.state.routinaDay();

        if (!dayIdx || !currentDay) return;

        // const newDay = this.state.routineDays().find((d) => d.id === currentDay.id);

        this.planSvc.setDayRoutine(dayIdx - 1, {
            ...currentDay,
            id: routine.id,
            title: routine.title,
            exercises: routine.exercises,
            type: routine.type,
        });
    }

    removeCateogry() {
        const dayIdx = this.state.indexDay();
        const currentDay = this.state.routinaDay();
        if (!dayIdx || !currentDay) return;
        this.exerciseForm.patchValue({ option: '' }, { emitEvent: false });
        this.creatingRoutine.set(false);

        this.planSvc.setDayRoutine(dayIdx - 1, {
            ...currentDay,
            type: undefined,
        });
    }

    removeRoutine() {
        const dayIdx = this.state.indexDay();
        const currentDay = this.state.routinaDay();
        if (!dayIdx || !currentDay) return;

        this.planSvc.setDayRoutine(dayIdx - 1, {
            ...currentDay,
            id: undefined,
        });
    }
}
