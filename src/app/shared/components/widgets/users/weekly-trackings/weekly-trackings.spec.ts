import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyTrackings } from './weekly-trackings';

describe('WeeklyTrackings', () => {
  let component: WeeklyTrackings;
  let fixture: ComponentFixture<WeeklyTrackings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeeklyTrackings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeeklyTrackings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
