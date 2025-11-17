import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyRoutinePlanner } from './weekly-routine-planner';

describe('WeeklyRoutinePlanner', () => {
  let component: WeeklyRoutinePlanner;
  let fixture: ComponentFixture<WeeklyRoutinePlanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeeklyRoutinePlanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeeklyRoutinePlanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
