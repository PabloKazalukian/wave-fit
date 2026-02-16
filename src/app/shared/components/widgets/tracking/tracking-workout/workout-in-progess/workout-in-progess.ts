import { Component, computed, effect, inject, Input, input, output, signal } from '@angular/core';
import { WorkoutInProgressFacade } from './workout-in-progress.facade';
import { ExercisePerformanceVM } from '../../../../../interfaces/tracking.interface';
import { AccordionItemComponent } from '../../../../ui/accordion-item/accordion-item';

interface SetData {
    reps: number;
    weights: number;
}

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

    exercisesSelected = input<ExercisePerformanceVM[]>([]);
    removeExerciseEvent = output<string>();
    @Input() workoutDate!: Date | null;

    workoutDateChanges = computed(() => this.facade.workoutDate.set(this.workoutDate));

    private openAccordionIndex = signal<string[]>([]);

    private exerciseSetsData = signal<Map<string, SetData[]>>(new Map());

    constructor() {
        effect(() => {
            const eff = this.exercisesSelected();
            this.facade.workoutDate.set(this.workoutDate);
            if (eff !== null && eff !== undefined) {
                this.facade.exercisesSelected.set(eff);
                this.initializeSetsData(eff);
            }
        });
    }

    private initializeSetsData(exercises: ExercisePerformanceVM[]): void {
        const newMap = new Map<string, SetData[]>();
        exercises.forEach((ex) => {
            const sets =
                ex.sets === undefined
                    ? []
                    : ex.sets.map((set) => ({
                          sets: set,
                          reps: set.reps,
                          weights: set.weights !== undefined ? set.weights : 0,
                      }));

            newMap.set(ex.exerciseId!, sets);
        });
        this.exerciseSetsData.set(newMap);
    }

    open(index: string): boolean {
        return this.openAccordionIndex()?.includes(index) ?? false;
    }

    toggleAccordion(index: string): void {
        if (this.openAccordionIndex() === null) {
            this.openAccordionIndex.set([index]);
        } else {
            this.openAccordionIndex.set(
                this.openAccordionIndex()?.includes(index)
                    ? this.openAccordionIndex().filter((i) => i !== index)
                    : [...this.openAccordionIndex(), index],
            );
        }
    }

    getSets(exercise: ExercisePerformanceVM): SetData[] {
        return this.exerciseSetsData().get(exercise.exerciseId!) || [];
    }

    // Reps controls
    incrementReps(exerciseId: string, setIndex: number): void {
        this.updateSetData(exerciseId, setIndex, 'reps', 1);
    }

    decrementReps(exerciseId: string, setIndex: number): void {
        this.updateSetData(exerciseId, setIndex, 'reps', -1);
    }

    updateReps(exerciseId: string, setIndex: number, event: Event): void {
        const value = parseInt((event.target as HTMLInputElement).value) || 0;
        this.updateSetData(exerciseId, setIndex, 'reps', value, true);
    }

    // Weight controls (increments by 2.5kg)
    incrementWeight(exerciseId: string, setIndex: number): void {
        this.updateSetData(exerciseId, setIndex, 'weights', 2.5);
    }

    decrementWeight(exerciseId: string, setIndex: number): void {
        this.updateSetData(exerciseId, setIndex, 'weights', -2.5);
    }

    updateWeight(exerciseId: string, setIndex: number, event: Event): void {
        const value = parseFloat((event.target as HTMLInputElement).value) || 0;
        this.updateSetData(exerciseId, setIndex, 'weights', value, true);
    }

    removeExercise(exerciseId: string): void {
        // this.exercisesSelected.set(this.exercisesSelected().filter((ex) => ex.exerciseId !== exerciseId));
        // console.log(exerciseId);
        this.removeExerciseEvent.emit(exerciseId);
        // this.facade.removeSet(exerciseId);
    }

    // Generic update function
    private updateSetData(
        exerciseId: string,
        setIndex: number,
        field: 'reps' | 'weights',
        value: number,
        isAbsolute = false,
    ): void {
        const currentMap = new Map(this.exerciseSetsData());
        const sets = currentMap.get(exerciseId);

        if (sets && sets[setIndex]) {
            if (isAbsolute) {
                sets[setIndex][field] = Math.max(0, value);
            } else {
                sets[setIndex][field] = Math.max(0, sets[setIndex][field] + value);
            }
            currentMap.set(exerciseId, [...sets]);
            this.exerciseSetsData.set(currentMap);

            // Cache to service
            this.facade.updateExercisePerformance(exerciseId, sets);
        }
    }

    // Add/Remove sets
    addSet(exerciseId: string): void {
        const currentMap = new Map(this.exerciseSetsData());
        const sets = currentMap.get(exerciseId) || [];
        sets.push({ reps: 10, weights: 0 });
        currentMap.set(exerciseId, [...sets]);
        this.exerciseSetsData.set(currentMap);

        this.facade.updateExercisePerformance(exerciseId, sets);
    }

    removeSet(exerciseId: string): void {
        const currentMap = new Map(this.exerciseSetsData());
        const sets = currentMap.get(exerciseId) || [];
        if (sets.length > 1) {
            sets.pop();
            currentMap.set(exerciseId, [...sets]);
            this.exerciseSetsData.set(currentMap);
            this.facade.updateExercisePerformance(exerciseId, sets);
        } else {
            this.facade.updateExercisePerformance(exerciseId, []);
        }
    }
}
