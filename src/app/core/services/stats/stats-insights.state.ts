import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import {
    BehaviorSubject,
    EMPTY,
    Observable,
    catchError,
    map,
    of,
    startWith,
    switchMap,
} from 'rxjs';
import { StatsInsightsService } from './stats-insights.service';
import { DateService } from '../date.service';
import {
    CaloriesWeekVM,
    ExerciseTrendVM,
    ForgottenMuscleVM,
    LocalDateRange,
    OneRmExerciseVM,
    STATS_INSIGHTS_DEFAULT_RANGE_DAYS,
    StatsInsightsQueryInput,
    StatsInsightsSection,
    VolumeTotalWeekVM,
    VolumeWeekVM,
} from '../../../shared/interfaces/stats-insights.interface';

export const STATS_INSIGHTS_SECTIONS: readonly StatsInsightsSection[] = [
    'oneRm',
    'volume',
    'volumeTotal',
    'calories',
    'forgottenMuscles',
    'exerciseTrend',
] as const;

export type StatsInsightsSectionData =
    | OneRmExerciseVM[]
    | VolumeWeekVM[]
    | VolumeTotalWeekVM[]
    | CaloriesWeekVM[]
    | ForgottenMuscleVM[]
    | ExerciseTrendVM[];

export interface StatsInsightsSectionEntry {
    data: StatsInsightsSectionData | null;
    loading: boolean;
    error: string | null;
}

export interface SectionData {
    oneRm: OneRmExerciseVM[];
    volume: VolumeWeekVM[];
    volumeTotal: VolumeTotalWeekVM[];
    calories: CaloriesWeekVM[];
    forgottenMuscles: ForgottenMuscleVM[];
    exerciseTrend: ExerciseTrendVM[];
}

type SectionGetters = {
    [S in StatsInsightsSection]: (i: StatsInsightsQueryInput) => Observable<SectionData[S]>;
};

/** Resultado de un intento de carga: lo emite la rama del `switchMap`. */
type SectionOutcome =
    | { kind: 'loading' }
    | { kind: 'success'; data: StatsInsightsSectionData }
    | { kind: 'error'; error: string };

function emptyEntry(): StatsInsightsSectionEntry {
    return { data: null, loading: false, error: null };
}

function emptyEntries(): Record<StatsInsightsSection, StatsInsightsSectionEntry> {
    return {
        oneRm: emptyEntry(),
        volume: emptyEntry(),
        volumeTotal: emptyEntry(),
        calories: emptyEntry(),
        forgottenMuscles: emptyEntry(),
        exerciseTrend: emptyEntry(),
    };
}

function emptyRanges(): Record<StatsInsightsSection, LocalDateRange | null> {
    return {
        oneRm: null,
        volume: null,
        volumeTotal: null,
        calories: null,
        forgottenMuscles: null,
        exerciseTrend: null,
    };
}

function errorMessage(err: unknown): string {
    const candidate = err as { message?: string };
    return typeof candidate?.message === 'string' ? candidate.message : 'Error desconocido';
}

/**
 * Estado de `/stats/insights`: por sección, su `data` / `loading` / `error` y el
 * rango con el que se corrieron esos datos.
 *
 * El flujo es explícito y encadenado (FR-023): entrar a la ruta no consulta nada
 * y sólo `run(section, range)` dispara. El rango por defecto de 30 días es el
 * **seed** que el widget muestra, no un disparador — por eso vive aparte de
 * `appliedRanges` y no se toca al correr.
 *
 * El rango aplicado es **por sección**, no global. Con un solo select a la vez el
 * usuario puede correr `volume` con julio, cambiar a `calories` con mayo, y volver
 * a `volume`: un único `currentRange` haría que el subtítulo de la card y
 * `retry()` hablaran de mayo sobre un chart de julio.
 *
 * La cancelación es estructural, no bookkeeping: cada sección tiene un
 * `BehaviorSubject` de input que alimenta un `switchMap`, así que `run()` es un
 * solo `next()` sobre **una** sección y una respuesta tardía del rango anterior
 * **físicamente no puede** llegar a `data`. La alternativa —guardar un
 * `Subscription` por sección y desuscribirse a mano— es el mismo código con más
 * estados que se pueden equivocar.
 *
 * Un subject por sección (y no uno compartido) es lo que hace que `run()` y
 * `retry()` toquen una sola sección, y que la cancelación de una no arrastre a las
 * demás.
 *
 * No hay `computedAt`: son queries on demand, no snapshots, así que no hay
 * instante que reportar.
 */
@Injectable({ providedIn: 'root' })
export class StatsInsightsState {
    private readonly insightsSvc = inject(StatsInsightsService);
    private readonly dateSvc = inject(DateService);

    private readonly timezoneSignal = signal<string>(this.dateSvc.getUserTimezone());

    private readonly currentRange = signal<LocalDateRange>(
        this.dateSvc.lastNDays(STATS_INSIGHTS_DEFAULT_RANGE_DAYS, this.timezoneSignal()),
    );

    private readonly sections =
        signal<Record<StatsInsightsSection, StatsInsightsSectionEntry>>(emptyEntries());

    /**
     * Rango con el que se corrió cada sección, o `null` si nunca se corrió.
     *
     * `range()` (el seed) y esto son cosas distintas a propósito: el seed es lo
     * que el widget ofrece al montar, y un applied range es lo que alguien pidió
     * explícitamente con "Ver gráficas".
     */
    private readonly appliedRanges =
        signal<Record<StatsInsightsSection, LocalDateRange | null>>(emptyRanges());

    private readonly entryBySection = new Map<
        StatsInsightsSection,
        Signal<StatsInsightsSectionEntry>
    >();

    private readonly triggers = new Map<
        StatsInsightsSection,
        BehaviorSubject<StatsInsightsQueryInput | null>
    >();

    constructor() {
        STATS_INSIGHTS_SECTIONS.forEach((section) => {
            this.entryBySection.set(
                section,
                computed(() => this.sections()[section]),
            );
        });

        STATS_INSIGHTS_SECTIONS.forEach((section) => this.watch(section));
    }

    private readonly getters: SectionGetters = {
        oneRm: (i) => this.insightsSvc.getOneRmWeekly(i),
        volume: (i) => this.insightsSvc.getVolumeWeekly(i),
        volumeTotal: (i) => this.insightsSvc.getVolumeTotalWeekly(i),
        calories: (i) => this.insightsSvc.getCaloriesWeekly(i),
        forgottenMuscles: (i) => this.insightsSvc.getForgottenMuscles(i),
        exerciseTrend: (i) => this.insightsSvc.getExerciseTrend(i),
    };

    /**
     * Rango por defecto (los últimos 30 días) con el que se abre el widget. Es
     * un **seed**, no una consulta: `run()` no lo mueve, y por eso se lee
     * separado de `appliedRange()`.
     */
    readonly range: Signal<LocalDateRange> = this.currentRange.asReadonly();

    /**
     * El rango con el que se corrió una sección, o `null` si nunca corrió.
     *
     * Lo leen el subtítulo de la card y `retry()`. Que sea por sección y no un
     * único rango global es lo que impide que el encabezado describa un chart con
     * un rango que el usuario no pidió para él.
     */
    appliedRange(section: StatsInsightsSection): Signal<LocalDateRange | null> {
        return computed(() => this.appliedRanges()[section]);
    }

    /** Timezone resuelta con la que se arman los queries. */
    readonly timezone: Signal<string> = this.timezoneSignal.asReadonly();

    entry(section: StatsInsightsSection): Signal<StatsInsightsSectionEntry> {
        return this.entryBySection.get(section) ?? computed(() => emptyEntry());
    }

    /**
     * El payload de una sección, ya narrowed a su familia de VM.
     *
     * Existe para que la página no tenga que discriminar la unión
     * `StatsInsightsSectionData` a mano ni castear: el state sabe qué getter
     * corresponde a cada clave, así que el tipo sale de la clave, no de un cast.
     */
    data<S extends StatsInsightsSection>(section: S): Signal<SectionData[S] | null> {
        const entry = this.entry(section) as Signal<
            StatsInsightsSectionEntry & {
                data: SectionData[S] | null;
            }
        >;
        return computed(() => entry().data);
    }

    private input(range: LocalDateRange): StatsInsightsQueryInput {
        return { ...range, timezone: this.timezoneSignal() };
    }

    /**
     * `null` como valor inicial del subject: "todavía no se pidió nada". Un
     * BehaviorSubject arranca con ese valor y el `switchMap` no emite hasta que
     * `run()`/`retry()` pusheen un input real, así que el constructor dispara cero
     * requests sin necesidad de un caso especial (FR-023).
     */
    private watch(section: StatsInsightsSection): void {
        const trigger = new BehaviorSubject<StatsInsightsQueryInput | null>(null);
        this.triggers.set(section, trigger);

        trigger
            .pipe(
                switchMap((input) =>
                    input === null
                        ? // Un subject todavía en `null` no es una carga: se ignora.
                          EMPTY
                        : (
                              this.getters[section](input) as Observable<StatsInsightsSectionData>
                          ).pipe(
                              map((data): SectionOutcome => ({ kind: 'success', data })),
                              catchError((err: unknown) =>
                                  of<SectionOutcome>({ kind: 'error', error: errorMessage(err) }),
                              ),
                              startWith<SectionOutcome>({ kind: 'loading' }),
                          ),
                ),
            )
            .subscribe((outcome) => this.applyOutcome(section, outcome));
    }

    private applyOutcome(section: StatsInsightsSection, outcome: SectionOutcome): void {
        this.sections.update((current) => {
            const entry = current[section];

            switch (outcome.kind) {
                case 'loading':
                    // Se conserva `data` a propósito: con el dato viejo en
                    // pantalla la card se deriva como `refreshing` en vez de
                    // volver al esqueleto (ver el plan, `refreshing`).
                    return {
                        ...current,
                        [section]: { ...entry, loading: true, error: null },
                    };
                case 'success':
                    return {
                        ...current,
                        [section]: { data: outcome.data, loading: false, error: null },
                    };
                case 'error':
                    return {
                        ...current,
                        [section]: { ...entry, loading: false, error: outcome.error },
                    };
            }
        });
    }

    /**
     * Corre **una** sección con el rango indicado (FR-023). Es el único camino de
     * entrada a la red: no hay carga inicial ni cambio de rango que dispare por
     * su cuenta.
     *
     * El applied range se registra antes del `next()` para que un card que se
     * renderiza en estado `loading` por un refetch ya describa el rango nuevo, no
     * el viejo que sigue en pantalla.
     */
    run(section: StatsInsightsSection, range: LocalDateRange): void {
        this.appliedRanges.update((current) => ({ ...current, [section]: range }));
        this.triggers.get(section)?.next(this.input(range));
    }

    /**
     * Re-intenta una sola sección con **su propio** applied range. No hace nada
     * si nunca corrió: no hay nada que reintentar y adivinar un rango sería
     * mostrar un chart de otra cosa.
     */
    retry(section: StatsInsightsSection): void {
        const range = this.appliedRanges()[section];
        if (range === null) return;
        this.triggers.get(section)?.next(this.input(range));
    }
}
