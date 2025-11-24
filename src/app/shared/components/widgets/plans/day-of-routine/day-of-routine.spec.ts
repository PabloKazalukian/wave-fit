import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DayOfRoutine } from './day-of-routine';

describe('DayOfRoutine', () => {
  let component: DayOfRoutine;
  let fixture: ComponentFixture<DayOfRoutine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DayOfRoutine]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DayOfRoutine);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
