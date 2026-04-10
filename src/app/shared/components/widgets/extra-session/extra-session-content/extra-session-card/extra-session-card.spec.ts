import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraSessionCard } from './extra-session-card';

describe('ExtraSessionCard', () => {
  let component: ExtraSessionCard;
  let fixture: ComponentFixture<ExtraSessionCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtraSessionCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtraSessionCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
