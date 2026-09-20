import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Sun, ChevronRight } from 'lucide-angular';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { PlanDayService } from '../../../../../core/services/day-logs/plan-day.service';
import { parseISO } from 'date-fns';
import { LocalDate } from '../../../../../shared/interfaces/tracking.interface';

@Component({
    selector: 'app-daily-tracking',
    imports: [CommonModule, RouterLink, LucideAngularModule],
    standalone: true,
    templateUrl: './daily-tracking.html',
    styles: [
        `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .animate-fade-in-up {
                animation: fadeInUp 0.4s ease-out forwards;
                opacity: 0;
            }
        `,
    ],
})
export class DailyTracking {
    private planDaySvc = inject(PlanDayService);

    limit = input<number>(5);

    days$ = toObservable(this.limit).pipe(switchMap((limit) => this.planDaySvc.findAll(limit)));

    readonly SunIcon = Sun;
    readonly ChevronRightIcon = ChevronRight;

    /** Formatea un LocalDate "yyyy-MM-dd" para display */
    formatDate(localDate: LocalDate): string {
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: 'short',
        }).format(parseISO(localDate));
    }
}
