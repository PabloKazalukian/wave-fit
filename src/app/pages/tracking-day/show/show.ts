import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { map, Observable, switchMap, tap } from 'rxjs';
import { LucideAngularModule, Calendar, ClipboardList } from 'lucide-angular';
import { DayLogVM } from '../../../shared/interfaces/day-log.interface';
import { PlanDayService } from '../../../core/services/day-logs/plan-day.service';
import { DateService } from '../../../core/services/date.service';
import { TextLink } from '../../../shared/components/ui/text-link/text-link';

@Component({
    selector: 'app-show',
    imports: [CommonModule, LucideAngularModule, TextLink],
    standalone: true,
    templateUrl: './show.html',
    styles: ``,
})
export class Show {
    private route = inject(ActivatedRoute);
    private planDaySvc = inject(PlanDayService);
    dateSvc = inject(DateService);

    asyncLoaded = false;
    dayLog$: Observable<DayLogVM | null> = this.route.params.pipe(
        map((params) => params['id']),
        switchMap((id) => this.planDaySvc.findById(id)),
        tap(() => (this.asyncLoaded = true)),
    );

    readonly CalendarIcon = Calendar;
    readonly ClipboardListIcon = ClipboardList;
}
