import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormUserProfile } from './form-user-profile';

describe('FormUserProfile', () => {
  let component: FormUserProfile;
  let fixture: ComponentFixture<FormUserProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormUserProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormUserProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
