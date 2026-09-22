import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraSessionShow } from './extra-session-show';
import {
    ExtraSession,
    ExtraSessionCategory,
    ExtraSessionDisciplineConfig,
} from '../../../../interfaces/extra-session.interface';

describe('ExtraSessionShow', () => {
    let component: ExtraSessionShow;
    let fixture: ComponentFixture<ExtraSessionShow>;

    const catalog: ExtraSessionDisciplineConfig[] = [
        { key: 'running', label: 'Running', category: ExtraSessionCategory.CARDIO, met: 9.8 },
    ];

    const session: ExtraSession = {
        id: 'extra-1',
        category: ExtraSessionCategory.CARDIO,
        discipline: 'running',
        date: '2026-02-03',
        duration: 30,
        intensityLevel: 3,
        calories: 320,
        notes: 'trotada',
    };

    const qs = (selector: string): HTMLElement | null =>
        fixture.nativeElement.querySelector(selector);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExtraSessionShow],
        }).compileComponents();

        fixture = TestBed.createComponent(ExtraSessionShow);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('session', session);
        fixture.componentRef.setInput('disciplines', catalog);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('resolves the discipline label from the catalog', () => {
        expect(qs('h4')!.textContent).toContain('Running');
    });

    it('falls back to the raw discipline when not in the catalog', () => {
        fixture.componentRef.setInput('disciplines', []);
        fixture.detectChanges();
        expect(qs('h4')!.textContent).toContain('running');
    });

    it('renders duration, intensity and calories', () => {
        expect(qs('[data-test="extra-duration"]')!.textContent).toContain('30');
        expect(qs('[data-test="extra-intensity"]')!.textContent).toContain('3');
        expect(qs('[data-test="extra-calories"]')!.textContent).toContain('320');
    });

    it('renders the notes', () => {
        expect(fixture.nativeElement.textContent).toContain('trotada');
    });

    it('shows the category as an uppercase badge', () => {
        expect(fixture.nativeElement.textContent).toContain('CARDIO');
    });

    it('has no edit/delete controls (read-only)', () => {
        const text = fixture.nativeElement.textContent;
        expect(text).not.toContain('Modificar');
        expect(text).not.toContain('Eliminar');
    });
});
