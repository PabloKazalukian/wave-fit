import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoutinesServices } from '../../../core/services/routines/routines.service';
import { PlansService } from '../../../core/services/plans/plans.service';

@Component({
    selector: 'app-show',
    imports: [],
    standalone: true,
    templateUrl: './show.html',
    styles: ``,
})
export class Show implements OnInit {
    userId = signal<string>('');
    constructor(
        private route: ActivatedRoute,
        private svcRoutines: PlansService,
    ) {}

    ngOnInit() {
        // Subscribe to changes in route parameters (for dynamic updates)
        this.route.params.subscribe((params) => {
            this.userId.set(params['id']);
            console.log('User ID:', this.userId()); // '123' or 'john-doe'
            if (this.userId() !== '' || this.userId() !== undefined || this.userId() !== null) {
                this.svcRoutines.getRoutinePlanById(this.userId()).subscribe((result) => {
                    console.log('Routine Plan:', result);
                });
            }
            // Use the userId to fetch data for that specific user
        });
    }
}
