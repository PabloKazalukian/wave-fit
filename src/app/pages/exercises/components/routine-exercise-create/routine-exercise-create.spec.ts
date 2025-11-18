import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutineExerciseCreate } from './routine-exercise-create';

describe('RoutineExerciseCreate', () => {
  let component: RoutineExerciseCreate;
  let fixture: ComponentFixture<RoutineExerciseCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutineExerciseCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutineExerciseCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
