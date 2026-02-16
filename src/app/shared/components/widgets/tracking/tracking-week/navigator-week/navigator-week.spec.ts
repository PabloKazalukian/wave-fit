import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigatorWeek } from './navigator-week';

describe('NavigatorWeek', () => {
  let component: NavigatorWeek;
  let fixture: ComponentFixture<NavigatorWeek>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigatorWeek]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigatorWeek);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
