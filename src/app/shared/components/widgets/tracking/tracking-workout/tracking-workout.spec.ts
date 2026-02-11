import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingWorkoutComponent } from './tracking-workout';

describe('RoutineTrackingExercise', () => {
    let component: TrackingWorkoutComponent;
    let fixture: ComponentFixture<TrackingWorkoutComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TrackingWorkoutComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TrackingWorkoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
