import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingHistoryCalendar } from './calendar';
import {
    CalendarDay,
    CalendarDayType,
    TrainingStatus,
} from '../../../../interfaces/training-history.interface';
import { ExtraSessionCategory } from '../../../../interfaces/extra-session.interface';

describe('TrainingHistoryCalendar', () => {
    let component: TrainingHistoryCalendar;
    let fixture: ComponentFixture<TrainingHistoryCalendar>;

    const qs = (selector: string): HTMLElement | null =>
        fixture.nativeElement.querySelector(selector);

    const weekLogDay: CalendarDay = {
        date: '2026-02-02',
        type: CalendarDayType.WEEK_LOG,
        status: TrainingStatus.COMPLETE,
        weekLogReference: {
            id: 'week-1',
            startDate: '2026-02-02',
            endDate: '2026-02-08',
            completed: true,
            active: true,
        },
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TrainingHistoryCalendar],
        }).compileComponents();

        fixture = TestBed.createComponent(TrainingHistoryCalendar);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('year', 2026);
        fixture.componentRef.setInput('month', 1); // Febrero
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('renders a 5x7 grid for the month', () => {
        expect(fixture.nativeElement.querySelectorAll('[data-date]').length).toBe(35);
    });

    it('emits daySelected when a tile is clicked', () => {
        fixture.componentRef.setInput('days', [weekLogDay]);
        fixture.detectChanges();

        const spy = jasmine.createSpy('daySelected');
        component.daySelected.subscribe(spy);

        qs('[data-date="2026-02-02"]')!.click();

        expect(spy).toHaveBeenCalledWith(weekLogDay);
    });

    it('emits previousMonth and nextMonth', () => {
        const prevSpy = jasmine.createSpy('previousMonth');
        const nextSpy = jasmine.createSpy('nextMonth');
        component.previousMonth.subscribe(prevSpy);
        component.nextMonth.subscribe(nextSpy);

        fixture.nativeElement.querySelector('button[aria-label="Mes anterior"]')!.click();
        fixture.nativeElement.querySelector('button[aria-label="Mes siguiente"]')!.click();

        expect(prevSpy).toHaveBeenCalled();
        expect(nextSpy).toHaveBeenCalled();
    });

    it('shows the loading state without tiles', () => {
        fixture.componentRef.setInput('loading', true);
        fixture.detectChanges();

        expect(qs('app-loading')).toBeTruthy();
        expect(qs('[data-date]')).toBeNull();
    });

    it('shows the error state and emits reload', () => {
        fixture.componentRef.setInput('error', true);
        fixture.detectChanges();

        const reloadSpy = jasmine.createSpy('reload');
        component.reload.subscribe(reloadSpy);

        const buttons: HTMLButtonElement[] = Array.from(
            fixture.nativeElement.querySelectorAll('button'),
        );
        const retry = buttons.find((b) => b.textContent?.includes('Reintentar'));
        expect(retry).toBeTruthy();
        expect(retry?.textContent).toContain('Reintentar');
        retry!.click();

        expect(reloadSpy).toHaveBeenCalled();
    });

    it('marks clickable tiles as role=button', () => {
        fixture.componentRef.setInput('days', [
            weekLogDay,
            {
                date: '2026-02-03',
                type: CalendarDayType.DAY_LOG,
                status: TrainingStatus.COMPLETE,
                dayLogId: 'day-1',
                weekLogReference: null,
            },
        ]);
        fixture.detectChanges();

        expect(qs('[data-date="2026-02-02"]')!.getAttribute('role')).toBe('button');
        expect(qs('[data-date="2026-02-03"]')!.getAttribute('role')).toBe('button');
    });

    it('makes a REST week-log day with extras clickable (FR-011)', () => {
        fixture.componentRef.setInput('days', [
            {
                date: '2026-02-04',
                type: CalendarDayType.WEEK_LOG,
                status: TrainingStatus.REST,
                weekLogReference: { ...weekLogDay.weekLogReference! },
                extraSessions: [
                    {
                        id: 'extra-1',
                        category: ExtraSessionCategory.CARDIO,
                        discipline: 'running',
                        date: '2026-02-04',
                        duration: 30,
                        intensityLevel: 3,
                        calories: 320,
                        notes: 'cardio de recuperación',
                    },
                ],
            },
        ]);
        fixture.detectChanges();

        expect(qs('[data-date="2026-02-04"]')!.getAttribute('role')).toBe('button');
    });
});
