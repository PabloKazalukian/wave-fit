import { Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { ExercisesService } from '../../../../core/services/exercises/exercises.service';
import { Exercise } from '../../../../shared/interfaces/exercise.interface';
import { tap } from 'rxjs';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-routine-exercise-form',
    standalone: true,
    imports: [Loading],
    templateUrl: './routine-exercise-form.html',
    styleUrl: './routine-exercise-form.css',
})
export class RoutineExerciseForm implements OnInit {
    private destroyRef = inject(DestroyRef);

    @Input() categoryExercise!: string;

    loading = signal(false);
    exercises = signal<Exercise[]>([]);

    constructor(private exerciseSvc: ExercisesService) {}

    ngOnInit(): void {
        this.loading.set(true);

        this.exerciseSvc
            .getExercises()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (value) => {
                    this.exercises.set(value); // reactivo ✔️
                    this.loading.set(false); // reactivo ✔️
                },
                error: () => this.loading.set(false),
            });
    }
}
