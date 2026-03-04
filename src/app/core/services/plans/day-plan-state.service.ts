import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { switchMap, tap, take } from 'rxjs/operators';
import { PlansService } from './plans.service';
import { RoutineDayVM, RoutineDay, DayIndex } from '../../../shared/interfaces/routines.interface';
import { RoutinesServices } from '../routines/routines.service';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';

@Injectable({
    providedIn: 'root',
})
export class DayPlanStateService {
    private destroyRef = inject(DestroyRef);
    private plansSvc = inject(PlansService);
    private routinesSvc = inject(RoutinesServices);

    public readonly routinePlan = toSignal(this.plansSvc.routinePlanVM$, { initialValue: null });

    indexDay = signal<DayIndex>(1);
    routineDays = toSignal(this.routinesSvc.routines$, { initialValue: [] });

    private daySelectSubject = new Subject<number>();

    constructor() {
        this.routinesSvc
            .getAllRoutines()
            .pipe(take(1), takeUntilDestroyed(this.destroyRef))
            .subscribe();

        this.daySelectSubject
            .pipe(
                tap((day) => this.indexDay.set(day as DayIndex)),
                switchMap(async (day) => {
                    return day;
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    routinaDay = computed(() => {
        const plan = this.routinePlan();
        const dayIdx = this.indexDay();
        if (dayIdx) {
            return plan?.routineDays[dayIdx - 1];
        }
        return null;
    });

    readonly selectedCategory = computed<ExerciseCategory | null>(() => {
        const selected = this.routinaDay();
        return selected?.type && selected.type.length > 0 ? selected.type[0] : null;
    });

    readonly routinesByCategory = computed<RoutineDay[]>(() => {
        const category = this.selectedCategory();
        const allRoutines = this.routineDays();

        if (!category || !allRoutines.length) return [];

        return allRoutines.filter((r) => r.type?.includes(category));
    });

    readonly expandedDays = computed(() => {
        const plan = this.routinePlan();
        if (!plan) return [];
        return plan.routineDays.filter((d) => d.expanded);
    });

    setDay(day: number): void {
        this.plansSvc.setExpandedDay(day - 1);
        this.daySelectSubject.next(day);
    }

    setKind(kind: 'REST' | 'WORKOUT'): void {
        const dayIdx = this.indexDay();
        const currentDay = this.routinaDay();
        if (!dayIdx || !currentDay) return;

        const updatedDay: RoutineDayVM = {
            ...currentDay,
            kind: kind,
            id: kind === 'REST' ? undefined : currentDay.id,
            type: kind === 'REST' ? undefined : currentDay.type,
            exercises: kind === 'REST' ? undefined : currentDay.exercises,
            title: kind === 'REST' ? '' : currentDay.title,
        };

        this.plansSvc.setDayRoutine(dayIdx - 1, updatedDay);
    }

    clearRoutine(): void {
        const dayIdx = this.indexDay();
        if (!dayIdx) return;

        const day = this.routinaDay();
        if (!day) return;

        this.plansSvc.setDayRoutine(dayIdx - 1, {
            ...day,
            id: undefined,
            type: undefined,
        });
    }
}
