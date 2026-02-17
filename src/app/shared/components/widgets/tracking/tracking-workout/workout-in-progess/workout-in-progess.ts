import { Component, inject, Input } from '@angular/core';
import { WorkoutInProgressFacade } from './workout-in-progress.facade';
import { AccordionItemComponent } from '../../../../ui/accordion-item/accordion-item';

@Component({
    selector: 'app-workout-in-progess',
    imports: [AccordionItemComponent],
    standalone: true,
    providers: [WorkoutInProgressFacade],
    templateUrl: './workout-in-progess.html',
    styles: ``,
})
export class WorkoutInProgess {
    facade = inject(WorkoutInProgressFacade);

    // ===== UI Event Handlers =====

    // Accordion
    toggleAccordion(exerciseId: string): void {
        this.facade.toggleAccordion(exerciseId);
    }

    // Reps
    incrementReps(exerciseId: string, setIndex: number): void {
        this.facade.incrementReps(exerciseId, setIndex);
    }

    decrementReps(exerciseId: string, setIndex: number): void {
        this.facade.decrementReps(exerciseId, setIndex);
    }

    updateReps(exerciseId: string, setIndex: number, event: Event): void {
        const value = parseInt((event.target as HTMLInputElement).value) || 0;
        this.facade.updateReps(exerciseId, setIndex, value);
    }

    // Weights
    incrementWeight(exerciseId: string, setIndex: number): void {
        this.facade.incrementWeight(exerciseId, setIndex);
    }

    decrementWeight(exerciseId: string, setIndex: number): void {
        this.facade.decrementWeight(exerciseId, setIndex);
    }

    updateWeight(exerciseId: string, setIndex: number, event: Event): void {
        const value = parseFloat((event.target as HTMLInputElement).value) || 0;
        this.facade.updateWeight(exerciseId, setIndex, value);
    }

    // Sets
    addSet(exerciseId: string): void {
        this.facade.addSet(exerciseId);
    }

    removeSet(exerciseId: string): void {
        this.facade.removeSet(exerciseId);
    }

    // Exercise
    removeExercise(exerciseId: string): void {
        this.facade.removeExercise(exerciseId);
    }
}
