import {
    Component,
    Input,
    Output,
    OnInit,
    EventEmitter,
    signal,
    inject,
    DestroyRef,
    effect,
    output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import {
    ExtraSessionFormType,
    ExtraSessionService,
} from '../../../../../core/services/extra-session/extra-session.service';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';
import { FormSelectComponent } from '../../../ui/select/select';
import { SelectType } from '../../../../../shared/interfaces/input.interface';
import {
    ExtraSessionCategory,
    ExtraSessionDisciplineConfig,
} from '../../../../../shared/interfaces/extra-session.interface';
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
    private destroyRef = inject(DestroyRef);
    service = inject(ExtraSessionService);
    private store = inject(WORKOUT_STORE);

    @Input() selectedDate?: string;
    @Input() initialExtras?: any[];

    closed = output<void>();
    @Output() saveExtraSession = new EventEmitter<ExtraSessionFormType>();
    @Output() cancelExtraSession = new EventEmitter<void>();
    @Output() categoryClear = new EventEmitter<void>();
    @Output() disciplineClear = new EventEmitter<void>();

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

    constructor() {
        effect(() => {
            const workoutSession = this.store.workoutSession();
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

    onSave(): void {
        this.extraSessionForm.markAllAsTouched();
        if (this.extraSessionForm.invalid) return;

        const date = (this.selectedDate || this.store.selectedDate())!;

        this.loading.set(true);
        this.service
            .create({
                date,
                discipline: this.disciplineControl.value,
                duration: this.durationControl.value,
                intensityLevel: this.intensityLevelControl.value,
                calories: this.caloriesControl.value || undefined,
                notes: this.notesControl.value,
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
                    this.saveExtraSession.emit(this.extraSessionForm.value as any);
                },
                error: (err) => console.error(err),
            });
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
