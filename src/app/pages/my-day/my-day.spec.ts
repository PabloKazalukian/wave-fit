import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyDay } from './my-day';

describe('MyDay', () => {
  let component: MyDay;
  let fixture: ComponentFixture<MyDay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyDay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyDay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
