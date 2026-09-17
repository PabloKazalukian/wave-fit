import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { RatingBar } from './rating-bar';

describe('RatingBar', () => {
    let component: RatingBar;
    let fixture: ComponentFixture<RatingBar>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RatingBar],
        }).compileComponents();

        fixture = TestBed.createComponent(RatingBar);
        component = fixture.componentInstance;
        component.control = new FormControl(null);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
