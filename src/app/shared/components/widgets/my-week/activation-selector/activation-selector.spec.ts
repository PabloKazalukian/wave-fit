import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivationSelector } from './activation-selector';

describe('ActivationSelector', () => {
  let component: ActivationSelector;
  let fixture: ComponentFixture<ActivationSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivationSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivationSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
