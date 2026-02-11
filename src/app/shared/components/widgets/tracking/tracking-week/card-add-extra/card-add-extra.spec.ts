import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAddExtra } from './card-add-extra';

describe('CardAddExtra', () => {
  let component: CardAddExtra;
  let fixture: ComponentFixture<CardAddExtra>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardAddExtra]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardAddExtra);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
