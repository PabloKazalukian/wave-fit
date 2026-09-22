import { Component, inject, input, output } from '@angular/core';
import { DateService } from '../../../../../core/services/date.service';
import { CalendarDayType, DayPreview } from '../../../../interfaces/training-history.interface';
import { ExtraSessionDisciplineConfig } from '../../../../interfaces/extra-session.interface';
import { Loading } from '../../../ui/loading/loading';
import { BtnComponent } from '../../../ui/btn/btn';
import { ExtraSessionShow } from '../../extra-session/extra-session-show/extra-session-show';

@Component({
    selector: 'app-training-history-day-preview',
    imports: [Loading, BtnComponent, ExtraSessionShow],
    standalone: true,
    templateUrl: './day-detail-preview.html',
    styles: [':host { display: block; }'],
})
export class TrainingHistoryDayPreview {
    preview = input<DayPreview | null>(null);
    loading = input(false);
    error = input(false);
    disciplines = input<ExtraSessionDisciplineConfig[]>([]);

    readonly retry = output<void>();

    readonly dateSvc = inject(DateService);
    readonly CalendarDayType = CalendarDayType;

    readonly MY_WEEK_ROUTER_LINK = '/my-week';

    previewCtaLabel(preview: DayPreview): string {
        return preview.kind === CalendarDayType.WEEK_LOG ? 'Ver semana' : 'Ver día';
    }

    previewRouterLink(preview: DayPreview): string {
        return preview.kind === CalendarDayType.WEEK_LOG
            ? `/user/trackings/${preview.id}`
            : `/user/tracking/day/${preview.id}`;
    }
}
