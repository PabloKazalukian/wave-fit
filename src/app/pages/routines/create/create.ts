import { Component } from '@angular/core';
import { RoutineForm } from './components/routine-form/routine-form';

@Component({
    selector: 'app-create',
    standalone: true,
    imports: [RoutineForm],
    templateUrl: './create.html',
    styleUrl: './create.css',
})
export class Create {}
