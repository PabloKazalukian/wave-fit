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
import { StatsChartsService } from './stats-charts.service';
import { DateService } from '../date.service';
import {
    CaloriesWeekVM,
    ExerciseTrendVM,
    ForgottenMuscleVM,
    LocalDateRange,
    OneRmExerciseVM,
    STATS_CHARTS_DEFAULT_RANGE_DAYS,
    StatsChartsQueryInput,
    StatsChartsSection,
    VolumeTotalWeekVM,
    VolumeWeekVM,
} from '../../../shared/interfaces/stats-charts.interface';

export const STATS_CHARTS_SECTIONS: readonly StatsChartsSection[] = [
    'oneRm',
    'volume',
    'volumeTotal',
    'calories',
    'forgottenMuscles',
    'exerciseTrend',
] as const;

export type StatsChartsSectionData =
    | OneRmExerciseVM[]
    | VolumeWeekVM[]
    | VolumeTotalWeekVM[]
    | CaloriesWeekVM[]
    | ForgottenMuscleVM[]
    | ExerciseTrendVM[];

export interface StatsChartsSectionEntry {
    data: StatsChartsSectionData | null;
    loading: boolean;
    error: string | null;
}

interface SectionData {
    oneRm: OneRmExerciseVM[];
    volume: VolumeWeekVM[];
    volumeTotal: VolumeTotalWeekVM[];
    calories: CaloriesWeekVM[];
    forgottenMuscles: ForgottenMuscleVM[];
    exerciseTrend: ExerciseTrendVM[];
}

type SectionGetters = {
    [S in StatsChartsSection]: (i: StatsChartsQueryInput) => Observable<SectionData[S]>;
};

/** Resultado de un intento de carga: lo emite la rama del `switchMap`. */
type SectionOutcome =
    | { kind: 'loading' }
    | { kind: 'success'; data: StatsChartsSectionData }
    | { kind: 'error'; error: string };

function emptyEntry(): StatsChartsSectionEntry {
    return { data: null, loading: false, error: null };
}

function emptyEntries(): Record<StatsChartsSection, StatsChartsSectionEntry> {
    return {
        oneRm: emptyEntry(),
        volume: emptyEntry(),
        volumeTotal: emptyEntry(),
        calories: emptyEntry(),
        forgottenMuscles: emptyEntry(),
        exerciseTrend: emptyEntry(),
    };
}

function errorMessage(err: unknown): string {
    const candidate = err as { message?: string };
    return typeof candidate?.message === 'string' ? candidate.message : 'Error desconocido';
}

/**
 * Estado de `/stats/charts`: el rango elegido y, por sección, su
 * `data` / `loading` / `error`.
 *
 * La cancelación es estructural, no bookkeeping: cada sección tiene un
 * `BehaviorSubject` de input que alimenta un `switchMap`, así que `applyRange()`
 * es un solo `next()` y una respuesta tardía del rango anterior **físicamente no
 * puede** llegar a `data`. La alternativa —guardar un `Subscription` por sección
 * y desuscribirse a mano— es el mismo código con más estados que se pueden
 * equivocar.
 *
 * Un subject por sección (y no uno compartido) es lo que hace que `retry()` pueda
 * re-disparar una sola sección sin volver a disparar las otras cinco.
 *
 * No hay `computedAt`: son queries on demand, no snapshots, así que no hay
 * instante que reportar.
 */
@Injectable({ providedIn: 'root' })
export class StatsChartsState {
    private readonly chartsSvc = inject(StatsChartsService);
    private readonly dateSvc = inject(DateService);

    private readonly timezoneSignal = signal<string>(this.dateSvc.getUserTimezone());

    private readonly currentRange = signal<LocalDateRange>(
        this.dateSvc.lastNDays(STATS_CHARTS_DEFAULT_RANGE_DAYS, this.timezoneSignal()),
    );

    private readonly sections =
        signal<Record<StatsChartsSection, StatsChartsSectionEntry>>(emptyEntries());

    private readonly entryBySection = new Map<
        StatsChartsSection,
        Signal<StatsChartsSectionEntry>
    >();

    private readonly triggers = new Map<
        StatsChartsSection,
        BehaviorSubject<StatsChartsQueryInput | null>
    >();

    constructor() {
        STATS_CHARTS_SECTIONS.forEach((section) => {
            this.entryBySection.set(
                section,
                computed(() => this.sections()[section]),
            );
        });

        STATS_CHARTS_SECTIONS.forEach((section) => this.watch(section));
    }

    private readonly getters: SectionGetters = {
        oneRm: (i) => this.chartsSvc.getOneRmWeekly(i),
        volume: (i) => this.chartsSvc.getVolumeWeekly(i),
        volumeTotal: (i) => this.chartsSvc.getVolumeTotalWeekly(i),
        calories: (i) => this.chartsSvc.getCaloriesWeekly(i),
        forgottenMuscles: (i) => this.chartsSvc.getForgottenMuscles(i),
        exerciseTrend: (i) => this.chartsSvc.getExerciseTrend(i),
    };

    /**
     * Rango vigente, en `LocalDate`. Lo consumen el widget y el subtítulo de
     * cada card.
     */
    readonly range: Signal<LocalDateRange> = this.currentRange.asReadonly();

    /** Timezone resuelta con la que se arman los queries. */
    readonly timezone: Signal<string> = this.timezoneSignal.asReadonly();

    entry(section: StatsChartsSection): Signal<StatsChartsSectionEntry> {
        return this.entryBySection.get(section) ?? computed(() => emptyEntry());
    }

    private input(): StatsChartsQueryInput {
        return { ...this.currentRange(), timezone: this.timezoneSignal() };
    }

    /**
     * `null` como valor inicial del subject: "todavía no se pidió nada". Un
     * BehaviorSubject arranca con ese valor y el `switchMap` no emite hasta que
     * `load()` o `applyRange()`/emitan un input real, así que el constructor
     * dispara cero requests.
     */
    private watch(section: StatsChartsSection): void {
        const trigger = new BehaviorSubject<StatsChartsQueryInput | null>(null);
        this.triggers.set(section, trigger);

        trigger
            .pipe(
                switchMap((input) =>
                    input === null
                        ? // Un subject todavía en `null` no es una carga: se ignora.
                          EMPTY
                        : (this.getters[section](input) as Observable<StatsChartsSectionData>).pipe(
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

    private applyOutcome(section: StatsChartsSection, outcome: SectionOutcome): void {
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

    /** Primera carga: dispara las seis secciones con el rango inicial. */
    load(): void {
        this.emit(this.input());
    }

    /** Cambio de rango: re-dispara las seis y cancela lo que estuviera en vuelo. */
    applyRange(range: LocalDateRange): void {
        this.currentRange.set(range);
        this.emit(this.input());
    }

    /** Re-intenta una sola sección con el rango vigente. */
    retry(section: StatsChartsSection): void {
        this.triggers.get(section)?.next(this.input());
    }

    private emit(input: StatsChartsQueryInput): void {
        STATS_CHARTS_SECTIONS.forEach((section) => this.triggers.get(section)?.next(input));
    }
}
