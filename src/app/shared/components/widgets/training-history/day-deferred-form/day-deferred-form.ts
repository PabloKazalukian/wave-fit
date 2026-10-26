import { Component, computed, inject, input, output } from '@angular/core';
import { DateService } from '../../../../../core/services/date.service';
import { DayLogVM } from '../../../../interfaces/day-log.interface';
import { Loading } from '../../../ui/loading/loading';

@Component({
    selector: 'app-day-deferred-form',
    imports: [Loading],
    standalone: true,
    templateUrl: './day-deferred-form.html',
    styles: [':host { display: block; }'],
})
export class DayDeferredForm {
    date = input<string | null>(null);
    dayLog = input<DayLogVM | null>(null);
    loading = input(false);
    error = input(false);

    readonly retry = output<void>();

    readonly dateSvc = inject(DateService);

    readonly resolvedDate = computed(() => this.dayLog()?.date ?? this.date());

    readonly displayDate = computed(() => {
        const date = this.resolvedDate();
        return date ? this.dateSvc.toDisplayString(date) : '—';
    });

    readonly statusLabel = computed(() => {
        switch (this.dayLog()?.status) {
            case 'complete':
                return 'Completado';
            case 'skipped':
                return 'Omitido';
            case 'pending':
                return 'Pendiente';
            default:
                return '—';
        }
    });

    readonly completedLabel = computed(() => {
        const dayLog = this.dayLog();
        if (!dayLog) return '—';
        return dayLog.completed ? 'Sí' : 'No';
    });

    readonly exercises = computed(() => this.dayLog()?.exercises ?? []);

    readonly extraSessionCount = computed(() => {
        const dayLog = this.dayLog();
        if (!dayLog) return 0;
        return dayLog.extraSessionIds.length;
    });
}
