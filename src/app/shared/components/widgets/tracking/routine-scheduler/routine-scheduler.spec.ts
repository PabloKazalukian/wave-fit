import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutineScheduler } from './routine-scheduler';

describe('RoutineScheduler', () => {
  let component: RoutineScheduler;
  let fixture: ComponentFixture<RoutineScheduler>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutineScheduler]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutineScheduler);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
