import { Component, inject, signal } from '@angular/core';
import { TrackingWorkoutFacade } from '../tracking-workout.facade';
import { CommonModule } from '@angular/common';
import { BtnComponent } from '../../../../ui/btn/btn';
import { DialogComponent } from '../../../../ui/dialog/dialog';

@Component({
    selector: 'app-workout-complete-list',
    imports: [CommonModule, BtnComponent, DialogComponent],
    standalone: true,
    templateUrl: './workout-complete-list.html',
    styles: ``,
})
export class WorkoutCompleteList {
    facade = inject(TrackingWorkoutFacade);

    isDeleteDialogOpen = signal(false);

    openDeleteDialog() {
        this.isDeleteDialogOpen.set(true);
    }

    closeDeleteDialog() {
        this.isDeleteDialogOpen.set(false);
    }

    confirmDelete() {
        this.facade.removeWorkoutSession();
        this.closeDeleteDialog();
    }
}
