import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkoutCompleteList } from './workout-complete-list';

describe('WorkoutCompleteList', () => {
  let component: WorkoutCompleteList;
  let fixture: ComponentFixture<WorkoutCompleteList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkoutCompleteList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkoutCompleteList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
