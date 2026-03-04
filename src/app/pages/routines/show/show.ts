import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlansService } from '../../../core/services/plans/plans.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoutineDay, RoutinePlanCreate } from '../../../shared/interfaces/routines.interface';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';
import { AccordionItemComponent } from '../../../shared/components/ui/accordion-item/accordion-item';
import { ExerciseCategoryPipe } from '../../../shared/pipes/exercise-category.pipe';
import { BtnComponent } from '../../../shared/components/ui/btn/btn';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-show',
    imports: [AccordionItemComponent, ExerciseCategoryPipe, BtnComponent, NgClass],
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

    isStartingRoutine = signal<boolean>(false);

    private openAccordionIndex = signal<number | null>(0);
    openIndex = signal<number | null>(null);

    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly svcRoutines = inject(PlansService);

    exerciseCategory = ExerciseCategory;

    ngOnInit() {
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
            this.userId.set(params['id']);
            if (this.userId() !== '' || this.userId() !== undefined || this.userId() !== null) {
                this.svcRoutines
                    .getRoutinePlanById(this.userId())
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe((result: RoutinePlanCreate | null) => {
                        this.routinePlan.set(result);
                    });
            }
        });
    }

    isOpen(index: number): boolean {
        return this.openAccordionIndex() === index;
    }

    toggleAccordion(index: number): void {
        this.openAccordionIndex.set(this.openAccordionIndex() === index ? null : index);
    }

    initTrackingWithRoutinePlan(): void {
        const plan = this.routinePlan();
        if (!plan) return;

        this.isStartingRoutine.set(true);

        //     this.svcRoutines
        //         .initWeeklyTracking(plan)
        //         .pipe(takeUntilDestroyed(this.destroyRef))
        //         .subscribe({
        //             next: (result) => {
        //                 this.isStartingRoutine.set(false);
        //                 // Navegar al tracking creado o a la pantalla de rutina activa
        //                 this.router.navigate(['/tracking', result?.id]);
        //             },
        //             error: (err) => {
        //                 console.error('Error iniciando rutina semanal:', err);
        //                 this.isStartingRoutine.set(false);
        //             },
        //         });
    }
}
