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

    setDay(day: DayPlan) {
        this.day.set(day);

        // ARREGLADO: Primero cargar rutina si existe, LUEGO setear el form
        if (day.routineId) {
            this.loadRoutineById(day.routineId);
        } else if (day.kind === 'WORKOUT' && day.workoutType) {
            // Solo patchear y cargar categorías si NO hay routineId
            this.exerciseForm.patchValue({ option: day.workoutType }, { emitEvent: false });
            this.loadCategoriesByType(day.workoutType);
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
                if (!day || !newValue.option) return;

                const exerCat = ExerciseCategory;
                if (Object.keys(exerCat).includes(newValue.option)) {
                    // ARREGLADO: Solo actualizar si cambió realmente
                    if (day.workoutType !== newValue.option) {
                        this.planSvc.setRoutineDayType(newValue.option, day.day - 1);
                    }
                    this.loadCategoriesByType(newValue.option);
                }
            },
        });
    }

    private loadCategoriesByType(category: string) {
        this.routinesSvc
            .getRoutinesByCategory(category as ExerciseCategory)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (value) => {
                    if (value) {
                        // ARREGLADO: Solo setear si no hay rutina seleccionada
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

                    // ARREGLADO: Patchear el form DESPUÉS de cargar
                    if (value.type && value.type.length > 0) {
                        this.exerciseForm.patchValue(
                            { option: value.type[0] },
                            { emitEvent: false },
                        );
                    }

                    // Setear el índice abierto
                    this.openIndex.set(0);
                },
            });
    }

    addRoutine(routine: RoutineDay) {
        const day = this.day();
        if (!day) return;

        this.routineSelected.set(routine);

        // ARREGLADO: Buscar índice en el array actual
        const index = this.routinesDays().findIndex((r) => r.id === routine.id);
        this.openIndex.set(index);

        // ARREGLADO: Crear el objeto completo para setear
        const routineToSave: RoutineDay = {
            ...routine,
            kind: 'WORKOUT',
        };

        // this.planSvc.setRoutineDay(routineToSave);
    }

    removeRoutine() {
        const value = this.routineSelected();
        const day = this.day();

        if (!value || !day) return;

        // ARREGLADO: Limpiar estado primero
        this.routineSelected.set(null);
        this.openIndex.set(null);

        // ARREGLADO: Remover del plan
        // this.planSvc.removeDayRoutine(value);

        // ARREGLADO: Recargar las categorías del tipo actual
        const currentType = this.exerciseForm.value.option;
        if (currentType) {
            this.loadCategoriesByType(currentType);
        }
    }
}
