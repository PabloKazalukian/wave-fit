import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MacroNutrients } from './macro-nutrients';

describe('MacroNutrients', () => {
  let component: MacroNutrients;
  let fixture: ComponentFixture<MacroNutrients>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MacroNutrients]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MacroNutrients);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
