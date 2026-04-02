import { Component, inject, signal, DestroyRef } from '@angular/core';
import { TrackingWorkoutFacade } from '../tracking-workout.facade';
import { CommonModule } from '@angular/common';
import { WorkoutRoutineSelector } from '../workout-routine-selector/workout-routine-selector';
import { DialogComponent } from '../../../../ui/dialog/dialog';
import { RoutineDay } from '../../../../../interfaces/routines.interface';
import { Loading } from '../../../../ui/loading/loading';
import { take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkoutStateService } from '../../../../../../core/services/workouts/workout.state';
import { PlanTrackingService } from '../../../../../../core/services/trackings/plan-tracking.service';
import { DateService } from '../../../../../../core/services/date.service';
import { WorkoutApi } from '../../../../../../core/services/workouts/api/workout.api';
import { WorkoutSessionVM } from '../../../../../interfaces/tracking.interface';

@Component({
    selector: 'app-workout-actions-menu',
    imports: [CommonModule, DialogComponent, WorkoutRoutineSelector, Loading],
    standalone: true,
    templateUrl: './workout-actions-menu.html',
    styles: ``,
})
export class WorkoutActionsMenu {
    facade = inject(TrackingWorkoutFacade);
    destroyRef = inject(DestroyRef);
    private workoutState = inject(WorkoutStateService);
    private trackingSvc = inject(PlanTrackingService);
    private dateSvc = inject(DateService);

    isRoutineDialogOpen = signal(false);
    isActionsOpen = signal(false);
    isLoading = signal(false);

    toggleActions() {
        this.isActionsOpen.update((v) => !v);
    }

    openRoutineDialog() {
        this.isRoutineDialogOpen.set(true);
        this.isActionsOpen.set(false);
    }

    closeRoutineDialog() {
        this.isRoutineDialogOpen.set(false);
    }

    onRoutineSelected(routine: RoutineDay) {
        const date = this.workoutState.selectedDate();
        if (!date) return;

        this.isLoading.set(true);

        const dateString = this.dateSvc.formatDate(date);
        console.log('work');

        this.trackingSvc
            .createWorkoutWithRoutine(routine.id, dateString)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    // this.workoutState.setDate(date);
                    // this.isLoading.set(false);
                    this.closeRoutineDialog();
                },
                error: () => {
                    this.isLoading.set(false);
                    this.closeRoutineDialog();
                },
            });

        // this.workoutApi
        //     .assignRoutineToDay(routine.id, dateString)
        //     .pipe(take(1), takeUntilDestroyed(this.destroyRef))
        //     .subscribe({
        //         next: (workout: WorkoutSessionVM| null | undefined) => {
        //             if (workout) {
        //                 const tracking = this.trackingSvc.trackingPlanVM$;
        //                 if (tracking?.id) {
        //                     this.trackingSvc
        //                         .syncTrackingDays(tracking.id)
        //                         .pipe(take(1), takeUntilDestroyed(this.destroyRef))
        //                         .subscribe({
        //                             next: () => {
        //                                 this.workoutState.setDate(date);
        //                                 this.isLoading.set(false);
        //                                 this.closeRoutineDialog();
        //                             },
        //                             error: () => {
        //                                 this.isLoading.set(false);
        //                                 this.closeRoutineDialog();
        //                             },
        //                         });
        //                 } else {
        //                     this.isLoading.set(false);
        //                     this.closeRoutineDialog();
        //                 }
        //             }
        //         },
        //         error: () => {
        //             this.isLoading.set(false);
        //             this.closeRoutineDialog();
        //         },
        //     });
    }
}
