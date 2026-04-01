import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkoutActionsMenu } from './workout-actions-menu';

describe('WorkoutActionsMenu', () => {
  let component: WorkoutActionsMenu;
  let fixture: ComponentFixture<WorkoutActionsMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkoutActionsMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkoutActionsMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
