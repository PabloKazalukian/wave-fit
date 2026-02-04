import { Component, OnInit, output, signal } from '@angular/core';
import { FormSelectComponent } from '../../../../ui/select/select';
import { FormControlsOf } from '../../../../../utils/form-types.util';
import { SelectTypeInput } from '../../../../../interfaces/input.interface';
import { FormControl, FormGroup } from '@angular/forms';

type selectFormType = FormControlsOf<SelectTypeInput>;

@Component({
    selector: 'app-card-add-extra',
    imports: [FormSelectComponent],
    standalone: true,
    templateUrl: './card-add-extra.html',
    styles: ``,
})
export class CardAddExtra implements OnInit {
    selectForm = new FormGroup<selectFormType>({
        option: new FormControl('', { nonNullable: true }),
    });
    options = [
        { name: 'Yoga', value: 'Yoga' },
        { name: 'Caminata', value: 'Caminata' },
        { name: 'Pilates', value: 'Pilates' },
        { name: 'Bike', value: 'Bike' },
        { name: 'Running', value: 'Running' },
        { name: 'Cycling', value: 'Cycling' },
        { name: 'Swimming', value: 'Swimming' },
        { name: 'Boxing', value: 'Boxing' },
    ];

    showSelect = signal<boolean>(false);

    addExercise = output<string>();

    ngOnInit(): void {
        this.selectControl.valueChanges.subscribe((value) => {
            this.addExercise.emit(value);
            this.showSelect.set(false);
            // this.selectForm.patchValue({ option: '' });
            this.selectControl.setValue('', { emitEvent: false });
        });
    }

    addNewExercise(): void {
        this.showSelect.set(!this.showSelect());
        // this.addExercise.emit();
    }

    onClear(): void {
        this.showSelect.set(false);
        this.selectForm.get('option')?.setValue('');
    }

    get selectControl(): FormControl<string> {
        return this.selectForm.get('option') as FormControl<string>;
    }
}
