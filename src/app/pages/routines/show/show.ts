import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoutinesServices } from '../../../core/services/routines/routines.service';
import { PlansService } from '../../../core/services/plans/plans.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoutineDay, RoutinePlanCreate } from '../../../shared/interfaces/routines.interface';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';
import { AccordionItemComponent } from '../../../shared/components/ui/accordion-item/accordion-item';
import { ExerciseCategoryPipe } from '../../../shared/pipes/exercise-category.pipe';

@Component({
    selector: 'app-show',
    imports: [AccordionItemComponent, ExerciseCategoryPipe],
    standalone: true,
    templateUrl: './show.html',
    styles: ``,
})
export class Show implements OnInit {
    private destroyRef = inject(DestroyRef);

    userId = signal<string>('');
    routinePlan = signal<RoutinePlanCreate | null>(null);
    isSelected = signal<boolean | null>(null);
    routinesDays = signal<RoutineDay[]>([]);

    private openAccordionIndex = signal<number | null>(0);

    openIndex = signal<number | null>(null);
    constructor(
        private route: ActivatedRoute,
        private svcRoutines: PlansService,
    ) {}

    exerciseCategory = ExerciseCategory;

    ngOnInit() {
        // Subscribe to changes in route parameters (for dynamic updates)
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
            this.userId.set(params['id']);
            console.log('User ID:', this.userId()); // '123' or 'john-doe'
            if (this.userId() !== '' || this.userId() !== undefined || this.userId() !== null) {
                this.svcRoutines
                    .getRoutinePlanById(this.userId())
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe((result: RoutinePlanCreate | null) => {
                        console.log('Routine Plan:', result);
                        this.routinePlan.set(result);
                    });
            }
            // Use the userId to fetch data for that specific user
        });
    }

    isOpen(index: number): boolean {
        return this.openAccordionIndex() === index;
    }

    toggleAccordion(index: number): void {
        this.openAccordionIndex.set(this.openAccordionIndex() === index ? null : index);
    }
}
