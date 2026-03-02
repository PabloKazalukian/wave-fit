import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { filter, switchMap, tap, take } from 'rxjs/operators';
import { PlansService } from './plans.service';
import {
    RoutinePlanVM,
    RoutineDayVM,
    RoutinePlan,
    RoutineDay,
    DayIndex,
} from '../../../shared/interfaces/routines.interface';
import { RoutinesServices } from '../routines/routines.service';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';

@Injectable({
    providedIn: 'root',
})
export class DayPlanStateService {
    private destroyRef = inject(DestroyRef);
    private plansSvc = inject(PlansService);
    private routinesSvc = inject(RoutinesServices);

    // Mantenemos trackeado el plan de la semana que se está creando/editando (viene de PlansService)
    public readonly trackedPlan = toSignal(this.plansSvc.routinePlanVM$, { initialValue: null });

    // Estado local
    selectedDay = signal<number | null>(null); // Mapeado a DayIndex (1 al 7)
    selectedCategory = signal<ExerciseCategory | null>(null);
    routinePlan = signal<RoutineDay[]>([]); // Almacena TODAS las rutinas disponibles

    // Disparador para control de concurrencia al seleccionar dia
    private daySelectSubject = new Subject<number>();

    constructor() {
        // Cargar todas las rutinas disponibles en `routinePlan` al inicializar
        this.routinesSvc
            .getAllRoutines()
            .pipe(take(1), takeUntilDestroyed(this.destroyRef))
            .subscribe((routines) => {
                if (routines) {
                    this.routinePlan.set(routines);
                }
            });

        // Control de concurrencia para selectDay
        this.daySelectSubject
            .pipe(
                tap((day) => this.selectedDay.set(day)),
                switchMap(async (day) => {
                    return day;
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    // Filtrar las rutinas disponibles (`routinePlan`) por la categoria seleccionada (`selectedCategory`)
    readonly routinesDays = computed<RoutineDay[]>(() => {
        const category = this.selectedCategory();
        const allRoutines = this.routinePlan();

        if (!category || !allRoutines.length) return [];

        return allRoutines.filter((r) => r.type?.includes(category));
    });

    // Obtener el dia especifico de la semana (RoutineDayVM) que estamos creando basandonos en el selectedDay
    readonly routineSelected = computed<RoutineDayVM | null>(() => {
        const plan = this.trackedPlan();
        const dayIdx = this.selectedDay();

        if (!plan || !dayIdx) return null;

        const foundDay = plan.routineDays.find((d) => d.day === dayIdx);
        return foundDay || null;
    });

    setDay(day: number): void {
        this.daySelectSubject.next(day);
    }

    setCategory(category: ExerciseCategory | null): void {
        this.selectedCategory.set(category);
    }
}
