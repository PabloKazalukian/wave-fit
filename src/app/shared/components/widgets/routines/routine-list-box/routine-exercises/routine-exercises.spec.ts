import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutineExercises } from './routine-exercises';

describe('RoutineExercises', () => {
  let component: RoutineExercises;
  let fixture: ComponentFixture<RoutineExercises>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutineExercises]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutineExercises);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
