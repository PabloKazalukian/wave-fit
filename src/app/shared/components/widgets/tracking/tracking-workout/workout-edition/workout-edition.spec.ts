import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkoutEdition } from './workout-edition';

describe('WorkoutEdition', () => {
  let component: WorkoutEdition;
  let fixture: ComponentFixture<WorkoutEdition>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkoutEdition]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkoutEdition);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
