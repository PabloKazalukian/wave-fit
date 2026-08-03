import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoachManageWithPlan } from './coach-manage-with-plan';

describe('CoachManageWithPlan', () => {
  let component: CoachManageWithPlan;
  let fixture: ComponentFixture<CoachManageWithPlan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoachManageWithPlan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoachManageWithPlan);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
