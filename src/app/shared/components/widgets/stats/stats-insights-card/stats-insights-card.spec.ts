import { Component, Signal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { Options } from 'highcharts';
import { provideHighcharts } from 'highcharts-angular';
import { StatsSection } from '../../../ui/stats/stats-section/stats-section';
import { StatsChart } from '../stats-chart/stats-chart';
import { StatsInsightsCard } from './stats-insights-card';

const options = (title: string): Options => ({ title: { text: title } }) as Options;

@Component({
    standalone: true,
    imports: [StatsInsightsCard],
    template: `
        <app-stats-insights-card
            [title]="title"
            [subtitle]="subtitle"
            [emptyMessage]="emptyMessage"
            [charts]="charts"
            [loading]="loading"
            [hasData]="hasData"
            [empty]="empty"
            [error]="error"
            (retry)="retries = retries + 1"
        >
            <p cardExtras data-test="extras">detalle</p>
        </app-stats-insights-card>
    `,
})
class Host {
    title = 'Volumen semanal';
    subtitle: string | null = null;
    emptyMessage = 'No hay volumen en este rango.';
    charts: readonly Signal<Options | null>[] = [
        signal<Options | null>(options('a')),
        signal<Options | null>(null),
    ];
    loading = false;
    hasData = true;
    empty = false;
    error: string | null = null;
    retries = 0;
}

describe('StatsInsightsCard (TEST-024)', () => {
    let fixture: ComponentFixture<Host>;
    let host: Host;

    const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const section = (): StatsSection =>
        fixture.debugElement.query(By.directive(StatsSection)).componentInstance;
    const projected = (): HTMLElement | null =>
        el().querySelector<HTMLElement>('[data-test="extras"]');
    const chartCount = (): number => fixture.debugElement.queryAll(By.directive(StatsChart)).length;
    const skeleton = (): HTMLElement | null =>
        el().querySelector<HTMLElement>('[aria-busy="true"]');

    /** Monta con defaults: un chart resuelto, sin loading, con data. */
    const build = (): void => {
        fixture = TestBed.createComponent(Host);
        host = fixture.componentInstance;
        fixture.detectChanges();
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Host],
            // `app-stats-chart` monta `<highcharts-chart>`, que pide el loader
            // como token. La card se prueba por su forma, no por el render de
            // Highcharts (eso es de `stats-chart.spec.ts`).
            providers: [provideHighcharts()],
        }).compileComponents();
    });

    describe('loading vs refreshing derivation (AC-005)', () => {
        it('shows the skeleton on a first load: loading without data', () => {
            build();
            host.loading = true;
            host.hasData = false;
            fixture.detectChanges();

            expect(skeleton()).not.toBeNull();
            expect(section().loading()).toBe(true);
            expect(section().refreshing()).toBe(false);
        });

        it('keeps the chart on screen during a refetch: loading with data', () => {
            build();
            host.loading = true;
            host.hasData = true;
            fixture.detectChanges();

            expect(skeleton()).withContext('el esqueleto taparía el chart anterior').toBeNull();
            expect(section().loading()).toBe(false);
            expect(section().refreshing()).toBe(true);
        });

        it('is idle when not loading, even with data on screen', () => {
            build();
            host.loading = false;
            host.hasData = true;
            fixture.detectChanges();

            expect(section().loading()).toBe(false);
            expect(section().refreshing()).toBe(false);
        });

        it('stops refreshing once the request resolves, keeping the same data', () => {
            build();
            host.loading = true;
            host.hasData = true;
            fixture.detectChanges();
            expect(section().refreshing()).toBe(true);

            host.loading = false;
            fixture.detectChanges();

            expect(section().refreshing()).toBe(false);
            expect(chartCount()).toBe(1);
        });
    });

    describe('precedence', () => {
        it('loading wins over error, empty and content', () => {
            build();
            host.loading = true;
            host.hasData = false;
            host.error = 'boom';
            host.empty = true;
            fixture.detectChanges();

            expect(skeleton()).not.toBeNull();
            expect(section().loading()).toBe(true);
            expect(el().textContent)
                .withContext('el shell precedencea loading: no muestra el error')
                .not.toContain('boom');
            expect(chartCount()).toBe(0);
        });

        it('error wins over empty and content', () => {
            build();
            host.error = 'boom';
            host.empty = true;
            fixture.detectChanges();

            expect(section().error()).toBe('boom');
            expect(chartCount()).toBe(0);
            expect(projected()).toBeNull();
        });

        it('empty wins over content', () => {
            build();
            host.empty = true;
            fixture.detectChanges();

            expect(section().empty()).toBe(true);
            expect(chartCount()).toBe(0);
            expect(projected()).toBeNull();
        });

        it('renders the content branch when none of the three apply', () => {
            build();

            expect(section().loading()).toBe(false);
            expect(section().error()).toBeNull();
            expect(section().empty()).toBe(false);
            expect(chartCount()).toBe(1);
        });
    });

    describe('charts', () => {
        it('renders one app-stats-chart per non-null options signal', () => {
            build();
            host.charts = [
                signal<Options | null>(options('a')),
                signal<Options | null>(null),
                signal<Options | null>(options('c')),
            ];
            fixture.detectChanges();

            expect(chartCount()).toBe(2);
        });

        it('renders nothing for a volume-style pair when both are null', () => {
            build();
            host.charts = [signal<Options | null>(null), signal<Options | null>(null)];
            fixture.detectChanges();

            expect(chartCount()).toBe(0);
        });

        it('forwards the options object to each chart', () => {
            build();
            host.charts = [signal<Options | null>(options('primero'))];
            fixture.detectChanges();

            const charts = fixture.debugElement.queryAll(By.directive(StatsChart));
            expect(charts[0].componentInstance.options().title?.text).toBe('primero');
        });
    });

    describe('header', () => {
        it('passes the title and subtitle through', () => {
            build();
            host.subtitle = '01/07/2026 → 31/07/2026';
            fixture.detectChanges();

            expect(section().title()).toBe('Volumen semanal');
            expect(section().subtitle()).toBe('01/07/2026 → 31/07/2026');
        });

        it('leaves the subtitle null when none is given', () => {
            build();

            expect(section().subtitle()).toBeNull();
        });

        it('re-emits retry from the shell', () => {
            build();
            expect(host.retries).toBe(0);

            section().retry.emit();

            expect(host.retries).toBe(1);
        });
    });

    describe('cardExtras projection', () => {
        it('is projected in the content branch', () => {
            build();

            expect(projected()).not.toBeNull();
        });

        it('is not projected in the error branch', () => {
            build();
            host.error = 'boom';
            fixture.detectChanges();

            expect(projected()).toBeNull();
        });

        it('is not projected in the empty branch', () => {
            build();
            host.empty = true;
            fixture.detectChanges();

            expect(projected()).toBeNull();
        });

        it('is not projected in the skeleton branch', () => {
            build();
            host.loading = true;
            host.hasData = false;
            fixture.detectChanges();

            expect(projected()).toBeNull();
        });
    });
});
