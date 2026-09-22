import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TrainingHistoryDayPreview } from './day-detail-preview';
import { CalendarDayType, DayPreview } from '../../../../interfaces/training-history.interface';
import { ExercisePerformanceVM } from '../../../../interfaces/tracking.interface';
import {
    ExtraSession,
    ExtraSessionCategory,
    ExtraSessionDisciplineConfig,
} from '../../../../interfaces/extra-session.interface';

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

    const extraSession: ExtraSession = {
        id: 'extra-1',
        category: ExtraSessionCategory.CARDIO,
        discipline: 'running',
        date: '2026-02-02',
        duration: 30,
        intensityLevel: 3,
        calories: 320,
        notes: 'trotada',
    };

    const catalog: ExtraSessionDisciplineConfig[] = [
        { key: 'running', label: 'Running', category: ExtraSessionCategory.CARDIO, met: 9.8 },
    ];

    const preview = (
        kind: CalendarDayType.WEEK_LOG | CalendarDayType.DAY_LOG,
        id: string,
        options: { active?: boolean; extraSessions?: ExtraSession[] } = {},
    ): DayPreview => ({
        kind,
        id,
        date: '2026-02-02',
        exercises: [exercise('ex-1', 'Press banca')],
        extraSessions: options.extraSessions ?? [],
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
        const ctas = Array.from(panel.querySelectorAll('a'));
        const texts = ctas.map((a) => a.textContent?.trim());

        expect(texts).toContain('Ver semana');
        expect(texts).toContain('Ver mi semana');

        const weekCta = ctas.find((a) => a.textContent?.includes('Ver semana'))!;
        expect(weekCta.getAttribute('href')).toBe('/user/trackings/week-1');

        const myWeekCta = ctas.find((a) => a.textContent?.includes('Ver mi semana'))!;
        expect(myWeekCta.getAttribute('href')).toBe('/my-week');
        expect(myWeekCta.className).toContain('bg-primary');
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

    it('renders extra sessions after the exercises (FR-011)', () => {
        fixture.componentRef.setInput('disciplines', catalog);
        fixture.componentRef.setInput(
            'preview',
            preview(CalendarDayType.WEEK_LOG, 'week-1', { extraSessions: [extraSession] }),
        );
        fixture.detectChanges();

        const panel = qs('[data-test="history-preview"]')!;
        const text = panel.textContent!;
        expect(text).toContain('Press banca');
        expect(text).toContain('Running');
        expect(text).toContain('30 min');
        expect(text.indexOf('Press banca')).toBeLessThan(text.indexOf('Running'));
    });

    it('renders no extra block when the preview has no extra sessions', () => {
        fixture.componentRef.setInput(
            'preview',
            preview(CalendarDayType.DAY_LOG, 'day-1', { extraSessions: [] }),
        );
        fixture.detectChanges();

        expect(qs('[data-test="history-preview"]')!.textContent).not.toContain('Sesiones extra');
    });

    it('hides the header CTA when the preview id is empty', () => {
        fixture.componentRef.setInput('disciplines', catalog);
        fixture.componentRef.setInput(
            'preview',
            preview(CalendarDayType.DAY_LOG, '', { extraSessions: [extraSession] }),
        );
        fixture.detectChanges();

        expect(qs('[data-test="history-preview"]')!.textContent).toContain('Running');
        expect(qs('[data-test="history-preview"]')!.querySelector('a')).toBeNull();
    });

    it('does not show the "no exercises" placeholder when the day has extras only', () => {
        fixture.componentRef.setInput('preview', {
            kind: CalendarDayType.DAY_LOG,
            id: '',
            date: '2026-02-02',
            exercises: [],
            extraSessions: [extraSession],
        });
        fixture.detectChanges();

        expect(qs('[data-test="history-preview"]')!.textContent).not.toContain(
            'No hay ejercicios registrados',
        );
    });
});
