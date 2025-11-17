import {
    Component,
    DestroyRef,
    inject,
    Input,
    OnChanges,
    OnInit,
    signal,
    SimpleChanges,
} from '@angular/core';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { Exercise } from '../../../../../shared/interfaces/exercise.interface';
import { Loading } from '../../../../../shared/components/ui/loading/loading';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-routine-exercise-form',
    standalone: true,
    imports: [Loading],
    templateUrl: './routine-exercise-form.html',
    styleUrl: './routine-exercise-form.css',
})
export class RoutineExerciseForm implements OnInit, OnChanges {
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
                    console.log(value);
                    const valueFiltered: Exercise[] = value.filter(
                        (v) => v.category === this.categoryExercise
                    );
                    this.exercises.set(valueFiltered);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false),
            });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['categoryExercise'] && !changes['categoryExercise'].firstChange) {
            const newCategory = this.categoryExercise;

            // Si ya tengo ejercicios cacheados:
            const allExercises = this.exerciseSvc.exercises();
            if (allExercises.length > 0) {
                this.exercises.set(allExercises.filter((e) => e.category === newCategory));
                return;
            }

            // Si NO tengo cache → pido una sola vez
            this.loading.set(true);
            this.exerciseSvc.getExercises().subscribe({
                next: (value) => {
                    const filtered = value.filter((e) => e.category === newCategory);
                    this.exercises.set(filtered);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false),
            });
        }
    }
}
