import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoachManage } from './coach-manage';

describe('CoachManage', () => {
  let component: CoachManage;
  let fixture: ComponentFixture<CoachManage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoachManage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoachManage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
