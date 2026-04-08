import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators,
    FormControl,
    FormGroup,
} from '@angular/forms';
import { ExtraSessionService } from '../../../../../core/services/extra-session/extra-session.service';
import { FormSelectComponent } from '../../../ui/select/select';
import { ExtraSessionCard } from '../extra-session-card/extra-session-card';
import { SelectType } from '../../../../../shared/interfaces/input.interface';
import {
    ExtraSessionCategory,
    ExtraSessionDisciplineConfig,
} from '../../../../../shared/interfaces/extra-session.interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { Loading } from '../../../ui/loading/loading';
import { ca } from 'date-fns/locale';

type ExtraSessionFormType = FormControlsOf<IExtraSessionForm>;
export interface IExtraSessionForm {
    category: string;
    discipline: string;
    workoutSessionId: string;
    date: Date;
    duration: number;
    intensityLevel: number;
    calories: number;
    notes: string;
}

@Component({
    selector: 'app-extra-session-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormSelectComponent, ExtraSessionCard, Loading],
    templateUrl: './extra-session-form.html',
})
export class ExtraSessionForm implements OnInit {
    private service = inject(ExtraSessionService);
    private fb = inject(FormBuilder);

    catalog = toSignal(this.service.catalog$, { initialValue: [] });

    extraSessionForm!: FormGroup<ExtraSessionFormType>;

    categories: SelectType[] = [
        { name: 'Cardio', value: ExtraSessionCategory.CARDIO },
        { name: 'Fuerza', value: ExtraSessionCategory.STRENGTH },
        { name: 'Deporte', value: ExtraSessionCategory.SPORT },
        { name: 'Bienestar', value: ExtraSessionCategory.MIND_BODY },
    ];

    disciplineOptions = signal<SelectType[]>([]);

    // selectedDisciplineConfig = computed<ExtraSessionDisciplineConfig | null>(() => {
    //     const disc = this.disciplineControl.value;
    //     console.log(disc);
    //     if (!disc) return null;
    //     console.log(this.catalog().find((c) => c.key === disc));
    //     return this.catalog().find((c) => c.key === disc) || null;
    // });

    getDisciplineConfig(): ExtraSessionDisciplineConfig | null {
        return this.catalog().find((c) => c.key === this.disciplineControl.value) || null;
    }

    constructor() {
        // effect(() => {
        // Whenever category changes, reset discipline
        // const cat = this.categoryControl.value;
        // if (cat) {
        // this.disciplineControl.reset();
        // }
        // });
    }

    ngOnInit() {
        this.service.loadCatalog();
        this.extraSessionForm = this.initForm();

        this.extraSessionForm.get('category')?.valueChanges.subscribe((category) => {
            console.log(category, this.catalog());
            ExtraSessionCategory;
            this.disciplineOptions.set(
                this.catalog()
                    .filter((c) => c.category === category)
                    .map((c) => ({ name: c.label, value: c.key })),
            );
        });

        // Manual subscribe to form changes to trigger computed signals if effect doesn't catch reactive form change.
        // this.categoryControl.valueChanges.subscribe(() => {
        //     this.disciplineControl.reset();
        // });
    }

    initForm(): FormGroup<ExtraSessionFormType> {
        return new FormGroup<ExtraSessionFormType>({
            category: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(3)],
            }),
            discipline: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(3)],
            }),
            workoutSessionId: new FormControl('', { nonNullable: true }),
            date: new FormControl(new Date(), { nonNullable: true }),
            duration: new FormControl(0, { nonNullable: true }),
            intensityLevel: new FormControl(0, { nonNullable: true }),
            calories: new FormControl(0, { nonNullable: true }),
            notes: new FormControl('', { nonNullable: true }),
        });
    }

    get categoryControl(): FormControl<string> {
        return this.extraSessionForm.get('category') as FormControl<string>;
    }

    get disciplineControl(): FormControl<string> {
        return this.extraSessionForm.get('discipline') as FormControl<string>;
    }

    resetForm() {
        // this.categoryControl.reset();
        // this.disciplineControl.reset();
    }
}
