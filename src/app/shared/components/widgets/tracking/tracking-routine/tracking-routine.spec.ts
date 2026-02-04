import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingRoutine } from './tracking-routine';

describe('TrackingRoutine', () => {
  let component: TrackingRoutine;
  let fixture: ComponentFixture<TrackingRoutine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackingRoutine]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackingRoutine);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
