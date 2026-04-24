import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlansService } from '../../../core/services/plans/plans.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    DayIndex,
    KindType,
    RoutineDay,
    RoutineDayCreate,
    RoutinePlanCreate,
    RoutinePlanVM,
} from '../../../shared/interfaces/routines.interface';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';
import { AccordionItemComponent } from '../../../shared/components/ui/accordion-item/accordion-item';
import { ExerciseCategoryPipe } from '../../../shared/pipes/exercise-category.pipe';
import { BtnComponent } from '../../../shared/components/ui/btn/btn';
import { NgClass } from '@angular/common';
import { PlanTrackingService } from '../../../core/services/trackings/plan-tracking.service';
import { DialogComponent } from '../../../shared/components/ui/dialog/dialog';
import { Loading } from '../../../shared/components/ui/loading/loading';
import { delay, tap } from 'rxjs';

@Component({
    selector: 'app-show',
    imports: [
        AccordionItemComponent,
        ExerciseCategoryPipe,
        BtnComponent,
        NgClass,
        DialogComponent,
        Loading,
    ],
    standalone: true,
    templateUrl: './show.html',
    styles: ``,
})
export class Show implements OnInit {
    private destroyRef = inject(DestroyRef);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly svcRoutines = inject(PlansService);
    private readonly svcTracking = inject(PlanTrackingService);

    userId = signal<string>('');
    routinePlan = signal<RoutinePlanCreate | null>(null);

    muscleGroups = computed(() => {
        const plan = this.routinePlan();
        if (!plan) return [];
        const categories = new Set<ExerciseCategory>();
        plan.routineDays.forEach((day) => {
            day.exercises?.forEach((exercise) => {
                if (exercise.category) {
                    categories.add(exercise.category);
                }
            });
        });
        return Array.from(categories);
    });

    loading = signal<boolean>(true);

    isStartingRoutine = signal<boolean>(false);

    private openAccordionIndex = signal<number | null>(0);
    openIndex = signal<number | null>(null);

    showDialog = signal<boolean>(false);

    ngOnInit() {
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
            this.userId.set(params['id']);
            if (this.userId() !== '' || this.userId() !== undefined || this.userId() !== null) {
                this.svcRoutines
                    .getRoutinePlanById(this.userId())
                    .pipe(
                        takeUntilDestroyed(this.destroyRef),
                        tap(() => this.loading.set(false)),
                    )
                    .subscribe((result: RoutinePlanVM | null | undefined) => {
                        if (!result) return;
                        const { routineDays, ...rest } = result;
                        const routineDaysParsed: RoutineDayCreate[] = routineDays.map((day) => ({
                            id: day.id as string,
                            exercises: day.exercises,
                            type: day.type as ExerciseCategory[] | string[],
                            kind: day.kind as KindType,
                            title: day.title as string,
                            day: day.day as DayIndex,
                        }));
                        const routinePlanParsed: RoutinePlanCreate = {
                            id: rest.id as string,
                            name: rest.name as string,
                            description: rest.description as string,
                            weekly_distribution: rest.weekly_distribution as string,
                            routineDays: routineDaysParsed,
                        };
                        console.log(routinePlanParsed);
                        this.routinePlan.set(routinePlanParsed);
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
        const plan = this.routinePlan(); // Cast to access id if needed, anyway RoutinePlan has id
        if (!plan) return;

        // Verificar si ya tiene una semana activa
        if (this.svcTracking.tracking()) {
            // alert('Ya tienes una semana activa. Debes completarla antes de iniciar una nueva.');
            this.showDialog.set(true);
            return;
        }

        this.isStartingRoutine.set(true);
        this.loading.set(true);

        this.svcTracking
            .createTracking(plan.id)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                tap(() => this.loading.set(true)),
                delay(1000),
            )
            .subscribe({
                next: (result) => {
                    this.isStartingRoutine.set(false);
                    this.loading.set(false);
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
