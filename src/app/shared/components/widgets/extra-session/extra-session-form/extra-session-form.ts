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

@Component({
    selector: 'app-extra-session-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormSelectComponent, ExtraSessionCard, Loading],
    templateUrl: './extra-session-form.html',
})
export class ExtraSessionForm implements OnInit {
    onClose = output<void>();

    private service = inject(ExtraSessionService);
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
            this.workoutState.workoutSession();
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
}
