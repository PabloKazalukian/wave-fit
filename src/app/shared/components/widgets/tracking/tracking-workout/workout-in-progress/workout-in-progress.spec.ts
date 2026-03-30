import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkoutInProgress } from './workout-in-progress';

describe('WorkoutInProgress', () => {
    let component: WorkoutInProgress;
    let fixture: ComponentFixture<WorkoutInProgress>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutInProgress],
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutInProgress);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
