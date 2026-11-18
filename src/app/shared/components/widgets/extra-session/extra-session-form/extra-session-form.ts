import {
    Component,
    Input,
    Output,
    OnInit,
    OnChanges,
    SimpleChanges,
    EventEmitter,
    signal,
    inject,
    output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import {
    ExtraSessionFormType,
    ExtraSessionService,
} from '../../../../../core/services/extra-session/extra-session.service';
import { FormSelectComponent } from '../../../ui/select/select';
import { SelectType } from '../../../../../shared/interfaces/input.interface';
import {
    ExtraSessionCategory,
    ExtraSessionDisciplineConfig,
    ExtraSessionFormValue,
} from '../../../../../shared/interfaces/extra-session.interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { ExtraSessionCreate } from '../extra-session-create/extra-session-create';

@Component({
    selector: 'app-extra-session-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormSelectComponent, ExtraSessionCreate],
    templateUrl: './extra-session-form.html',
})
export class ExtraSessionForm implements OnInit, OnChanges {
    service = inject(ExtraSessionService);

    @Input() selectedDate?: string;
    @Input() initialExtras?: any[];

    closed = output<void>();
    @Output() saveExtraSession = new EventEmitter<ExtraSessionFormValue>();
    @Output() cancelExtraSession = new EventEmitter<void>();
    @Output() categoryClear = new EventEmitter<void>();
    @Output() disciplineClear = new EventEmitter<void>();

    catalog = toSignal(this.service.catalog$, { initialValue: [] });

    extraSessionForm: FormGroup<ExtraSessionFormType> = this.service.extraSessionForm;

    categories: SelectType[] = [
        { name: 'Cardio', value: ExtraSessionCategory.CARDIO },
        { name: 'Fuerza', value: ExtraSessionCategory.STRENGTH },
        { name: 'Deporte', value: ExtraSessionCategory.SPORT },
        { name: 'Bienestar', value: ExtraSessionCategory.MIND_BODY },
    ];

    disciplineOptions = signal<SelectType[]>([]);

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

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['initialExtras'] && this.initialExtras?.length) {
            this.service.loadByWorkoutSession(this.initialExtras);
        }
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

    get notesControl(): FormControl<string> {
        return this.extraSessionForm.get('notes') as FormControl<string>;
    }

    getDisciplineConfig(): ExtraSessionDisciplineConfig | null {
        const discipline = this.disciplineControl.value;
        if (!discipline) return null;
        return this.catalog().find((c) => c.key === discipline) || null;
    }

    save(): void {
        this.onSave();
    }

    /**
     * Pure I/O: validate and emit the raw form value. The owning container decides
     * where the extra-session is written (active vs deferred), so this component
     * never triggers a mutation itself (FR-009).
     */
    onSave(): void {
        this.extraSessionForm.markAllAsTouched();
        if (this.extraSessionForm.invalid) return;

        this.closed.emit();
        this.saveExtraSession.emit(this.extraSessionForm.value as ExtraSessionFormValue);
    }

    onCategoryClear(): void {
        this.categoryControl.setValue('');
        this.disciplineControl.setValue('');
        this.disciplineOptions.set([]);
        this.closed.emit();
        this.categoryClear.emit();
    }

    onCancel(): void {
        this.closed.emit();
        this.cancelExtraSession.emit();
    }

    onDisciplineClear(): void {
        this.disciplineControl.setValue('');
        this.disciplineClear.emit();
    }

    resetForm(): void {
        this.categoryControl.setValue('');
        this.disciplineControl.setValue('');
        this.disciplineOptions.set([]);
    }
}
