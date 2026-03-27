import { Component } from '@angular/core';
import { RoutinePlanForm } from '../../../shared/components/widgets/plans/routine-form/routine-form';

@Component({
    selector: 'app-create',
    standalone: true,
    imports: [RoutinePlanForm],
    templateUrl: './create.html',
})
export class Create {}
