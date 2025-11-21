import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutineForm } from './routine-form';

describe('RoutineForm', () => {
  let component: RoutineForm;
  let fixture: ComponentFixture<RoutineForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutineForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutineForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
