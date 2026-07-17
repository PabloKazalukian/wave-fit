import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoachNavigatorWeek } from './coach-navigator-week';

describe('CoachNavigatorWeek', () => {
  let component: CoachNavigatorWeek;
  let fixture: ComponentFixture<CoachNavigatorWeek>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoachNavigatorWeek]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoachNavigatorWeek);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
