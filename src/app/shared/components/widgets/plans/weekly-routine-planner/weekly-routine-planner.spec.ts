import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyRoutinePlannerComponent } from './weekly-routine-planner';

describe('WeeklyRoutinePlanner', () => {
    let component: WeeklyRoutinePlannerComponent;
    let fixture: ComponentFixture<WeeklyRoutinePlannerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WeeklyRoutinePlannerComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(WeeklyRoutinePlannerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
