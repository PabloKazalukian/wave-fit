import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingWeekComponent } from './tracking-week';

describe('RoutineScheduler', () => {
    let component: TrackingWeekComponent;
    let fixture: ComponentFixture<TrackingWeekComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TrackingWeekComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TrackingWeekComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
