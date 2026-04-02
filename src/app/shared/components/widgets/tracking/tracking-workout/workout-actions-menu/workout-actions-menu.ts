import { Component, inject, signal, DestroyRef } from '@angular/core';
import { TrackingWorkoutFacade } from '../tracking-workout.facade';
import { CommonModule } from '@angular/common';
import { WorkoutRoutineSelector } from '../workout-routine-selector/workout-routine-selector';
import { DialogComponent } from '../../../../ui/dialog/dialog';
import { RoutineDay } from '../../../../../interfaces/routines.interface';
import { Loading } from '../../../../ui/loading/loading';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkoutStateService } from '../../../../../../core/services/workouts/workout.state';
import { PlanTrackingService } from '../../../../../../core/services/trackings/plan-tracking.service';
import { DateService } from '../../../../../../core/services/date.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
    selector: 'app-workout-actions-menu',
    imports: [CommonModule, DialogComponent, WorkoutRoutineSelector, Loading],
    standalone: true,
    templateUrl: './workout-actions-menu.html',
    styles: ``,
    animations: [
        trigger('dropdownAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(-10px) scale(0.95)' }),
                animate(
                    '0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    style({ opacity: 1, transform: 'translateY(0) scale(1)' }),
                ),
            ]),
            transition(':leave', [
                animate(
                    '0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    style({ opacity: 0, transform: 'translateY(-10px) scale(0.95)' }),
                ),
            ]),
        ]),
    ],
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
                    this.closeRoutineDialog();
                },
                error: () => {
                    this.isLoading.set(false);
                    this.closeRoutineDialog();
                },
            });
    }
}
