import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingPerformance } from './training-performance';

describe('TrainingPerformance', () => {
  let component: TrainingPerformance;
  let fixture: ComponentFixture<TrainingPerformance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingPerformance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainingPerformance);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
