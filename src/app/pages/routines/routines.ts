import { Component, OnInit } from '@angular/core';
import { Select, SelectType } from '../../shared/components/ui/select/select';
import { FormControl, FormGroup } from '@angular/forms';
import { FormControlsOf } from '../../shared/utils/form-types.util';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { UserService } from '../../core/services/user/user.service';

interface FilterSearch {
    option: string;
}
type selectFormType = FormControlsOf<FilterSearch>;

@Component({
    selector: 'app-routines',
    imports: [Select, BtnComponent],
    standalone: true,
    templateUrl: './routines.html',
    styleUrl: './routines.css',
})
export class Routines implements OnInit {
    options: SelectType[] = [
        { name: 'Opción 1', value: '1' },
        { name: 'Opción 2', value: '2' },
        { name: 'Opción 3', value: '3' },
    ];

    selectForm!: FormGroup<selectFormType>;
    showSelected: string = '';

    constructor(private svcUser: UserService) {}

    ngOnInit(): void {
        this.selectForm = this.initForm();

        // this.options =
        this.selectControl.valueChanges.subscribe((newValue) => {
            this.showSelected = newValue;
        });
    }

    initForm(): FormGroup<selectFormType> {
        return new FormGroup<selectFormType>({
            option: new FormControl('', { nonNullable: true }),
        });
    }

    createRoutine() {
        console.log('Crear nueva rutina');
        this.svcUser.getAllUsers().subscribe((result) => {
            console.log('Usuarios:', result.data);
        });
    }

    get selectControl(): FormControl<string> {
        return this.selectForm.get('option') as FormControl<string>;
    }
}
