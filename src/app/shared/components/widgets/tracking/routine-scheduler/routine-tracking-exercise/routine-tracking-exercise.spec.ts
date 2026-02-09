import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutineTrackingExercise } from './routine-tracking-exercise';

describe('RoutineTrackingExercise', () => {
  let component: RoutineTrackingExercise;
  let fixture: ComponentFixture<RoutineTrackingExercise>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutineTrackingExercise]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutineTrackingExercise);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
