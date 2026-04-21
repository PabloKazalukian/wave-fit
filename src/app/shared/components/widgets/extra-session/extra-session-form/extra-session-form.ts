import { Component, inject, OnInit, signal, effect, output, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import {
    ExtraSessionFormType,
    ExtraSessionService,
} from '../../../../../core/services/extra-session/extra-session.service';
import { WorkoutStateService } from '../../../../../core/services/workouts/workout.state';
import { FormSelectComponent } from '../../../ui/select/select';
import { SelectType } from '../../../../../shared/interfaces/input.interface';
import {
    ExtraSessionCategory,
    ExtraSessionDisciplineConfig,
} from '../../../../../shared/interfaces/extra-session.interface';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Loading } from '../../../ui/loading/loading';
import { ExtraSessionCreate } from '../extra-session-create/extra-session-create';
import { DateService } from '../../../../../core/services/date.service';
import { catchError, delay, of, tap } from 'rxjs';

@Component({
    selector: 'app-extra-session-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormSelectComponent, Loading, ExtraSessionCreate],
    templateUrl: './extra-session-form.html',
})
export class ExtraSessionForm implements OnInit {
    destroyRef = inject(DestroyRef);

    closed = output<void>();

    service = inject(ExtraSessionService);
    private workoutState = inject(WorkoutStateService);

    loading = signal<boolean>(false);

    catalog = toSignal(this.service.catalog$, { initialValue: [] });

    extraSessionForm: FormGroup<ExtraSessionFormType> = this.service.extraSessionForm;

    categories: SelectType[] = [
        { name: 'Cardio', value: ExtraSessionCategory.CARDIO },
        { name: 'Fuerza', value: ExtraSessionCategory.STRENGTH },
        { name: 'Deporte', value: ExtraSessionCategory.SPORT },
        { name: 'Bienestar', value: ExtraSessionCategory.MIND_BODY },
    ];

    disciplineOptions = signal<SelectType[]>([]);

    getDisciplineConfig(): ExtraSessionDisciplineConfig | null {
        return this.catalog().find((c) => c.key === this.disciplineControl.value) || null;
    }

    constructor() {
        effect(() => {
            const workoutSession = this.workoutState.workoutSession();
            if (workoutSession?.extras?.length) {
                this.service.loadByWorkoutSession(workoutSession.extras);
            }
            this.resetForm();
        });
    }

    ngOnInit() {
        this.service.loadCatalog();

        this.extraSessionForm.get('category')?.valueChanges.subscribe((category) => {
            this.disciplineOptions.set(
                this.catalog()
                    .filter((c) => c.category === category)
                    .map((c) => ({ name: c.label, value: c.key })),
            );
        });
    }

    get categoryControl(): FormControl<string> {
        return this.extraSessionForm.get('category') as FormControl<string>;
    }

    get disciplineControl(): FormControl<string> {
        return this.extraSessionForm.get('discipline') as FormControl<string>;
    }

    get durationControl(): FormControl<number> {
        return this.extraSessionForm.get('duration') as FormControl<number>;
    }

    get intensityLevelControl(): FormControl<number> {
        return this.extraSessionForm.get('intensityLevel') as FormControl<number>;
    }

    get caloriesControl(): FormControl<number> {
        return this.extraSessionForm.get('calories') as FormControl<number>;
    }

    save(): void {
        this.extraSessionForm.markAllAsTouched();
        if (this.extraSessionForm.invalid) return;

        this.loading.set(true);
        this.service
            .create({
                date: this.workoutState.selectedDate()!, // ✅ LocalDate del timezone del usuario
                discipline: this.disciplineControl.value,
                duration: this.durationControl.value,
                intensityLevel: this.intensityLevelControl.value,
                calories: this.caloriesControl.value || undefined,
                notes: '',
            })
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                tap(() => this.loading.set(true)),
                catchError(() => {
                    this.loading.set(false);
                    return of(null);
                }),
            )
            .subscribe({
                next: () => {
                    this.loading.set(false);
                    this.closed.emit();
                },
                error: (err) => console.error(err),
            });
    }

    onCategoryClear(): void {
        this.categoryControl.setValue('');
        this.disciplineControl.setValue('');
        this.disciplineOptions.set([]);
        this.closed.emit();
    }

    onDisciplineClear(): void {
        this.disciplineControl.setValue('');
    }

    resetForm(): void {
        this.categoryControl.setValue('');
        this.disciplineControl.setValue('');
        this.disciplineOptions.set([]);
    }
}
