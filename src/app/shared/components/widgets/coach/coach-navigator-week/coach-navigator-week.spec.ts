import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoachNavigatorWeek } from './coach-navigator-week';
import { TrackingVM } from '../../../../interfaces/tracking.interface';

describe('CoachNavigatorWeek', () => {
    let component: CoachNavigatorWeek;
    let fixture: ComponentFixture<CoachNavigatorWeek>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CoachNavigatorWeek],
        }).compileComponents();

        fixture = TestBed.createComponent(CoachNavigatorWeek);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('tracking', { workouts: [] } as unknown as TrackingVM);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
