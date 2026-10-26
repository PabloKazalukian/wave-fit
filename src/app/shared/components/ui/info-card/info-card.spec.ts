import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Activity, CalendarClock, CalendarX } from 'lucide-angular';

import { InfoCard } from './info-card';

describe('InfoCard', () => {
    let component: InfoCard;
    let fixture: ComponentFixture<InfoCard>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InfoCard],
        }).compileComponents();

        fixture = TestBed.createComponent(InfoCard);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('icon', Activity);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('renders the title, description and icon', () => {
        fixture.componentRef.setInput('title', 'Progresión');
        fixture.componentRef.setInput('description', 'Lleva el progreso del día.');
        fixture.detectChanges();

        const text = fixture.nativeElement.textContent;
        expect(text).toContain('Progresión');
        expect(text).toContain('Lleva el progreso del día.');
        expect(fixture.nativeElement.querySelector('lucide-icon')).toBeTruthy();
    });

    it('renders compact lines with their own icons', () => {
        fixture.componentRef.setInput('lines', [
            { icon: CalendarX, text: 'No hay datos en este día.' },
            { icon: CalendarClock, text: 'Podés agregarlo de forma diferida.' },
        ]);
        fixture.detectChanges();

        const items: HTMLLIElement[] = Array.from(fixture.nativeElement.querySelectorAll('li'));
        expect(items.length).toBe(2);
        expect(items[0].textContent).toContain('No hay datos en este día.');
        expect(items[0].querySelector('lucide-icon')).toBeTruthy();
        expect(items[1].textContent).toContain('Podés agregarlo de forma diferida.');
        expect(items[1].querySelector('lucide-icon')).toBeTruthy();
    });
});
