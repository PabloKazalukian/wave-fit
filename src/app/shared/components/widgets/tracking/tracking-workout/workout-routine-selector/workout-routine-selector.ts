import { Component, computed, effect, inject, output, signal } from '@angular/core';
import { RoutinesServices } from '../../../../../../core/services/routines/routines.service';
import { RoutineDay } from '../../../../../interfaces/routines.interface';
import { ExerciseCategory } from '../../../../../interfaces/exercise.interface';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { options } from '../../../../../interfaces/input.interface';
import { CommonModule } from '@angular/common';
import { MultiSelectComponent } from '../../../../ui/multi-select/multi-select';
import { AccordionItemComponent } from '../../../../ui/accordion-item/accordion-item';
import { BtnComponent } from '../../../../ui/btn/btn';
import { toSignal } from '@angular/core/rxjs-interop';
import { Loading } from '../../../../ui/loading/loading';
import { map } from 'rxjs';
import { WorkoutStateService } from '../../../../../../core/services/workouts/workout.state';
import { WorkoutSessionVM } from '../../../../../interfaces/tracking.interface';

@Component({
    selector: 'app-workout-routine-selector',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MultiSelectComponent,
        AccordionItemComponent,
        BtnComponent,
        Loading,
    ],
    templateUrl: './workout-routine-selector.html',
})
export class WorkoutRoutineSelector {
    private routinesSvc = inject(RoutinesServices);
    private state = inject(WorkoutStateService);

    workout = signal<WorkoutSessionVM | null>(this.state.workoutSession());

    //get routine from state
    private initialized = false;

    constructor() {
        effect(() => {
            const currentWorkout = this.state.workoutSession();

            if (!this.initialized) {
                this.initialized = true;
                return;
            }

            this.resetState();
        });
    }
    private resetState() {
        this.selectedRoutineId.set(null);
        this.showRoutine.set(null);
        this.categoryControl.setValue([]);
    }

    categoryControl = new FormControl<string[]>([], { nonNullable: true });
    options = options;

    selectedCategories = toSignal(this.categoryControl.valueChanges, {
        initialValue: [] as string[],
    });

    // Get all routines
    routines = toSignal(this.routinesSvc.getAllRoutines().pipe(map((r) => r || [])), {
        initialValue: [] as RoutineDay[],
    });

    filteredRoutines = computed(() => {
        const selectedRoutineId = this.selectedRoutineId();
        if (selectedRoutineId) {
            return this.routines().filter((r) => r.id === selectedRoutineId);
        }

        const selected = this.selectedCategories();
        const all = this.routines() as RoutineDay[];

        if (selected.length === 0) return all;

        //filtrar de los routines, todas las que poseen todas las categorias que hay en selected
        return all.filter((routine) => {
            const routineTypes = routine.type || [];
            return selected.every((selectedCat) =>
                routineTypes.some((routineCat) => routineCat === selectedCat),
            );
        });
    });

    selectedRoutineId = signal<string | null>(null);
    showRoutine = signal<RoutineDay | null>(null);
    isLoading = signal(false);

    routineSelected = output<RoutineDay>();
    close = output<void>();

    selectRoutine(routine: RoutineDay) {
        //tambien quitar las demas routines y tener open
        if (this.selectedRoutineId() === routine.id) {
            this.selectedRoutineId.set(null);
            this.showRoutine.set(null);
        } else {
            this.selectedRoutineId.set(routine.id);
            this.showRoutine.set(routine);
        }
    }

    selectToShowRoutine(routine: RoutineDay) {
        this.showRoutine.set(this.showRoutine()?.id === routine.id ? null : routine);
    }

    onAssign() {
        const routineId = this.selectedRoutineId();
        if (routineId) {
            const routine = (this.routines() as RoutineDay[]).find((r) => r.id === routineId);
            if (routine) {
                this.isLoading.set(true);
                // Simulate loading as requested "genera un loading en el tracking"
                // But it says "no haces la accion aun, solo traes el routine listo para el proximo paso"
                setTimeout(() => {
                    this.routineSelected.emit(routine);
                    this.isLoading.set(false);
                }, 800);
            }
        }
    }

    onClose() {
        this.close.emit();
    }
}
