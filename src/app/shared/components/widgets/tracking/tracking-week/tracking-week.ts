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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { delay } from 'rxjs';
import { Loading } from '../../../ui/loading/loading';
import { Router } from '@angular/router';

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
        Loading,
    ],
    templateUrl: './tracking-week.html',
})
export class TrackingWeekComponent {
    tracking = input<TrackingVM | null>(null);
    private readonly router = inject(Router);

    showConfirmDialog = signal(false);

    state = inject(WorkoutStateService);
    trackingSvc = inject(PlanTrackingService);
    readonly loading = this.trackingSvc.loading;

    exercisesForm = new FormGroup<ExercisesType>({
        exercisesSelected: new FormControl<ExerciseRoutine[]>([], { nonNullable: true }),
        categoriesSelected: new FormControl<string[]>([], { nonNullable: true }),
    });

    // loading = signal(true);

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
        this.loading;
        this.trackingSvc
            .completeTracking()
            .pipe(takeUntilDestroyed(this.state.destroyRef))
            .subscribe({
                next: (res) => {
                    console.log(res);
                    this.showConfirmDialog.set(false);
                    this.router.navigate(['/']);
                },
                error: (err) => console.error(err),
            });
    }
}
