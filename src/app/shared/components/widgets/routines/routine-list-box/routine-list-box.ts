// routine-list-box.component.ts
import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnInit,
    inject,
    DestroyRef,
    signal,
} from '@angular/core';
import { RoutineDay, RoutineSummary } from '../../../../interfaces/routines.interface';
import { FormSelectComponent } from '../../../ui/select/select';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { options, SelectTypeInput } from '../../../../interfaces/input.interface';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { BtnComponent } from '../../../ui/btn/btn';
import { RoutineExerciseForm } from '../routine-exercise-form/routine-exercise-form';
import { ExerciseCategory } from '../../../../interfaces/exercise.interface';
import { RoutineExercises } from './routine-exercises/routine-exercises';
import { AccordionItemComponent } from '../../../ui/accordion-item/accordion-item';

type ExerciseType = FormControlsOf<SelectTypeInput>;

@Component({
    selector: 'app-routine-list-box',
    standalone: true,
    templateUrl: './routine-list-box.html',
    imports: [
        FormSelectComponent,
        FormSelectComponent,
        BtnComponent,
        RoutineExerciseForm,
        RoutineExercises,
        AccordionItemComponent,
    ],
})
export class RoutineListBoxComponent implements OnInit {
    private destroyRef = inject(DestroyRef);

    @Output() categorySelected = new EventEmitter<string>();

    exerciseForm!: FormGroup<ExerciseType>;
    routinesDays = signal<RoutineDay[]>([]);
    openIndex = signal<number | null>(null);

    isSearchedRoutines: boolean = false;
    isShowExercises: boolean = false;

    show: boolean = false;
    routineSelected = signal<RoutineDay | null>(null);
    isSelected = signal<boolean | null>(null);

    options = options;

    selected?: string;
    constructor(private routinesSvc: RoutinesServices) {}

    ngOnInit(): void {
        this.exerciseForm = this.initForm();
        this.exerciseForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (newValue) => {
                this.isSearchedRoutines = true;
                const exerCat = ExerciseCategory;
                if (newValue.option !== undefined)
                    if (Object.keys(exerCat).includes(newValue.option)) {
                        this.routinesSvc
                            .getRoutinesByCategory(newValue.option as ExerciseCategory)
                            .subscribe({
                                next: (value) => {
                                    this.routinesDays.set(value.routinesByCategory);
                                },
                                error: (err) => {
                                    console.log(err);
                                },
                            });
                    }
                this.categorySelected.emit(newValue.option);
            },
            error: (err) => {},
        });
    }

    initForm(): FormGroup<ExerciseType> {
        return new FormGroup<ExerciseType>({
            option: new FormControl('', { nonNullable: true }),
        });
    }

    showExercise() {
        this.show = !this.show;
    }

    addRoutine(day: RoutineDay) {
        this.routineSelected.set(day);

        const index = this.routinesDays().findIndex((r) => r.id === day.id);
        this.openIndex.set(index); // ahora sí coincide con el accordion
    }

    removeRoutine() {
        this.routineSelected.set(null);
        this.openIndex.set(null);
    }

    toggleAccordion(i: number) {
        this.openIndex.update((current) => (current === i ? null : i));
    }

    get selectControl(): FormControl<string> {
        return this.exerciseForm.get('option') as FormControl<string>;
    }
}
