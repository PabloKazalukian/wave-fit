import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkoutInProgess } from './workout-in-progess';

describe('WorkoutInProgess', () => {
  let component: WorkoutInProgess;
  let fixture: ComponentFixture<WorkoutInProgess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkoutInProgess]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkoutInProgess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
