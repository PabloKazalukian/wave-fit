import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutinesUsed } from './routines-used';

describe('RoutinesUsed', () => {
  let component: RoutinesUsed;
  let fixture: ComponentFixture<RoutinesUsed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutinesUsed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutinesUsed);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
