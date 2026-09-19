import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { InputNumber } from './input-number';

describe('InputNumber', () => {
    let component: InputNumber;
    let fixture: ComponentFixture<InputNumber>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InputNumber],
        }).compileComponents();

        fixture = TestBed.createComponent(InputNumber);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('control', new FormControl(0));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
