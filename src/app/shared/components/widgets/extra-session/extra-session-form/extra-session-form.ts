import { Component, Input, Output, OnInit, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import {
    ExtraSessionFormType,
    ExtraSessionService,
} from '../../../../../core/services/extra-session/extra-session.service';
import { FormSelectComponent } from '../../../ui/select/select';
import { SelectType } from '../../../../../shared/interfaces/input.interface';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Loading } from '../../../ui/loading/loading';
import { ExtraSessionCreate } from '../extra-session-create/extra-session-create';
import { catchError, of, tap } from 'rxjs';

@Component({
    selector: 'app-extra-session-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormSelectComponent, Loading, ExtraSessionCreate],
    templateUrl: './extra-session-form.html',
})
export class ExtraSessionForm implements OnInit {
    @Output() saveExtraSession = new EventEmitter<ExtraSessionFormType>();
    @Output() cancelExtraSession = new EventEmitter<void>();
    @Output() categoryClear = new EventEmitter<void>();
    @Output() disciplineClear = new EventEmitter<void>();

    @Input() selectedDate!: string;
    @Input() initialExtras!: any[] | undefined;

    constructor() {
        // Removed store-dependent effect from constructor
    }

    service = inject(ExtraSessionService);

    @Input() disciplineOptions: SelectType[] = [];

    loading = signal<boolean>(false);

    catalog = toSignal(this.service.catalog$, { initialValue: [] });

    extraSessionForm: FormGroup<ExtraSessionFormType> = this.service.extraSessionForm;

    ngOnInit() {
        this.service.loadCatalog();

        this.extraSessionForm.get('category')?.valueChanges.subscribe((category) => {
            this.disciplineOptions = this.catalog()
                .filter((c) => c.category === category)
                .map((c) => ({ name: c.label, value: c.key }));
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

    get notesControl(): FormControl<string> {
        return this.extraSessionForm.get('notes') as FormControl<string>;
    }

    getDisciplineConfig(): { key: string; label: string } | null {
        const category = this.categoryControl.value;
        if (!category) return null;
        const config = this.catalog()
            .find((c) => c.category === category);
        return config || null;
    }

    onSave(): void {
        this.extraSessionForm.markAllAsTouched();
        if (this.extraSessionForm.invalid) return;

        this.loading.set(true);
        this.service
            .create({
                date: this.selectedDate!, // ✅ LocalDate del timezone del usuario
                discipline: this.disciplineControl.value,
                duration: this.durationControl.value,
                intensityLevel: this.intensityLevelControl.value,
                calories: this.caloriesControl.value || undefined,
                notes: this.notesControl.value,
            })
            .pipe(
                takeUntilDestroyed(),
                tap(() => this.loading.set(true)),
                catchError(() => {
                    this.loading.set(false);
                    return of(null);
                }),
            )
            .subscribe({
                next: () => {
                    this.loading.set(false);
                    this.saveExtraSession.emit();
                },
                error: (err) => console.error(err),
            });
    }

    onCategoryClear(): void {
        this.categoryControl.setValue('');
        this.disciplineControl.setValue('');
        this.disciplineOptions = [];
        this.categoryClear.emit();
    }

    onCancel(): void {
        this.cancelExtraSession.emit();
    }

    onDisciplineClear(): void {
        this.disciplineControl.setValue('');
        this.disciplineClear.emit();
    }

    resetForm(): void {
        this.categoryControl.setValue('');
        this.disciplineControl.setValue('');
    }
}