import { Component, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule } from '@angular/forms';
import { TrackingVM } from '../../../../interfaces/tracking.interface';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { SelectTypeInput } from '../../../../interfaces/input.interface';
import { TrackingWorkoutComponent } from '../tracking-workout/tracking-workout';
import { NavigatorWeek } from './navigator-week/navigator-week';
import { WorkoutStateService } from '../../../../../core/services/workouts/workout-state.service';
import { BtnComponent } from '../../../ui/btn/btn';
import { DialogComponent } from '../../../ui/dialog/dialog';
import { PlanTrackingService } from '../../../../../core/services/trackings/plan-tracking.service';

type ExercisesType = FormControlsOf<{
    exercisesSelected: ExerciseRoutine[];
    categoriesSelected: string[];
}>;

export type SelectType = FormControlsOf<SelectTypeInput>;

export interface ExerciseRoutine {
    id: string;
    name: string;
    description: string;
    time: number | null;
    showInput: boolean;
    showDeleteButton: boolean; // 👈 Nueva propiedad
}

@Component({
    selector: 'app-tracking-week',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NavigatorWeek,
        TrackingWorkoutComponent,
        BtnComponent,
        DialogComponent,
    ],
    templateUrl: './tracking-week.html',
})
export class TrackingWeekComponent {
    tracking = input<TrackingVM | null>(null);

    showConfirmDialog = signal(false);

    state = inject(WorkoutStateService);
    trackingSvc = inject(PlanTrackingService);

    exercisesForm = new FormGroup<ExercisesType>({
        exercisesSelected: new FormControl<ExerciseRoutine[]>([], { nonNullable: true }),
        categoriesSelected: new FormControl<string[]>([], { nonNullable: true }),
    });

    // loading = signal(true);
    loading = this.trackingSvc.loadingWorkout;

    get exercisesSelected(): FormControl<ExerciseRoutine[]> {
        return this.exercisesForm.get('exercisesSelected') as FormControl<ExerciseRoutine[]>;
    }

    get categoriesSelected(): FormControl<string[]> {
        return this.exercisesForm.get('categoriesSelected') as FormControl<string[]>;
    }

    completeWeek() {
        this.showConfirmDialog.set(true);
        // this.trackingSvc.createTracking();
    }

    onConfirm() {
        this.trackingSvc.createTracking().subscribe({
            next: (res) => console.log(res),
            error: (err) => console.error(err),
        });
    }
}
