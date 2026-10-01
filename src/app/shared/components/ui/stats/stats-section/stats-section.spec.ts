import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatsSection } from './stats-section';

/** Host con contenido proyectado: sin él no se puede probar que `<ng-content>` sobrevive. */
@Component({
    imports: [StatsSection],
    template: `<app-stats-section [refreshing]="refreshing()" [loading]="loading()"><p class="projected">contenido real</p></app-stats-section>`,
})
class Host {
    refreshing = signal(false);
    loading = signal(false);
}

describe('StatsSection (TEST-009)', () => {
    let component: StatsSection;
    let fixture: ComponentFixture<StatsSection>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StatsSection],
        }).compileComponents();

        fixture = TestBed.createComponent(StatsSection);
        component = fixture.componentInstance;
    });

    it('renders the content shell without loading/error/empty', () => {
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        expect(host.querySelector('section')).not.toBeNull();
        expect(host.querySelector('[aria-busy="true"]')).toBeNull();
        expect(host.querySelector('[role="alert"]')).toBeNull();
    });

    it('renders the skeleton while loading', () => {
        fixture.componentRef.setInput('loading', true);
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        expect(host.querySelector('[aria-busy="true"]')).not.toBeNull();
        expect(host.querySelector('.animate-pulse')).not.toBeNull();
    });

    it('shows an empty message when empty', () => {
        fixture.componentRef.setInput('empty', true);
        fixture.componentRef.setInput('emptyMessage', 'Aún no hay datos de ejercicios destacados.');
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        expect(host.textContent).toContain('Aún no hay datos de ejercicios destacados.');
    });

    it('shows the error message with a retry button and emits retry', () => {
        fixture.componentRef.setInput('error', 'boom');
        fixture.detectChanges();

        let retried = false;
        component.retry.subscribe(() => (retried = true));

        const host = fixture.nativeElement as HTMLElement;
        expect(host.textContent).toContain('boom');

        const button = host.querySelector('button') as HTMLButtonElement;
        expect(button?.textContent).toContain('Reintentar');
        button?.click();
        expect(retried).toBe(true);
    });

    it('projects content when data is available', () => {
        fixture.componentRef.setInput('empty', false);
        fixture.componentRef.setInput('loading', false);
        fixture.componentRef.setInput('error', null);
        fixture.componentRef.setInput('computedAt', '2026-09-20T10:05:00.000Z');
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('section')).not.toBeNull();
    });
});

describe('StatsSection refreshing + subtitle (TEST-020)', () => {
    let fixture: ComponentFixture<Host>;
    let host: Host;

    const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const spinner = (): HTMLElement | null => el().querySelector('app-loading');
    const projected = (): HTMLElement | null => el().querySelector('.projected');

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

        fixture = TestBed.createComponent(Host);
        host = fixture.componentInstance;
    });

    it('renders no spinner when not refreshing', () => {
        fixture.detectChanges();

        expect(spinner()).toBeNull();
    });

    it('renders app-loading in the header while refreshing', () => {
        host.refreshing.set(true);
        fixture.detectChanges();

        expect(spinner()).not.toBeNull();
        // El spinner va en el <header>, no en el cuerpo de la card.
        expect(el().querySelector('header app-loading')).not.toBeNull();
    });

    it('keeps the projected content visible while refreshing', () => {
        host.refreshing.set(true);
        fixture.detectChanges();

        // FR-009 / NFR-007: el chart anterior sigue en pantalla; el spinner sólo
        // acompaña. Reemplazarlo por un esqueleto sería perder el rango anterior.
        expect(projected()).not.toBeNull();
    });

    it('prefers loading over refreshing: refreshing alone must not suppress the skeleton', () => {
        host.refreshing.set(true);
        host.loading.set(true);
        fixture.detectChanges();

        expect(el().querySelector('[aria-busy="true"]')).not.toBeNull();
        expect(projected()).toBeNull();
    });

    it('prefers error over refreshing: a failed section still shows the error card', () => {
        const errorFixture = TestBed.createComponent(StatsSection);
        errorFixture.componentRef.setInput('refreshing', true);
        errorFixture.componentRef.setInput('error', 'boom');
        errorFixture.detectChanges();

        const errorEl = errorFixture.nativeElement as HTMLElement;
        expect(errorEl.querySelector('[role="alert"]')).not.toBeNull();
        expect(errorEl.querySelector('[aria-busy="true"]')).toBeNull();
    });

    describe('subtitle', () => {
        it('renders nothing when not provided', () => {
            fixture.detectChanges();

            expect(el().querySelector('.subtitle')).toBeNull();
        });

        it('renders the provided subtitle', () => {
            const subtitleFixture = TestBed.createComponent(StatsSection);
            subtitleFixture.componentRef.setInput('subtitle', '01/09/2026 - 30/09/2026');
            subtitleFixture.detectChanges();

            const subtitleEl = subtitleFixture.nativeElement as HTMLElement;
            expect(subtitleEl.querySelector('.subtitle')?.textContent).toContain(
                '01/09/2026 - 30/09/2026',
            );
        });

        it('renders empty string as nothing', () => {
            const subtitleFixture = TestBed.createComponent(StatsSection);
            subtitleFixture.componentRef.setInput('subtitle', '');
            subtitleFixture.detectChanges();

            const subtitleEl = subtitleFixture.nativeElement as HTMLElement;
            expect(subtitleEl.querySelector('.subtitle')).toBeNull();
        });
    });

    it('keeps computedAt rendering for the /stats dashboard', () => {
        const computedFixture = TestBed.createComponent(StatsSection);
        computedFixture.componentRef.setInput('computedAt', '2026-09-20T10:05:00.000Z');
        computedFixture.detectChanges();

        const computedEl = computedFixture.nativeElement as HTMLElement;
        expect(computedEl.textContent).toContain('Actualizado');
    });
});
