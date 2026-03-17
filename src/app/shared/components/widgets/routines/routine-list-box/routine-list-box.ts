// routine-list-box.component.ts
import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { RoutineDay } from '../../../../interfaces/routines.interface';
import { FormSelectComponent } from '../../../ui/select/select';
import { options } from '../../../../interfaces/input.interface';
import { FormControl, FormGroup } from '@angular/forms';
import { BtnComponent } from '../../../ui/btn/btn';
import { RoutineExerciseForm } from '../routine-exercise-form/routine-exercise-form';
import { RoutineExercises } from './routine-exercises/routine-exercises';
import { AccordionItemComponent } from '../../../ui/accordion-item/accordion-item';
import { RoutineListBoxFacade } from './routine-list-box.facade';
import { Loading } from '../../../ui/loading/loading';

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
        Loading,
    ],
})
export class RoutineListBoxComponent implements OnInit {
    facade = inject(RoutineListBoxFacade);
    exerciseForm: FormGroup = this.facade.exerciseForm;

    openIndex: WritableSignal<number | null> = this.facade.openIndex;

    isSearchedRoutines = signal<boolean>(false);
    isShowExercises = false;

    show = signal<boolean>(false);

    isSelected = signal<boolean | null>(null);

    options = options;

    ngOnInit(): void {
        this.facade.init();
    }

    showExercise() {
        if (this.selectControl.invalid) {
            this.selectControl.markAsTouched();
            return;
        }
        this.show.set(!this.show());
        this.facade.creatingRoutine.set(this.show());
    }

    getNameOfSelectControl(): string {
        const value = options.filter((e) => e.value === this.selectControl.value);
        if (value.length === 0) return '';
        return value[0].name || '';
    }

    addRoutine(day: RoutineDay) {
        this.facade.addRoutine(day);
    }

    removeRoutine() {
        this.facade.removeRoutine();
    }

    removeCateogry() {
        this.facade.removeCateogry();
        this.show.set(false);
        this.facade.creatingRoutine.set(this.show());
    }

    toggleAccordion(i: number) {
        this.openIndex.update((current) => (current === i ? null : i));
    }

    get selectControl(): FormControl<string> {
        return this.exerciseForm.get('option') as FormControl<string>;
    }
}
