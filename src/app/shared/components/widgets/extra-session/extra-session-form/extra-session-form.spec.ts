import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraSessionForm } from './extra-session-form';

describe('ExtraSessionForm', () => {
  let component: ExtraSessionForm;
  let fixture: ComponentFixture<ExtraSessionForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtraSessionForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtraSessionForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
