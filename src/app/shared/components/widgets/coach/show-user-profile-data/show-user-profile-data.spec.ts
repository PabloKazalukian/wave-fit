import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowUserProfileData } from './show-user-profile-data';

describe('ShowUserProfileData', () => {
  let component: ShowUserProfileData;
  let fixture: ComponentFixture<ShowUserProfileData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowUserProfileData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowUserProfileData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
