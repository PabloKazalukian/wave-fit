import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExerciseSelector } from './exercise-selector';

describe('ExerciseSelector', () => {
  let component: ExerciseSelector;
  let fixture: ComponentFixture<ExerciseSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExerciseSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
