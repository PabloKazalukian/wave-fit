import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExercisesTable } from './exercises-table';

describe('ExercisesTable', () => {
  let component: ExercisesTable;
  let fixture: ComponentFixture<ExercisesTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExercisesTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExercisesTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
