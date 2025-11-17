import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutineListBox } from './routine-list-box';

describe('RoutineListBox', () => {
  let component: RoutineListBox;
  let fixture: ComponentFixture<RoutineListBox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutineListBox]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutineListBox);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
