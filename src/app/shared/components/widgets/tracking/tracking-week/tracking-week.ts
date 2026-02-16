import { Component, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule } from '@angular/forms';
import { TrackingVM, WorkoutSessionVM } from '../../../../interfaces/tracking.interface';
import { DateService, DayWithString } from '../../../../../core/services/date.service';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { SelectTypeInput } from '../../../../interfaces/input.interface';
import { Exercise } from '../../../../interfaces/exercise.interface';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { TrackingWorkoutComponent } from '../tracking-workout/tracking-workout';
import { NavigatorWeek } from './navigator-week/navigator-week';

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
    imports: [CommonModule, FormsModule, NavigatorWeek],
    templateUrl: './tracking-week.html',
})
export class TrackingWeekComponent {
    tracking = input<TrackingVM | null>(null);
    dateSvc = inject(DateService);
    exerciseSvc = inject(ExercisesService);

    exercisesForm = new FormGroup<ExercisesType>({
        exercisesSelected: new FormControl<ExerciseRoutine[]>([], { nonNullable: true }),
        categoriesSelected: new FormControl<string[]>([], { nonNullable: true }),
    });

    // startDate = new Date().toLocaleDateString();
    totalDays = 7;
    visibleDayCount = 4;
    currentDayIndex = 0;
    selectedDay = signal<DayWithString | null>(null);
    loading = signal(true);

    workouts = signal<WorkoutSessionVM[] | undefined>(undefined);

    ngOnInit(): void {
        if (this.tracking()) {
            if (this.tracking()?.workouts !== null) this.workouts.set(this.tracking()?.workouts);
            console.log(this.workouts());
        }
    }

    // getDayExercises(dayNumber: number): ExerciseRoutine[] {
    //     return this.exercises[dayNumber] || [];
    // }

    // getTotalTime(dayNumber: number): number {
    //     const exercises = this.getDayExercises(dayNumber);
    //     return exercises.reduce((total, ex) => total + (ex.time || 0), 0);
    // }

    // toggleExerciseInput(exercise: ExerciseRoutine): void {
    //     // console.log(exercise);
    //     if (exercise.showInput) {
    //         // Está guardando
    //         exercise.showInput = false;
    //         exercise.showDeleteButton = true; // 👈 Mostrar botón X
    //     } else {
    //         // Está editando
    //         exercise.showInput = true;
    //         exercise.showDeleteButton = false; // 👈 Ocultar botón X
    //     }
    // }

    // deleteExercise(exercise: ExerciseRoutine): void {
    //     // event.stopPropagation(); // Evitar que dispare otros clicks

    //     const currentDay = this.selectedDay();
    //     if (currentDay === null) return;

    //     const dayExercises = this.exercises[currentDay.dayNumber];
    //     const index = dayExercises.findIndex((ex) => ex.id === exercise.id);

    //     if (index !== -1) {
    //         dayExercises.splice(index, 1);
    //     }
    // }

    // addNewExercise(name: string): void {
    //     const currentDay = this.selectedDay();
    //     if (currentDay === null) return;

    //     const newExercise: ExerciseRoutine = {
    //         id: Date.now().toString(),
    //         name: name,
    //         description: 'Descripción del ejercicio',
    //         time: null,
    //         showInput: true,
    //         showDeleteButton: false, // 👈 Inicializar
    //     };

    //     if (!this.exercises[currentDay.dayNumber]) {
    //         this.exercises[currentDay.dayNumber] = [];
    //     }
    //     this.exercises[currentDay.dayNumber].push(newExercise);
    // }

    // toggleExercise(exercise: Exercise): void {}

    get exercisesSelected(): FormControl<ExerciseRoutine[]> {
        return this.exercisesForm.get('exercisesSelected') as FormControl<ExerciseRoutine[]>;
    }

    get categoriesSelected(): FormControl<string[]> {
        return this.exercisesForm.get('categoriesSelected') as FormControl<string[]>;
    }
}
