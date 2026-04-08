import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import {
    ExtraSessionFormType,
    ExtraSessionService,
} from '../../../../../core/services/extra-session/extra-session.service';
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
    private service = inject(ExtraSessionService);

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

    ngOnInit() {
        this.service.loadCatalog();

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
