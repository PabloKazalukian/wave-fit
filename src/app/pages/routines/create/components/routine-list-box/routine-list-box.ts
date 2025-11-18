// routine-list-box.component.ts
import { Component, Input, Output, EventEmitter, OnInit, inject, DestroyRef } from '@angular/core';
import { RoutineDay, RoutineSummary } from '../../../../../shared/interfaces/routines.interface';
import { FormSelectComponent } from '../../../../../shared/components/ui/select/select';
import { FormControlsOf } from '../../../../../shared/utils/form-types.util';
import {
    options,
    SelectType,
    SelectTypeInput,
} from '../../../../../shared/interfaces/input.interface';
import { NgClass } from '@angular/common';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { BtnComponent } from '../../../../../shared/components/ui/btn/btn';
import { RoutineExerciseForm } from '../../../../exercises/components/routine-exercise-form/routine-exercise-form';

type ExerciseType = FormControlsOf<SelectTypeInput>;

@Component({
    selector: 'app-routine-list-box',
    standalone: true,
    templateUrl: './routine-list-box.html',
    styles: [
        `
            .listbox {
                max-height: 160px;
                overflow: auto;
                padding: 4px;
                border-radius: 8px;
            }
            li {
                padding: 8px;
                border-radius: 6px;
                cursor: pointer;
            }
            li:hover,
            li:focus {
                background: rgba(0, 0, 0, 0.04);
                outline: none;
            }
            .title {
                font-weight: 600;
            }
            .meta {
                font-size: 0.85rem;
                opacity: 0.8;
            }
        `,
    ],
    imports: [FormSelectComponent, FormSelectComponent, BtnComponent, RoutineExerciseForm],
})
export class RoutineListBoxComponent implements OnInit {
    private destroyRef = inject(DestroyRef);

    @Input() items: RoutineSummary[] = [];
    @Output() pick = new EventEmitter<string>();
    @Output() categorySelected = new EventEmitter<string>();
    exerciseForm!: FormGroup<ExerciseType>;
    routinesDays: RoutineDay[] = [];
    isSearchedRoutines: boolean = false;

    show: boolean = false;

    options = options;

    selected?: string;
    constructor(private routinesSvc: RoutinesServices) {}

    ngOnInit(): void {
        this.exerciseForm = this.initForm();
        this.exerciseForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (newValue) => {
                this.isSearchedRoutines = true;
                if (newValue.option)
                    this.routinesSvc.getRoutinesByCategory(newValue.option).subscribe({
                        next: (value) => {
                            this.routinesDays = value.routinesByCategory;
                        },
                        error: (err) => {
                            console.log(err);
                        },
                    });
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

    pickId(id: string) {
        this.selected = id;
        this.pick.emit(id);
    }

    showExercise() {
        this.show = !this.show;
    }

    get selectControl(): FormControl<string> {
        return this.exerciseForm.get('option') as FormControl<string>;
    }
}
