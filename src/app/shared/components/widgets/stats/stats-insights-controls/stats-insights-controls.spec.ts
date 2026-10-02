import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DateService } from '../../../../../core/services/date.service';
import type { LocalDate, LocalDateRange } from '../../../../interfaces/local-date.interface';
import {
    type StatsInsightsMetricOption,
    type StatsInsightsSection,
} from '../../../../interfaces/stats-insights.interface';
import { StatsDateRange } from '../stats-date-range/stats-date-range';
import { StatsInsightsControls } from './stats-insights-controls';

const FROM: LocalDate = '2026-08-03';
const TO: LocalDate = '2026-09-01';
const OTHER: LocalDateRange = { from: '2026-08-10', to: '2026-08-20' };
const TODAY: LocalDate = '2026-09-01';

const OPTIONS: StatsInsightsMetricOption[] = [
    { section: 'oneRm', label: '1RM semanal por ejercicio' },
    { section: 'calories', label: 'Calorías semanales' },
];

/**
 * TEST-023 (sdd/stats-insights/spec.md, FR-022).
 *
 * El widget es la cadena completa del flujo y **no consulta**: su único output es
 * `run`. Lo que se verifica acá es que la cadena sea real — una métrica, un rango,
 * un botón — y sobre todo que editar una fecha **no** dispare nada (FR-023), que es
 * la diferencia entre este flujo y el anterior, donde `rangeChange` re-disparaba las
 * seis queries.
 */
describe('StatsInsightsControls (TEST-023)', () => {
    let fixture: ComponentFixture<StatsInsightsControls>;
    let cmp: StatsInsightsControls;

    const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const select = (): HTMLSelectElement => el().querySelector('select')!;
    const rangeWidget = (): StatsDateRange =>
        fixture.debugElement.query(By.directive(StatsDateRange)).componentInstance;
    const submitButton = (): HTMLButtonElement =>
        el().querySelector<HTMLButtonElement>('[data-test="run-charts"]')!;

    const build = (): void => {
        fixture = TestBed.createComponent(StatsInsightsControls);
        cmp = fixture.componentInstance;
        fixture.componentRef.setInput('options', OPTIONS);
        fixture.componentRef.setInput('from', FROM);
        fixture.componentRef.setInput('to', TO);
        fixture.detectChanges();
    };

    const runs = (): { section: StatsInsightsSection; range: LocalDateRange }[] => {
        const emitted: { section: StatsInsightsSection; range: LocalDateRange }[] = [];
        fixture.componentInstance.run.subscribe((r) => emitted.push(r));
        return emitted;
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StatsInsightsControls],
        }).compileComponents();

        // Sólo se fija "hoy". El resto del cálculo de fechas corre de verdad:
        // este widget no toca aritmética, la delega en `app-stats-date-range`.
        spyOn(TestBed.inject(DateService), 'todayLocalDate').and.returnValue(TODAY);
    });

    describe('the chain (AC-014)', () => {
        it('renders the select, the range widget and the submit button, in order', () => {
            build();
            const host = el();

            expect(host.querySelector('app-stats-date-range')).withContext('FR-006').not.toBeNull();
            expect(host.querySelectorAll('select').length).toBe(1);
            expect(host.querySelector('app-stats-date-range')).not.toBeNull();

            const nodes = Array.from(
                host.querySelectorAll('select, app-stats-date-range, [data-test="run-charts"]'),
            );
            const order = nodes.map((n) =>
                n.tagName.toLowerCase() === 'select'
                    ? 'select'
                    : (n.getAttribute('data-test') ?? n.tagName.toLowerCase()),
            );
            expect(order).toEqual(['select', 'app-stats-date-range', 'run-charts']);
        });

        it('offers exactly one option per metric, labelled in product language', () => {
            build();

            const values = Array.from(select().options)
                .map((o) => o.value)
                .filter((v) => v !== '');

            expect(values.length).withContext('una opción por métrica, sin el placeholder').toBe(2);
            expect(select().textContent).toContain('1RM semanal por ejercicio');
            expect(select().textContent).toContain('Calorías semanales');
        });

        it('seeds the range widget with the from/to inputs (FR-004)', () => {
            build();

            expect(rangeWidget().from()).toBe(FROM);
            expect(rangeWidget().to()).toBe(TO);
        });
    });

    describe('the button gate', () => {
        it('is disabled with no metric selected', () => {
            build();

            expect(submitButton().disabled).withContext('AC-014').toBe(true);
        });

        it('enables once a metric is selected', () => {
            build();
            const control = cmp.metricControl;

            control.setValue('calories');
            fixture.detectChanges();

            expect(submitButton().disabled).toBe(false);
        });

        it('disables itself while a run is in flight (isRunning)', () => {
            build();
            cmp.metricControl.setValue('calories');
            fixture.componentRef.setInput('isRunning', true);
            fixture.detectChanges();

            expect(submitButton().disabled).toBe(true);
            expect(el().querySelector('app-spinner')).not.toBeNull();
        });
    });

    describe('nothing queries until the button (FR-023, AC-002)', () => {
        it('emits nothing when a date is edited', () => {
            build();
            cmp.metricControl.setValue('calories');
            const emitted = runs();
            fixture.detectChanges();

            rangeWidget().rangeChange.emit(OTHER);
            fixture.detectChanges();

            expect(emitted)
                .withContext('editar una fecha no dispara nada: sólo el botón lo hace')
                .toEqual([]);
        });

        it('emits nothing when the metric changes', () => {
            build();
            const emitted = runs();

            cmp.metricControl.setValue('oneRm');
            fixture.detectChanges();

            expect(emitted).toEqual([]);
        });

        it('emits nothing when the button is pressed with no metric', () => {
            build();
            const emitted = runs();
            fixture.detectChanges();

            submitButton().click();
            fixture.detectChanges();

            expect(emitted).toEqual([]);
        });
    });

    describe('run', () => {
        it('emits the selected section with the seeded range', () => {
            build();
            const emitted = runs();
            cmp.metricControl.setValue('calories');
            fixture.detectChanges();

            submitButton().click();
            fixture.detectChanges();

            expect(emitted).toEqual([{ section: 'calories', range: { from: FROM, to: TO } }]);
        });

        it('emits the pending range, not the seeded one, after a date edit', () => {
            build();
            const emitted = runs();
            cmp.metricControl.setValue('oneRm');
            rangeWidget().rangeChange.emit(OTHER);
            fixture.detectChanges();

            submitButton().click();
            fixture.detectChanges();

            expect(emitted).toEqual([{ section: 'oneRm', range: OTHER }]);
        });

        it('emits the latest range when the button is pressed repeatedly', () => {
            build();
            const emitted = runs();
            cmp.metricControl.setValue('oneRm');
            fixture.detectChanges();

            submitButton().click();
            rangeWidget().rangeChange.emit(OTHER);
            fixture.detectChanges();
            submitButton().click();
            fixture.detectChanges();

            expect(emitted.length).toBe(2);
            expect(emitted[1].range).toEqual(OTHER);
        });
    });
});
