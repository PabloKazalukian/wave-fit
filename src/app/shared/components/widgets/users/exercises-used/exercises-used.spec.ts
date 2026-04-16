import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExercisesUsed } from './exercises-used';

describe('ExercisesUsed', () => {
  let component: ExercisesUsed;
  let fixture: ComponentFixture<ExercisesUsed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExercisesUsed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExercisesUsed);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
