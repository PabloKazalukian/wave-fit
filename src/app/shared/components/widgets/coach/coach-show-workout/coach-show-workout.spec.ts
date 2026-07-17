import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoachShowWorkout } from './coach-show-workout';

describe('CoachShowWorkout', () => {
  let component: CoachShowWorkout;
  let fixture: ComponentFixture<CoachShowWorkout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoachShowWorkout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoachShowWorkout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
