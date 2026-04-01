import { Component, computed, inject, output, signal } from '@angular/core';
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
import { DialogComponent } from '../../../../ui/dialog/dialog';

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
        const selected = this.selectedCategories();
        const all = this.routines() as RoutineDay[];

        if (selected.length === 0) return all;

        // ExerciseCategory enum has lowercase values, options.value has uppercase
        return all.filter((r) => r.type?.some((cat) => selected.includes(cat.toUpperCase())));
    });

    selectedRoutineId = signal<string | null>(null);
    isLoading = signal(false);

    routineSelected = output<RoutineDay>();
    close = output<void>();

    selectRoutine(routine: RoutineDay) {
        if (this.selectedRoutineId() === routine.id) {
            this.selectedRoutineId.set(null);
        } else {
            this.selectedRoutineId.set(routine.id);
        }
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
