// routine-list-box.component.ts
import { Component, Input, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { RoutineDay, RoutineDayVM } from '../../../../interfaces/routines.interface';
import { FormSelectComponent } from '../../../ui/select/select';
import { options } from '../../../../interfaces/input.interface';
import { FormControl, FormGroup } from '@angular/forms';
import { BtnComponent } from '../../../ui/btn/btn';
import { RoutineExerciseForm } from '../routine-exercise-form/routine-exercise-form';
import { RoutineExercises } from './routine-exercises/routine-exercises';
import { AccordionItemComponent } from '../../../ui/accordion-item/accordion-item';
import { RoutineListBoxFacade } from './routine-list-box.facade';

@Component({
    selector: 'app-routine-list-box',
    standalone: true,
    templateUrl: './routine-list-box.html',
    providers: [RoutineListBoxFacade],
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
    private facade = inject(RoutineListBoxFacade);

    @Input() day!: RoutineDayVM;
    exerciseForm: FormGroup = this.facade.exerciseForm;
    routinesDays: WritableSignal<RoutineDay[]> = this.facade.routinesDays;

    routineSelected: WritableSignal<RoutineDay | null> = this.facade.routineSelected;
    openIndex: WritableSignal<number | null> = this.facade.openIndex;

    isSearchedRoutines = signal<boolean>(false);
    isShowExercises = false;

    show = false;
    creatingRoutine = signal<boolean>(false);

    isSelected = signal<boolean | null>(null);

    options = options;

    ngOnInit(): void {
        this.facade.setDay(this.day);
    }

    showExercise() {
        if (this.selectControl.invalid) {
            console.log('invalid');
            this.selectControl.markAsTouched();
            return;
        }
        this.show = !this.show;
        this.creatingRoutine.set(this.show);
    }

    getNameOfSelectControl(): string {
        const value = options.filter((e) => e.value === this.selectControl.value);
        return value[0].name || '';
    }
    addRoutine(day: RoutineDay) {
        this.facade.addRoutine(day);
    }

    removeRoutine() {
        this.facade.removeRoutine();
    }

    toggleAccordion(i: number) {
        this.openIndex.update((current) => (current === i ? null : i));
    }

    get selectControl(): FormControl<string> {
        return this.exerciseForm.get('option') as FormControl<string>;
    }
}
