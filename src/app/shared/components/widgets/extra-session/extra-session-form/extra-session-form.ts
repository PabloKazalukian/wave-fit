import { Component, inject, OnInit, signal, effect, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import {
    ExtraSessionFormType,
    ExtraSessionService,
} from '../../../../../core/services/extra-session/extra-session.service';
import { WorkoutStateService } from '../../../../../core/services/workouts/workout.state';
import { FormSelectComponent } from '../../../ui/select/select';
import { ExtraSessionCard } from '../extra-session-card/extra-session-card';
import { SelectType } from '../../../../../shared/interfaces/input.interface';
import {
    ExtraSessionCategory,
    ExtraSessionDisciplineConfig,
} from '../../../../../shared/interfaces/extra-session.interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { Loading } from '../../../ui/loading/loading';
import { ExtraSessionCreate } from '../extra-session-create/extra-session-create';

@Component({
    selector: 'app-extra-session-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormSelectComponent,
        ExtraSessionCard,
        Loading,
        ExtraSessionCreate,
    ],
    templateUrl: './extra-session-form.html',
})
export class ExtraSessionForm implements OnInit {
    onClose = output<void>();

    service = inject(ExtraSessionService);
    private workoutState = inject(WorkoutStateService);

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
            if (workoutSession?.id) {
                this.service.loadByWorkoutSession(workoutSession.id);
            }
            this.resetForm();
        });
    }

    ngOnInit() {
        this.service.loadCatalog();

        this.extraSessionForm.get('category')?.valueChanges.subscribe((category) => {
            ExtraSessionCategory;
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

    save() {
        this.extraSessionForm.markAllAsTouched();
        if (this.extraSessionForm.invalid) return;

        const workoutSession = this.workoutState.workoutSession();
        if (!workoutSession || !workoutSession.id) {
            console.error('No active workout session found to attach extra session to.');
            return;
        }

        this.service
            .create({
                workoutSessionId: workoutSession.id,
                date: new Date().toISOString(),
                discipline: this.disciplineControl.value,
                duration: this.durationControl.value,
                intensityLevel: this.intensityLevelControl.value,
                calories: this.caloriesControl.value || undefined,
                notes: '',
            })
            .subscribe({
                next: () => {
                    this.onClose.emit();
                },
                error: (err) => console.error(err),
            });
    }

    onCategoryClear() {
        this.categoryControl.setValue('');
        this.disciplineControl.setValue('');
        this.disciplineOptions.set([]);
        this.onClose.emit();
    }

    onDisciplineClear() {
        this.disciplineControl.setValue('');
    }

    resetForm() {
        this.categoryControl.setValue('');
        this.disciplineControl.setValue('');
        this.disciplineOptions.set([]);
    }

    deleteExtraSession(id: string) {
        this.service.remove(id).subscribe({
            error: (err) => console.error(err),
        });
    }

    updateExtraSession(data: {
        id: string;
        duration: number;
        intensityLevel: number;
        calories?: number;
    }) {
        this.service
            .update({
                id: data.id,
                duration: data.duration,
                intensityLevel: data.intensityLevel,
                calories: data.calories,
            })
            .subscribe({
                error: (err) => console.error(err),
            });
    }
}
