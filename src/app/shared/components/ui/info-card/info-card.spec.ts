import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Activity } from 'lucide-angular';

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
});
