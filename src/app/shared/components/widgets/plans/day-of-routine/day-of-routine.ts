import { Component, OnInit, signal, DestroyRef, inject } from '@angular/core';
import { DayPlan } from '../../../../interfaces/routines.interface';
import { DayPlanService } from '../../../../../core/services/day-plan/day-plan.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-day-of-routine',
    imports: [],
    standalone: true,
    templateUrl: './day-of-routine.html',
    styles: ``,
})
export class DayOfRoutine implements OnInit {
    private destroyRef = inject(DestroyRef);

    dayPlan = signal<DayPlan[]>([]);
    userId: string = '';

    constructor(private dayPlanSvc: DayPlanService) {}

    ngOnInit(): void {
        this.dayPlanSvc.dayPlan$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (e) => {
                this.dayPlan.set(e);
            },
        });
    }

    changeExpanded(d: DayPlan) {
        this.dayPlanSvc.changeDayPlanExpanded(d);
    }
}
