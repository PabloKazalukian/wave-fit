import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Trackings } from './trackings';

describe('Trackings', () => {
  let component: Trackings;
  let fixture: ComponentFixture<Trackings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Trackings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Trackings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
