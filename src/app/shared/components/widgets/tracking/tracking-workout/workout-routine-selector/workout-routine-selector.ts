import { Component, computed, effect, inject, output, signal } from '@angular/core';
import { RoutinesService } from '../../../../../../core/services/routines/routines.service';
import { RoutineDay } from '../../../../../interfaces/routines.interface';
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
    private routinesSvc = inject(RoutinesService);
    private state = inject(WorkoutStateService);

    routineSelected = output<RoutineDay>();
    close = output<void>();

    workout = signal<WorkoutSessionVM | null>(this.state.workoutSession());

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

    routines = toSignal(this.routinesSvc.getAllRoutines().pipe(map((r) => r || [])), {
        initialValue: [] as RoutineDay[],
    });

    isLoadingRoutines = toSignal(this.routinesSvc.loadingRoutines, {
        initialValue: true,
    });

    filteredRoutines = computed(() => {
        const selectedRoutineId = this.selectedRoutineId();
        if (selectedRoutineId) {
            return this.routines().filter((r) => r.id === selectedRoutineId);
        }

        const selected = this.selectedCategories();
        const all = this.routines() as RoutineDay[];

        if (selected.length === 0) return all;

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

    selectRoutine(routine: RoutineDay) {
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
