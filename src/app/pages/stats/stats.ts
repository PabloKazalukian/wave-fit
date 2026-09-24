import { Component, computed, effect, inject, Signal, signal } from '@angular/core';
import type { Options } from 'highcharts';
import { StatsState, StatsSection, StatsSectionEntry } from '../../core/services/stats/stats.state';
import { isNewRecord, PersonalRecordVM } from '../../shared/interfaces/stats.interface';
import {
    buildAdherenceChartOptions,
    buildPersonalRecordsChartOptions,
    buildTopExercisesChartOptions,
    buildTopRoutinesChartOptions,
} from '../../shared/utils/stats-chart.mapper';
import { StatsSection as StatsSectionComponent } from '../../shared/components/ui/stats/stats-section/stats-section';
import { StatsChart } from '../../shared/components/widgets/stats/stats-chart/stats-chart';
import { Notification } from '../../shared/components/ui/notification/notification';
import { ExerciseCategoryPipe } from '../../shared/pipes/exercise-category.pipe';
import { formatLocalDateShort, formatWeight } from '../../shared/utils/stats-chart.theme';

interface RecordRow {
    record: PersonalRecordVM;
    isNew: boolean;
}

@Component({
    selector: 'app-stats-page',
    standalone: true,
    imports: [StatsSectionComponent, StatsChart, Notification, ExerciseCategoryPipe],
    templateUrl: './stats.html',
    styles: ``,
})
export class StatsPage {
    private readonly state = inject(StatsState);

    readonly entries: Record<StatsSection, Signal<StatsSectionEntry>> = {
        topExercises: this.state.entry('topExercises'),
        topRoutines: this.state.entry('topRoutines'),
        personalRecords: this.state.entry('personalRecords'),
        adherence: this.state.entry('adherence'),
    };

    readonly topExercisesOptions = computed<Options | null>(() => {
        const data = this.entries.topExercises().data;
        return data && 'exercises' in data ? buildTopExercisesChartOptions(data.exercises) : null;
    });

    readonly topRoutinesOptions = computed<Options | null>(() => {
        const data = this.entries.topRoutines().data;
        return data && 'routines' in data ? buildTopRoutinesChartOptions(data.routines) : null;
    });

    readonly personalRecordsOptions = computed<Options | null>(() => {
        const data = this.entries.personalRecords().data;
        return data && 'records' in data ? buildPersonalRecordsChartOptions(data.records) : null;
    });

    readonly adherenceOptions = computed<Options | null>(() => {
        const data = this.entries.adherence().data;
        return data && 'weeks' in data ? buildAdherenceChartOptions(data.weeks) : null;
    });

    readonly personalRecordsList = computed<RecordRow[]>(() => {
        const data = this.entries.personalRecords().data;
        return data && 'records' in data
            ? data.records.map((record) => ({ record, isNew: isNewRecord(record) }))
            : [];
    });

    readonly topExercisesEmpty = this.sectionEmpty(
        this.entries.topExercises,
        this.topExercisesOptions,
    );
    readonly topRoutinesEmpty = this.sectionEmpty(
        this.entries.topRoutines,
        this.topRoutinesOptions,
    );
    readonly personalRecordsEmpty = this.sectionEmpty(
        this.entries.personalRecords,
        this.personalRecordsOptions,
    );
    readonly adherenceEmpty = this.sectionEmpty(this.entries.adherence, this.adherenceOptions);

    readonly notification = signal<{ type: 'error'; message: string } | null>(null);

    private readonly firstError = computed(() => {
        for (const entry of Object.values(this.entries)) {
            const error = entry().error;
            if (error) return error;
        }
        return null;
    });

    private readonly onError = effect(() => {
        const error = this.firstError();
        if (error) {
            this.notification.set({ type: 'error', message: error });
        }
    });

    readonly formatWeight = formatWeight;
    readonly formatLocalDateShort = formatLocalDateShort;

    constructor() {
        this.state.load();
    }

    reload(section: StatsSection): void {
        this.state.reload(section);
    }

    private sectionEmpty(
        entry: Signal<StatsSectionEntry>,
        options: Signal<Options | null>,
    ): Signal<boolean> {
        return computed(() => {
            const current = entry();
            return (
                !current.loading &&
                current.error === null &&
                (current.data === null || options() === null)
            );
        });
    }
}
