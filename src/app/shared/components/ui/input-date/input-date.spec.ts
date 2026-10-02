import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { InputDate } from './input-date';
import { DateService } from '../../../../core/services/date.service';
import type { LocalDate } from '../../../interfaces/local-date.interface';

describe('InputDate (TEST-001, TEST-002, TEST-025)', () => {
    const TODAY = '2026-09-01';
    const SELECTED = '2026-09-15';

    let fixture: ComponentFixture<InputDate>;
    let control: FormControl<LocalDate | null>;

    const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const trigger = (): HTMLButtonElement => el().querySelector('button[aria-expanded]')!;
    const popover = (): HTMLElement | null => el().querySelector('.calendar-popover');
    const day = (localDate: string): HTMLButtonElement | null =>
        el().querySelector<HTMLButtonElement>(`button[data-date="${localDate}"]`);

    const build = (value: LocalDate | null): void => {
        control = new FormControl<LocalDate | null>(value);
        fixture = TestBed.createComponent(InputDate);
        fixture.componentRef.setInput('control', control);
        fixture.detectChanges();
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [InputDate] }).compileComponents();

        // Se fija "hoy" para que el marcado de hoy sea determinista sin meterse
        // con el reloj del runner.
        spyOn(TestBed.inject(DateService), 'todayLocalDate').and.returnValue(TODAY);
    });

    describe('display (TEST-001)', () => {
        it('renders the bound LocalDate as dd/MM/yyyy', () => {
            build(SELECTED);

            expect(el().textContent).toContain('15/09/2026');
        });

        it('renders the placeholder when empty', () => {
            build(null);

            const display = el().querySelector('.value-display');
            expect(display?.textContent).toContain('dd/mm/aaaa');
        });

        it('renders the label', () => {
            build(SELECTED);
            fixture.componentRef.setInput('label', 'Desde');
            fixture.detectChanges();

            expect(el().textContent).toContain('Desde');
        });
    });

    describe('popover (TEST-001)', () => {
        it('starts closed with aria-expanded false', () => {
            build(SELECTED);

            expect(popover()).toBeNull();
            expect(trigger().getAttribute('aria-expanded')).toBe('false');
        });

        it('opens on trigger click and reflects it in aria-expanded', () => {
            build(SELECTED);

            trigger().click();
            fixture.detectChanges();

            expect(popover()).not.toBeNull();
            expect(trigger().getAttribute('aria-expanded')).toBe('true');
        });

        it('toggles closed on a second trigger click', () => {
            build(SELECTED);

            trigger().click();
            fixture.detectChanges();
            trigger().click();
            fixture.detectChanges();

            expect(popover()).toBeNull();
        });

        it('labels the grid for assistive tech', () => {
            build(SELECTED);
            trigger().click();
            fixture.detectChanges();

            expect(el().querySelector('[aria-label]')).not.toBeNull();
        });

        it('renders a weekday header and the days of the month', () => {
            build(SELECTED);
            trigger().click();
            fixture.detectChanges();

            expect(el().querySelectorAll('.weekday').length).toBe(7);
            // Septiembre 2026 tiene 30 días.
            expect(day('2026-09-01')).not.toBeNull();
            expect(day('2026-09-30')).not.toBeNull();
        });

        it('pads the grid to whole weeks, marking the filler as out of month', () => {
            build(SELECTED);
            trigger().click();
            fixture.detectChanges();

            const cells = el().querySelectorAll('.calendar-popover [data-date]');
            // Un calendario mensual siempre cierra la semana: el relleno existe,
            // lo que no debe es parecer un día del mes.
            expect(cells.length % 7).toBe(0);
            // El 1 de septiembre de 2026 es martes, así que la semana arranca el
            // 31 de agosto y termina el 1 de octubre.
            expect(day('2026-08-31')!.classList).toContain('opacity-30');
            expect(day('2026-10-01')!.classList).toContain('opacity-30');
            expect(day('2026-09-15')!.classList).not.toContain('opacity-30');
        });

        it('navigates to the previous and next month', () => {
            build(SELECTED);
            trigger().click();
            fixture.detectChanges();

            el().querySelector<HTMLButtonElement>('[data-nav="prev"]')!.click();
            fixture.detectChanges();
            expect(day('2026-08-15')).not.toBeNull();

            el().querySelector<HTMLButtonElement>('[data-nav="next"]')!.click();
            fixture.detectChanges();
            expect(el().querySelector('[data-nav="next"]')).not.toBeNull();
            expect(day('2026-09-15')).not.toBeNull();
        });

        it('closes on Escape', () => {
            build(SELECTED);
            trigger().click();
            fixture.detectChanges();

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            fixture.detectChanges();

            expect(popover()).toBeNull();
        });

        it('closes on an outside click', () => {
            build(SELECTED);
            trigger().click();
            fixture.detectChanges();

            document.body.click();
            fixture.detectChanges();

            expect(popover()).toBeNull();
        });

        it('stays open when clicking inside the popover', () => {
            build(SELECTED);
            trigger().click();
            fixture.detectChanges();

            popover()!.click();
            fixture.detectChanges();

            expect(popover()).not.toBeNull();
        });
    });

    describe('selection (TEST-001)', () => {
        it('emits dateChange with a yyyy-MM-dd string', () => {
            build(SELECTED);
            const emitted: LocalDate[] = [];
            fixture.componentInstance.dateChange.subscribe((d) => emitted.push(d));

            trigger().click();
            fixture.detectChanges();
            day('2026-09-22')!.click();

            expect(emitted).toEqual(['2026-09-22']);
        });

        it('writes the selection to the control and marks it dirty', () => {
            build(SELECTED);

            trigger().click();
            fixture.detectChanges();
            day('2026-09-22')!.click();

            expect(control.value).toBe('2026-09-22');
            expect(control.dirty).toBe(true);
        });

        it('closes after a selection', () => {
            build(SELECTED);
            trigger().click();
            fixture.detectChanges();

            day('2026-09-22')!.click();
            fixture.detectChanges();

            expect(popover()).toBeNull();
        });
    });

    describe('min / max (TEST-002)', () => {
        it('disables days before min', () => {
            build(SELECTED);
            fixture.componentRef.setInput('min', '2026-09-10');
            fixture.detectChanges();
            trigger().click();
            fixture.detectChanges();

            expect(day('2026-09-09')!.disabled).toBe(true);
            expect(day('2026-09-10')!.disabled).toBe(false);
            expect(day('2026-09-15')!.disabled).toBe(false);
        });

        it('disables days after max', () => {
            build(SELECTED);
            fixture.componentRef.setInput('max', '2026-09-20');
            fixture.detectChanges();
            trigger().click();
            fixture.detectChanges();

            expect(day('2026-09-20')!.disabled).toBe(false);
            expect(day('2026-09-21')!.disabled).toBe(true);
        });

        it('does not emit or write when a disabled day is clicked', () => {
            build(SELECTED);
            fixture.componentRef.setInput('min', '2026-09-10');
            fixture.detectChanges();
            const emitted: LocalDate[] = [];
            fixture.componentInstance.dateChange.subscribe((d) => emitted.push(d));

            trigger().click();
            fixture.detectChanges();
            day('2026-09-05')!.click();

            expect(emitted).toEqual([]);
            expect(control.value).toBe(SELECTED);
        });

        it('excludes disabled days from the tab order', () => {
            build(SELECTED);
            fixture.componentRef.setInput('min', '2026-09-10');
            fixture.detectChanges();
            trigger().click();
            fixture.detectChanges();

            expect(day('2026-09-05')!.getAttribute('tabindex')).toBe('-1');
            expect(day('2026-09-15')!.getAttribute('tabindex')).toBe('0');
        });
    });

    describe('day state (TEST-002)', () => {
        it('marks today and the selected day distinguishably', () => {
            build(SELECTED);
            trigger().click();
            fixture.detectChanges();

            expect(day(TODAY)!.classList).toContain('is-today');
            expect(day(SELECTED)!.classList).toContain('is-selected');
            // Hoy no está seleccionado en este caso, y viceversa.
            expect(day(TODAY)!.classList).not.toContain('is-selected');
            expect(day(SELECTED)!.classList).not.toContain('is-today');
        });

        it('marks today even when nothing is selected', () => {
            build(null);
            trigger().click();
            fixture.detectChanges();

            expect(day(TODAY)!.classList).toContain('is-today');
        });
    });

    describe('day hover (TEST-025)', () => {
        it('tints an enabled, non-selected day on hover', () => {
            build(SELECTED);
            trigger().click();
            fixture.detectChanges();

            expect(day('2026-09-22')!.classList).toContain('hover:bg-accent/70');
        });

        it('does not tint the selected day, whose fill is the current value', () => {
            build(SELECTED);
            trigger().click();
            fixture.detectChanges();

            expect(day(SELECTED)!.classList).toContain('bg-primary');
            expect(day(SELECTED)!.classList).not.toContain('hover:bg-accent/70');
        });

        it('tints today when it is not the selected day', () => {
            build(SELECTED);
            trigger().click();
            fixture.detectChanges();

            expect(day(TODAY)!.classList).toContain('hover:bg-accent/70');
        });

        it('neutralizes the hover on a disabled day', () => {
            build(SELECTED);
            fixture.componentRef.setInput('min', '2026-09-10');
            fixture.detectChanges();
            trigger().click();
            fixture.detectChanges();

            // Tailwind aplica :hover a <button disabled> en algunos navegadores:
            // sin esta neutralización un día bloqueado parecería seleccionable.
            expect(day('2026-09-05')!.classList).toContain('disabled:hover:bg-transparent');
            expect(day('2026-09-05')!.classList).not.toContain('hover:bg-accent/70');
        });

        it('animates the day color instead of snapping', () => {
            build(SELECTED);
            trigger().click();
            fixture.detectChanges();

            expect(day('2026-09-22')!.classList).toContain('transition-colors');
        });
    });

    describe('does not write on its own (TEST-002)', () => {
        it('leaves the control untouched when the popover is opened and closed', () => {
            build(SELECTED);

            trigger().click();
            fixture.detectChanges();
            document.body.click();
            fixture.detectChanges();

            expect(control.value).toBe(SELECTED);
            expect(control.dirty).toBe(false);
        });

        it('leaves the control untouched when navigating months', () => {
            build(SELECTED);
            trigger().click();
            fixture.detectChanges();

            el().querySelector<HTMLButtonElement>('[data-nav="prev"]')!.click();
            fixture.detectChanges();
            el().querySelector<HTMLButtonElement>('[data-nav="next"]')!.click();
            fixture.detectChanges();

            expect(control.value).toBe(SELECTED);
            expect(control.dirty).toBe(false);
        });

        it('leaves the control untouched when changing min or max', () => {
            build(SELECTED);

            fixture.componentRef.setInput('min', '2026-09-10');
            fixture.componentRef.setInput('max', '2026-09-20');
            fixture.detectChanges();

            expect(control.value).toBe(SELECTED);
            expect(control.pristine).toBe(true);
        });
    });

    describe('malformed bound value', () => {
        it('falls back to the placeholder instead of throwing', () => {
            build('2026-02-30');

            const display = el().querySelector('.value-display');
            expect(display?.textContent).toContain('dd/mm/aaaa');
        });
    });
});
