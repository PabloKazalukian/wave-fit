import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatsSection } from './stats-section';

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
