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
import { PlanTrackingService } from '../../../core/services/trackings/plan-tracking.service';
import { DialogComponent } from '../../../shared/components/ui/dialog/dialog';

@Component({
    selector: 'app-show',
    imports: [AccordionItemComponent, ExerciseCategoryPipe, BtnComponent, NgClass, DialogComponent],
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

    showDialog = signal<boolean>(false);

    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly svcRoutines = inject(PlansService);
    private readonly svcTracking = inject(PlanTrackingService);

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

    navigateToMyWeek() {
        this.router.navigate(['/my-week']);
    }

    initTrackingWithRoutinePlan(): void {
        const plan = this.routinePlan() as any; // Cast to access id if needed, anyway RoutinePlan has id
        if (!plan) return;

        // Verificar si ya tiene una semana activa
        if (this.svcTracking.tracking()) {
            // alert('Ya tienes una semana activa. Debes completarla antes de iniciar una nueva.');
            this.showDialog.set(true);
            return;
        }

        this.isStartingRoutine.set(true);

        this.svcTracking
            .createTracking(plan.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    this.isStartingRoutine.set(false);
                    if (result) {
                        this.router.navigate(['/my-week']);
                    }
                },
                error: (err) => {
                    console.error('Error iniciando rutina semanal:', err);
                    this.isStartingRoutine.set(false);
                },
            });
    }
}
