import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { StatsService } from './stats.service';
import {
    AdherenceVM,
    PersonalRecordsVM,
    TopExercisesVM,
    TopRoutinesVM,
} from '../../../shared/interfaces/stats.interface';

export type StatsSection = 'topExercises' | 'topRoutines' | 'personalRecords' | 'adherence';

export type StatsSectionData = TopExercisesVM | TopRoutinesVM | PersonalRecordsVM | AdherenceVM;

export interface StatsSectionEntry {
    data: StatsSectionData | null;
    loading: boolean;
    error: string | null;
    computedAt: string | null;
}

export const STATS_SECTIONS: readonly StatsSection[] = [
    'topExercises',
    'topRoutines',
    'personalRecords',
    'adherence',
] as const;

interface SectionData {
    topExercises: TopExercisesVM;
    topRoutines: TopRoutinesVM;
    personalRecords: PersonalRecordsVM;
    adherence: AdherenceVM;
}

type SectionGetters = { [S in StatsSection]: () => Observable<SectionData[S]> };

function emptyEntries(): Record<StatsSection, StatsSectionEntry> {
    return {
        topExercises: { data: null, loading: false, error: null, computedAt: null },
        topRoutines: { data: null, loading: false, error: null, computedAt: null },
        personalRecords: { data: null, loading: false, error: null, computedAt: null },
        adherence: { data: null, loading: false, error: null, computedAt: null },
    };
}

function errorMessage(err: unknown): string {
    const candidate = err as { message?: string };
    return typeof candidate?.message === 'string' ? candidate.message : 'Error desconocido';
}

@Injectable({ providedIn: 'root' })
export class StatsState {
    private readonly statsSvc = inject(StatsService);

    private readonly sections = signal<Record<StatsSection, StatsSectionEntry>>(emptyEntries());

    private readonly entryBySection = new Map<StatsSection, Signal<StatsSectionEntry>>();

    constructor() {
        STATS_SECTIONS.forEach((section) => {
            this.entryBySection.set(
                section,
                computed(() => this.sections()[section]),
            );
        });
    }

    private readonly getters: SectionGetters = {
        topExercises: () => this.statsSvc.getTopExercises(),
        topRoutines: () => this.statsSvc.getTopRoutines(),
        personalRecords: () => this.statsSvc.getPersonalRecords(),
        adherence: () => this.statsSvc.getAdherence(),
    };

    entry(section: StatsSection): Signal<StatsSectionEntry> {
        return this.entryBySection.get(section) ?? computed(() => emptyEntries()[section]);
    }

    load(): void {
        STATS_SECTIONS.forEach((section) => this.reload(section));
    }

    reload(section: StatsSection): void {
        this.sections.update((current) => ({
            ...current,
            [section]: { ...current[section], loading: true, error: null },
        }));

        (this.getters[section]() as Observable<StatsSectionData>).subscribe({
            next: (data) => {
                this.sections.update((current) => ({
                    ...current,
                    [section]: {
                        data,
                        loading: false,
                        error: null,
                        computedAt: computedAtOf(data),
                    },
                }));
            },
            error: (err: unknown) => {
                this.sections.update((current) => ({
                    ...current,
                    [section]: {
                        ...current[section],
                        data: null,
                        loading: false,
                        error: errorMessage(err),
                    },
                }));
            },
        });
    }
}

function computedAtOf(data: StatsSectionData): string {
    return data.computedAt;
}
