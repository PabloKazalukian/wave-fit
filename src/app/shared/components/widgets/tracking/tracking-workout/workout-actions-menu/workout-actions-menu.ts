import { Component, inject, signal } from '@angular/core';
import { TrackingWorkoutFacade } from '../tracking-workout.facade';
import { CommonModule } from '@angular/common';
import { WorkoutRoutineSelector } from '../workout-routine-selector/workout-routine-selector';
import { DialogComponent } from '../../../../ui/dialog/dialog';
import { RoutineDay } from '../../../../../interfaces/routines.interface';

@Component({
    selector: 'app-workout-actions-menu',
    imports: [CommonModule, DialogComponent, WorkoutRoutineSelector],
    standalone: true,
    templateUrl: './workout-actions-menu.html',
    styles: ``,
})
export class WorkoutActionsMenu {
    facade = inject(TrackingWorkoutFacade);

    isRoutineDialogOpen = signal(false);
    isActionsOpen = signal(false);

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
        console.log('Rutina seleccionada:', routine);
        // Implement application of routine to workout session here in the future
        this.closeRoutineDialog();
    }
}
