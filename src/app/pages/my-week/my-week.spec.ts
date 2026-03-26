import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyWeek } from './my-week';

describe('MyWeek', () => {
    let component: MyWeek;
    let fixture: ComponentFixture<MyWeek>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MyWeek],
        }).compileComponents();

        fixture = TestBed.createComponent(MyWeek);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
