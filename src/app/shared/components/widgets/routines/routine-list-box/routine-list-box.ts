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
    computed,
    WritableSignal,
} from '@angular/core';
import { DayPlan, RoutineDay } from '../../../../interfaces/routines.interface';
import { FormSelectComponent } from '../../../ui/select/select';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { options, SelectTypeInput } from '../../../../interfaces/input.interface';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BtnComponent } from '../../../ui/btn/btn';
import { RoutineExerciseForm } from '../routine-exercise-form/routine-exercise-form';
import { ExerciseCategory } from '../../../../interfaces/exercise.interface';
import { RoutineExercises } from './routine-exercises/routine-exercises';
import { AccordionItemComponent } from '../../../ui/accordion-item/accordion-item';
import { PlansService } from '../../../../../core/services/plans/plans.service';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { DayOfRoutine } from '../../plans/day-of-routine/day-of-routine';
import { RoutineListBoxFacade } from './routine-list-box.facade';

type ExerciseType = FormControlsOf<SelectTypeInput>;

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

    @Input() day!: DayPlan;
    exerciseForm: FormGroup = this.facade.exerciseForm;
    routinesDays: WritableSignal<RoutineDay[]> = this.facade.routinesDays;
    // (property) RoutineListBoxComponent.routinesDays: >

    routineSelected: WritableSignal<RoutineDay | null> = this.facade.routineSelected;
    openIndex: WritableSignal<number | null> = this.facade.openIndex;

    isSearchedRoutines = signal<boolean>(false);
    isShowExercises: boolean = false;

    show: boolean = false;
    isSelected = signal<boolean | null>(null);

    options = options;

    ngOnInit(): void {
        this.facade.setDay(this.day);
    }

    showExercise() {
        this.show = !this.show;
    }

    getNameOfSelectControl(): string {
        const value = options.filter((e) => e.value === this.selectControl.value);
        console.log(value);
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
