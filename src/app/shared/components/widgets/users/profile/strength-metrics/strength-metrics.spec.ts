import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StrengthMetrics } from './strength-metrics';

describe('StrengthMetrics', () => {
  let component: StrengthMetrics;
  let fixture: ComponentFixture<StrengthMetrics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StrengthMetrics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StrengthMetrics);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
