import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeekDayCell } from './week-day-cell';

describe('WeekDayCell', () => {
  let component: WeekDayCell;
  let fixture: ComponentFixture<WeekDayCell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeekDayCell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeekDayCell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
