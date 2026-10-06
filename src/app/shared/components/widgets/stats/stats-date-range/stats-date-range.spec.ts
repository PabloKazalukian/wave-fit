import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DateService } from '../../../../../core/services/date.service';
import type { LocalDate, LocalDateRange } from '../../../../interfaces/local-date.interface';
import {
    STATS_INSIGHTS_MAX_RANGE_DAYS,
    STATS_INSIGHTS_RANGE_PRESETS,
    type StatsDateRangePreset,
} from '../../../../interfaces/stats-insights.interface';
import { InputDate } from '../../../ui/input-date/input-date';
import { StatsDateRange } from './stats-date-range';

const FROM: LocalDate = '2026-09-01';
const TO: LocalDate = '2026-09-30';
const LATER: LocalDate = '2026-10-15';
const EARLIER: LocalDate = '2026-08-01';
const TODAY: LocalDate = '2026-09-30';

/** Desplaza una `LocalDate` en días. Ancla en UTC, así que no hay DST que mueva el resultado. */
const shiftDays = (iso: LocalDate, days: number): LocalDate =>
    new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86400000)
        .toISOString()
        .slice(0, 10) as LocalDate;

@Component({
    standalone: true,
    imports: [StatsDateRange],
    template: `
        <app-stats-date-range
            [from]="from"
            [to]="to"
            [maxDays]="maxDays"
            [presets]="presets"
            (rangeChange)="emitted.push($event)"
            (rangeInvalid)="errors.push($event)"
        />
    `,
})
class Host {
    from: LocalDate = FROM;
    to: LocalDate = TO;
    maxDays = STATS_INSIGHTS_MAX_RANGE_DAYS;
    presets: StatsDateRangePreset[] = [...STATS_INSIGHTS_RANGE_PRESETS];
    emitted: LocalDateRange[] = [];
    errors: (string | null)[] = [];
}

describe('StatsDateRange (TEST-003, TEST-004)', () => {
    let fixture: ComponentFixture<Host>;
    let host: Host;
    let cmp: StatsDateRange;
    let dateSvc: jasmine.SpyObj<DateService>;

    beforeEach(async () => {
        dateSvc = jasmine.createSpyObj<DateService>('DateService', [
            'lastNDays',
            'isValidLocalDate',
            'daysBetween',
            'todayLocalDate',
        ]);
        dateSvc.todayLocalDate.and.returnValue(TODAY);
        dateSvc.lastNDays.and.callFake((days: number) => ({
            from: shiftDays(TODAY, -(days - 1)),
            to: TODAY,
        }));
        dateSvc.isValidLocalDate.and.callFake((value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value));
        dateSvc.daysBetween.and.callFake((a: LocalDate, b: LocalDate) =>
            Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000),
        );

        await TestBed.configureTestingModule({
            imports: [Host],
            providers: [{ provide: DateService, useValue: dateSvc }],
        }).compileComponents();

        fixture = TestBed.createComponent(Host);
        host = fixture.componentInstance;
        fixture.detectChanges();
        cmp = fixture.debugElement.query(By.directive(StatsDateRange)).componentInstance;
    });

    const el = () => fixture.nativeElement as HTMLElement;
    const dateInputs = () => fixture.debugElement.queryAll(By.directive(InputDate));
    const presetButton = (days: number) =>
        el().querySelector<HTMLButtonElement>(`[data-test="preset-${days}"]`);
    const setFrom = (value: LocalDate | null) => cmp.form.controls.from.setValue(value);
    const setTo = (value: LocalDate | null) => cmp.form.controls.to.setValue(value);

    describe('composition and presets (TEST-003)', () => {
        it('renders exactly two date inputs', () => {
            expect(dateInputs().length).toBe(2);
        });

        it('renders one button per preset, in the documented order', () => {
            const rendered = Array.from(
                el().querySelectorAll<HTMLButtonElement>('[data-test^="preset-"]'),
            ).map((b) => Number(b.getAttribute('data-test')?.replace('preset-', '')));

            expect(rendered).toEqual(STATS_INSIGHTS_RANGE_PRESETS.map((p) => p.days));
        });

        it('resolves a preset through DateService and emits rangeChange', () => {
            presetButton(30)!.click();
            fixture.detectChanges();

            expect(dateSvc.lastNDays).toHaveBeenCalledOnceWith(30);
            expect(host.emitted).toEqual([{ from: FROM, to: TO }]);
            expect(host.errors).toEqual([]);
        });

        it('pushes the resolved range into both inputs', () => {
            presetButton(90)!.click();
            fixture.detectChanges();

            expect(cmp.value()).toEqual({ from: shiftDays(TODAY, -89), to: TODAY });
        });

        it('marks the resolved preset as active', () => {
            presetButton(90)!.click();
            fixture.detectChanges();

            expect(cmp.activePresetDays()).toBe(90);
        });

        it('clears the active preset when a custom range is chosen', () => {
            presetButton(90)!.click();
            fixture.detectChanges();

            setFrom(LATER);
            fixture.detectChanges();

            expect(cmp.activePresetDays()).toBeNull();
        });

        it('pushes `to` forward when `from` is picked after it, instead of invalidating', () => {
            setFrom(LATER);
            fixture.detectChanges();

            expect(host.errors).toEqual([]);
            expect(host.emitted).toEqual([{ from: LATER, to: LATER }]);
            // La corrección tiene que verse en los inputs, no sólo en el evento.
            expect(cmp.value()).toEqual({ from: LATER, to: LATER });
        });

        it('pushes `from` back when `to` is picked before it', () => {
            setTo(EARLIER);
            fixture.detectChanges();

            expect(host.errors).toEqual([]);
            expect(host.emitted).toEqual([{ from: EARLIER, to: EARLIER }]);
        });

        it('does not re-emit a correction in a loop', () => {
            setFrom(LATER);
            fixture.detectChanges();

            expect(host.emitted.length).toBe(1);
        });

        it('emits a user selection made in a real calendar', () => {
            const first = dateInputs()[0].componentInstance as InputDate;
            first.toggle();
            fixture.detectChanges();

            el().querySelector<HTMLButtonElement>('[data-date="2026-09-10"]')!.click();
            fixture.detectChanges();

            expect(host.emitted).toEqual([{ from: '2026-09-10', to: TO }]);
        });
    });

    describe('validation (TEST-004)', () => {
        it('reports and emits nothing when `to` is missing', () => {
            setTo(null);
            fixture.detectChanges();

            expect(host.emitted).toEqual([]);
            expect(cmp.invalidMessage()).toContain('fecha');
        });

        it('reports and emits nothing when `from` is missing', () => {
            setFrom(null);
            fixture.detectChanges();

            expect(host.emitted).toEqual([]);
            expect(cmp.invalidMessage()).toBeTruthy();
        });

        it('reports and emits nothing for a malformed calendar date', () => {
            dateSvc.isValidLocalDate.and.returnValue(false);

            setFrom('2026-02-30' as LocalDate);
            fixture.detectChanges();

            expect(host.emitted).toEqual([]);
            expect(cmp.invalidMessage()).toBeTruthy();
        });

        it('rejects a span over maxDays and names the limit in the message', () => {
            host.maxDays = 10;
            fixture.detectChanges();

            // `2026-09-20` deja un span de 19 días desde el `from` inicial.
            setTo('2026-09-20' as LocalDate);
            fixture.detectChanges();

            expect(host.emitted).toEqual([]);
            expect(cmp.invalidMessage()).toContain('10');
        });

        it('accepts a span of exactly maxDays', () => {
            host.maxDays = 19;
            fixture.detectChanges();

            setTo('2026-09-20' as LocalDate);
            fixture.detectChanges();

            expect(host.errors).toEqual([]);
            expect(host.emitted).toEqual([{ from: FROM, to: '2026-09-20' }]);
        });

        it('accepts a custom in-range range', () => {
            setTo('2026-09-20' as LocalDate);
            fixture.detectChanges();

            expect(host.errors).toEqual([]);
            expect(host.emitted).toEqual([{ from: FROM, to: '2026-09-20' }]);
        });

        it('clears the message once a valid range follows an invalid one', () => {
            dateSvc.isValidLocalDate.and.returnValue(false);
            setFrom('nope' as LocalDate);
            fixture.detectChanges();
            expect(cmp.invalidMessage()).toBeTruthy();

            dateSvc.isValidLocalDate.and.callFake((v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v));
            setFrom(FROM);
            fixture.detectChanges();

            expect(cmp.invalidMessage()).toBeNull();
            expect(host.emitted).toEqual([{ from: FROM, to: TO }]);
        });
    });

    describe('input binding', () => {
        it('syncs the inputs when the parent changes the range', () => {
            host.from = LATER;
            host.to = LATER;
            fixture.detectChanges();

            expect(cmp.value()).toEqual({ from: LATER, to: LATER });
        });

        it('does not emit when the parent pushes a range in', () => {
            host.from = LATER;
            host.to = LATER;
            fixture.detectChanges();

            expect(host.emitted).toEqual([]);
        });

        it('labels both inputs', () => {
            const labels = dateInputs().map((d) => (d.componentInstance as InputDate).label());
            expect(labels).toEqual(['Desde', 'Hasta']);
        });

        it('does not crop individual days: maxDays is a span limit, not a min/max', () => {
            host.maxDays = 7;
            fixture.detectChanges();

            for (const input of dateInputs()) {
                expect((input.componentInstance as InputDate).min()).toBeNull();
                expect((input.componentInstance as InputDate).max()).toBeNull();
            }
            expect(cmp.maxDays()).toBe(7);
        });

        it('accepts a custom preset list', () => {
            host.presets = [{ days: 14, label: 'Últimos 14 días' }];
            fixture.detectChanges();

            const rendered = Array.from(
                el().querySelectorAll<HTMLButtonElement>('[data-test^="preset-"]'),
            ).map((b) => b.getAttribute('data-test'));

            expect(rendered).toEqual(['preset-14']);
        });
    });
});
