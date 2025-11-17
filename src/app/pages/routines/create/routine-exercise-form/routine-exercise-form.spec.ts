import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutineExerciseForm } from './routine-exercise-form';

describe('RoutineExerciseForm', () => {
  let component: RoutineExerciseForm;
  let fixture: ComponentFixture<RoutineExerciseForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutineExerciseForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutineExerciseForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
