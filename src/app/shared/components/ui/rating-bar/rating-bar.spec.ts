import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatingBar } from './rating-bar';

describe('RatingBar', () => {
  let component: RatingBar;
  let fixture: ComponentFixture<RatingBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatingBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RatingBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
