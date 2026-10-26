import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DayDeferredForm } from './day-deferred-form';
import { DayLogVM } from '../../../../interfaces/day-log.interface';
import { ExerciseCategory } from '../../../../interfaces/exercise.interface';

describe('DayDeferredForm', () => {
    let component: DayDeferredForm;
    let fixture: ComponentFixture<DayDeferredForm>;

    const qs = (selector: string): HTMLElement | null =>
        fixture.nativeElement.querySelector(selector);

    const dayLog: DayLogVM = {
        id: 'day-1',
        userId: 'user-1',
        date: '2026-10-15',
        exercises: [
            {
                exerciseId: 'ex-1',
                name: 'Press banca',
                series: 3,
                category: ExerciseCategory.CHEST,
                sets: [{ reps: 10, weights: 50 }],
                usesWeight: true,
            },
        ],
        extraSessionIds: ['extra-1'],
        status: 'complete',
        active: false,
        completed: true,
        notes: 'Buen día',
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DayDeferredForm],
        }).compileComponents();

        fixture = TestBed.createComponent(DayDeferredForm);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('renders the date-only demo form when no day-log is loaded', () => {
        fixture.componentRef.setInput('date', '2026-10-15');
        fixture.detectChanges();

        expect((qs('#deferred-date') as HTMLInputElement).value).toBe('15-10-2026');
        expect((qs('#deferred-status') as HTMLInputElement).value).toBe('—');
        expect((qs('#deferred-completed') as HTMLInputElement).value).toBe('—');
        expect(qs('[data-test="day-deferred-form"]')!.textContent).toContain('Sin ejercicios');
        expect(qs('[data-test="day-deferred-form"]')!.textContent).toContain(
            'no hay datos cargados',
        );
    });

    it('renders the day-log data with simple readonly labels', () => {
        fixture.componentRef.setInput('date', '2026-10-15');
        fixture.componentRef.setInput('dayLog', dayLog);
        fixture.detectChanges();

        expect((qs('#deferred-date') as HTMLInputElement).value).toBe('15-10-2026');
        expect((qs('#deferred-status') as HTMLInputElement).value).toBe('Completado');
        expect((qs('#deferred-completed') as HTMLInputElement).value).toBe('Sí');
        expect((qs('#deferred-notes') as HTMLTextAreaElement).value).toBe('Buen día');

        const text = qs('[data-test="day-deferred-form"]')!.textContent!;
        expect(text).toContain('Press banca');
        expect(text).toContain('3 series');
        expect(text).toContain('1 sesión extra');
    });

    it('shows the loading state', () => {
        fixture.componentRef.setInput('loading', true);
        fixture.detectChanges();

        expect(qs('app-loading')).toBeTruthy();
        expect(qs('#deferred-date')).toBeNull();
    });

    it('shows the error state and emits retry', () => {
        fixture.componentRef.setInput('error', true);
        fixture.detectChanges();

        const retrySpy = jasmine.createSpy('retry');
        component.retry.subscribe(retrySpy);

        const button = qs('[data-test="day-deferred-retry"]')!;
        expect(button.textContent).toContain('Reintentar');
        button.click();

        expect(retrySpy).toHaveBeenCalled();
    });
});
