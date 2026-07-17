import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPlanTracking } from './show-plan-tracking';

describe('ShowPlanTracking', () => {
  let component: ShowPlanTracking;
  let fixture: ComponentFixture<ShowPlanTracking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowPlanTracking]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowPlanTracking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
