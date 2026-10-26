import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, CalendarClock } from 'lucide-angular';
import { PlanDayService } from '../../../../core/services/day-logs/plan-day.service';
import { DateService } from '../../../../core/services/date.service';
import { DayLogVM } from '../../../../shared/interfaces/day-log.interface';
import { DayDeferredForm } from '../../../../shared/components/widgets/training-history/day-deferred-form/day-deferred-form';
import { TextLink } from '../../../../shared/components/ui/text-link/text-link';

@Component({
    selector: 'app-day-deferred',
    imports: [LucideAngularModule, DayDeferredForm, TextLink],
    standalone: true,
    templateUrl: './day-deferred.html',
    styles: ``,
})
export class DayDeferred implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly planDaySvc = inject(PlanDayService);
    private readonly dateSvc = inject(DateService);

    readonly CalendarIcon = CalendarClock;

    readonly date = signal<string | null>(null);
    readonly dayLogId = signal<string | null>(null);
    readonly dayLog = signal<DayLogVM | null>(null);
    readonly loading = signal(false);
    readonly error = signal(false);

    ngOnInit() {
        const params = this.route.snapshot.queryParamMap;
        const date = params.get('date');
        const id = params.get('id');

        this.date.set(this.dateSvc.isValidLocalDate(date) ? date : null);

        if (!id) return;
        this.dayLogId.set(id);
        this.load(id);
    }

    retry() {
        const id = this.dayLogId();
        if (id) this.load(id);
    }

    private load(id: string) {
        this.loading.set(true);
        this.error.set(false);
        this.planDaySvc.findById(id).subscribe({
            next: (dayLog) => {
                this.loading.set(false);
                this.dayLog.set(dayLog);
                if (!dayLog) this.error.set(true);
            },
            error: () => {
                this.loading.set(false);
                this.error.set(true);
            },
        });
    }
}
