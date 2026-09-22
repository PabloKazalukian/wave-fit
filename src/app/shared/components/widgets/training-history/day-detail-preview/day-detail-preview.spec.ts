import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TrainingHistoryDayPreview } from './day-detail-preview';
import { CalendarDayType, DayPreview } from '../../../../interfaces/training-history.interface';
import { ExercisePerformanceVM } from '../../../../interfaces/tracking.interface';

describe('TrainingHistoryDayPreview', () => {
    let component: TrainingHistoryDayPreview;
    let fixture: ComponentFixture<TrainingHistoryDayPreview>;

    const qs = (selector: string): HTMLElement | null =>
        fixture.nativeElement.querySelector(selector);

    const exercise = (id: string, name: string, series = 3): ExercisePerformanceVM => ({
        exerciseId: id,
        name,
        series,
        category: 'strength' as ExercisePerformanceVM['category'],
        sets: [{ reps: 10, weights: 20 }],
        usesWeight: true,
    });

    const preview = (
        kind: CalendarDayType.WEEK_LOG | CalendarDayType.DAY_LOG,
        id: string,
        options: { active?: boolean } = {},
    ): DayPreview => ({
        kind,
        id,
        date: '2026-02-02',
        exercises: [exercise('ex-1', 'Press banca')],
        active: options.active,
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TrainingHistoryDayPreview],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(TrainingHistoryDayPreview);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('renders the week preview with its CTA (FR-007)', () => {
        fixture.componentRef.setInput('preview', preview(CalendarDayType.WEEK_LOG, 'week-1'));
        fixture.detectChanges();

        const panel = qs('[data-test="history-preview"]');
        expect(panel).toBeTruthy();
        expect(panel!.textContent).toContain('Press banca');
        expect(panel!.textContent).toContain('3 series');

        const cta = panel!.querySelector('a');
        expect(cta!.getAttribute('href')).toBe('/user/trackings/week-1');
        expect(cta!.textContent).toContain('Ver semana');
    });

    it('renders the day preview with its CTA (FR-008)', () => {
        fixture.componentRef.setInput('preview', preview(CalendarDayType.DAY_LOG, 'day-1'));
        fixture.detectChanges();

        const panel = qs('[data-test="history-preview"]');
        expect(panel!.textContent).toContain('Press banca');

        const cta = panel!.querySelector('a');
        expect(cta!.getAttribute('href')).toBe('/user/tracking/day/day-1');
        expect(cta!.textContent).toContain('Ver día');
    });

    it('shows a raised "Ver mi semana" CTA next to "Ver semana" for the active week', () => {
        fixture.componentRef.setInput(
            'preview',
            preview(CalendarDayType.WEEK_LOG, 'week-1', { active: true }),
        );
        fixture.detectChanges();

        const panel = qs('[data-test="history-preview"]')!;
        const ctas = panel.querySelectorAll('a');
        const texts = Array.from(ctas).map((a) => a.textContent?.trim());

        expect(texts).toContain('Ver semana');
        expect(texts).toContain('Ver mi semana');
        expect(ctas[1]!.getAttribute('href')).toBe('/user/trackings/week-1');
        expect(ctas[1]!.className).toContain('bg-primary');
    });

    it('does not show "Ver mi semana" for a non-active week', () => {
        fixture.componentRef.setInput('preview', preview(CalendarDayType.WEEK_LOG, 'week-1'));
        fixture.detectChanges();

        const panel = qs('[data-test="history-preview"]')!;
        expect(panel.textContent).toContain('Ver semana');
        expect(panel.textContent).not.toContain('Ver mi semana');
    });

    it('shows the loading state instead of the panel', () => {
        fixture.componentRef.setInput('loading', true);
        fixture.detectChanges();

        expect(qs('app-loading')).toBeTruthy();
        expect(qs('[data-test="history-preview"]')).toBeNull();
    });

    it('shows the error state and emits retry', () => {
        fixture.componentRef.setInput('error', true);
        fixture.detectChanges();

        const retrySpy = jasmine.createSpy('retry');
        component.retry.subscribe(retrySpy);

        const button = qs('[data-test="history-preview-retry"]')!;
        expect(button.textContent).toContain('Reintentar');
        button.click();

        expect(retrySpy).toHaveBeenCalled();
    });
});
