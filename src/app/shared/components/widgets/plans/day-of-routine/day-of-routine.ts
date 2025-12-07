import {
    Component,
    input,
    OnChanges,
    effect,
    OnInit,
    SimpleChanges,
    signal,
    DestroyRef,
    inject,
} from '@angular/core';
import { DayPlan } from '../../../../interfaces/routines.interface';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { PlansService } from '../../../../../core/services/plans/plans.service';
import { DayPlanService } from '../../../../../core/services/day-plan/day-plan.service';
import { AuthService } from '../../../../../core/services/auth/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-day-of-routine',
    imports: [],
    standalone: true,
    templateUrl: './day-of-routine.html',
    styles: ``,
})
export class DayOfRoutine implements OnInit {
    // public dayPlan = input<DayPlan[]>();
    private destroyRef = inject(DestroyRef);

    dayPlan = signal<DayPlan[]>([]);
    userId: string = '';

    constructor(
        private routineSvc: RoutinesServices,
        private planSvc: PlansService,
        private authSvc: AuthService,
        private dayPlanSvc: DayPlanService,
    ) {}

    ngOnInit(): void {
        // this.planSvc.routinePlan$.subscribe({
        //     next: (e) => {
        //         console.log(e);
        //     },
        // });

        this.dayPlanSvc.dayPlan$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (e) => {
                this.dayPlan.set(e);
            },
        });
    }

    // syncEffect = effect(() => {
    //     const value = this.dayPlan();
    //     console.log('valuarte', value);
    // });

    changeExpanded(d: DayPlan) {
        this.dayPlanSvc.changeDayPlanExpanded(d);
    }
}
