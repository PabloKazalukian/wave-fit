import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { SelectTypeInput } from '../../../../interfaces/input.interface';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { FormControl, FormGroup } from '@angular/forms';
import { DayPlan, RoutineDay, RoutineDayVM } from '../../../../interfaces/routines.interface';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { PlansService } from '../../../../../core/services/plans/plans.service';
import { ExerciseCategory } from '../../../../interfaces/exercise.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { noEmpty } from '../../../../validators/no-empty.validator';

export type ExerciseType = FormControlsOf<SelectTypeInput>;

@Injectable()
export class RoutineListBoxFacade {
    private destroyRef = inject(DestroyRef);
    private day = signal<RoutineDayVM | null>(null);
    private isInitialized = false; // NUEVO: flag para evitar llamadas duplicadas

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

    setDay(day: RoutineDayVM) {
        this.day.set(day);

        // ARREGLADO: Primero cargar rutina si existe, LUEGO setear el form
        if (day.id) {
            this.loadRoutineById(day.id);
        } else if (day.kind === 'WORKOUT' && day.type) {
            // Solo patchear y cargar categorías si NO hay id
            this.exerciseForm.patchValue({ option: day.type[0] }, { emitEvent: false });
            this.loadCategoriesByType(day.type[0]);
        }

        // ARREGLADO: Subscribir solo una vez
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
                    this.routinesDays.set([]);
                    const newDay = { ...day, type: undefined };
                    this.planSvc.setDayRoutine(day!.day - 1, newDay);
                    return;
                }

                const exerCat = ExerciseCategory;

                if (Object.keys(exerCat).includes(newValue.option)) {
                    this.planSvc.setDayRoutine(day.day - 1, {
                        ...day,
                        type: [newValue.option as ExerciseCategory],
                    });
                    this.loadCategoriesByType(newValue.option);
                }
            },
        });
    }

    private loadCategoriesByType(category: string) {
        if (!category || category === '') {
            this.routinesDays.set([]);
            return;
        }
        this.routinesSvc
            .getRoutinesByCategory(category as ExerciseCategory)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (value) => {
                    if (value) {
                        if (this.routineSelected() === null) {
                            this.routinesDays.set(value);
                        }
                    }
                },
                error: (err) => {
                    console.error('Error loading categories:', err);
                },
            });
    }

    private loadRoutineById(id: string) {
        this.routinesSvc
            .getRoutineById(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (value: RoutineDay | undefined) => {
                    if (!value) return;

                    this.routineSelected.set(value);
                    this.routinesDays.set([value]);

                    if (value.type && value.type.length > 0) {
                        this.exerciseForm.patchValue(
                            { option: value.type[0] },
                            { emitEvent: false },
                        );
                    }

                    this.openIndex.set(0);
                },
                error: (err) => {
                    console.error('Error loading routine by ID:', err);
                },
            });
    }

    addRoutine(routine: RoutineDay) {
        const day = this.day();
        if (!day) return;

        this.routineSelected.set(routine);

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

        this.routineSelected.set(null);
        this.openIndex.set(null);

        this.planSvc.setDayRoutine(day.day - 1, {
            ...day,
            id: undefined,
        });
        this.planSvc.removeDayRoutine(day.day);

        const currentType = this.exerciseForm.value.option;
        if (currentType) {
            this.loadCategoriesByType(currentType);
        }
    }
}
