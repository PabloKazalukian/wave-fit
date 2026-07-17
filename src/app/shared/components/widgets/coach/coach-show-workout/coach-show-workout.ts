import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { BtnComponent } from '../../../ui/btn/btn';
import { DialogComponent } from '../../../ui/dialog/dialog';
import { ExerciseCategoryPipe } from '../../../../pipes/exercise-category.pipe';

@Component({
    selector: 'app-coach-show-workout',
    imports: [CommonModule, BtnComponent, DialogComponent, ExerciseCategoryPipe],

    templateUrl: './coach-show-workout.html',
    styles: ``,
})
export class CoachShowWorkout {
    // facade = inject(TrackingWorkoutFacade);

    isDeleteDialogOpen = signal(false);

    openDeleteDialog() {
        this.isDeleteDialogOpen.set(true);
    }

    closeDeleteDialog() {
        this.isDeleteDialogOpen.set(false);
    }

    confirmDelete() {
        // this.facade.removeWorkoutSession().subscribe(() => {
        //     this.closeDeleteDialog();
        // });
    }
}
