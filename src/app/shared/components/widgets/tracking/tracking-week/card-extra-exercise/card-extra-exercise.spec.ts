import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardExtraExercise } from './card-extra-exercise';

describe('CardExtraExercise', () => {
  let component: CardExtraExercise;
  let fixture: ComponentFixture<CardExtraExercise>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardExtraExercise]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardExtraExercise);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
