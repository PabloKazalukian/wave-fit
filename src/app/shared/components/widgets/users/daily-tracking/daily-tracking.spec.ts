import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DailyTracking } from './daily-tracking';
import { PlanDayService } from '../../../../../core/services/day-logs/plan-day.service';

describe('DailyTracking', () => {
  let component: DailyTracking;
  let fixture: ComponentFixture<DailyTracking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyTracking],
      providers: [
        {
          provide: PlanDayService,
          useValue: {
            findAll: () => of([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyTracking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});